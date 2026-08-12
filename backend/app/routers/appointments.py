from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.auth import get_current_user, require_staff, require_medical

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("", response_model=List[AppointmentResponse])
def get_appointments(
    doctor_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    date_filter: Optional[date] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Appointment).join(Patient).join(Doctor)
    
    # Scoping data based on role
    if current_user.role == "Patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            return []
        query = query.filter(Appointment.patient_id == patient.id)
    elif current_user.role == "Doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            return []
        query = query.filter(Appointment.doctor_id == doctor.id)

    # Apply filters
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if date_filter:
        query = query.filter(Appointment.date == date_filter)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    if search:
        query = query.filter(
            or_(
                Patient.full_name.ilike(f"%{search}%"),
                Doctor.full_name.ilike(f"%{search}%"),
                Doctor.department.ilike(f"%{search}%")
            )
        )
        
    return query.order_by(Appointment.date.desc(), Appointment.time.asc()).all()

@router.get("/{id}", response_model=AppointmentResponse)
def get_appointment(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
        
    # Scoping checks
    if current_user.role == "Patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this appointment"
            )
    elif current_user.role == "Doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this appointment"
            )
            
    return appointment

@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
        
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    # Validate time slot format
    if payload.time not in doctor.available_slots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Time slot {payload.time} is not in Doctor's available slots: {doctor.available_slots}"
        )

    # Prevent double booking of same doctor at same date and time
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == payload.doctor_id,
        Appointment.date == payload.date,
        Appointment.time == payload.time,
        Appointment.status == "Booked"
    ).first()
    
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is already booked for this date and time slot."
        )

    appointment = Appointment(
        patient_id=payload.patient_id,
        doctor_id=payload.doctor_id,
        date=payload.date,
        time=payload.time,
        status="Booked"
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.put("/{id}", response_model=AppointmentResponse)
def update_appointment(
    id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    # Authorization Check
    # Doctors can complete/cancel their own appointments
    # Receptionists/Admins can edit everything
    # Patients cannot update appointments directly through PUT (they must cancel using DELETE)
    is_authorized = False
    if current_user.role in ["Admin", "Receptionist"]:
        is_authorized = True
    elif current_user.role == "Doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor and appointment.doctor_id == doctor.id:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this appointment"
        )

    update_data = payload.model_dump(exclude_unset=True)
    
    # Conflict check if date, time, or doctor is being updated
    new_doc_id = update_data.get("doctor_id", appointment.doctor_id)
    new_date = update_data.get("date", appointment.date)
    new_time = update_data.get("time", appointment.time)
    new_status = update_data.get("status", appointment.status)

    if (new_doc_id != appointment.doctor_id or 
        new_date != appointment.date or 
        new_time != appointment.time) and new_status == "Booked":
        
        # Verify doctor availability
        doctor = db.query(Doctor).filter(Doctor.id == new_doc_id).first()
        if not doctor:
             raise HTTPException(
                 status_code=status.HTTP_404_NOT_FOUND,
                 detail="Doctor not found"
             )
        if new_time not in doctor.available_slots:
             raise HTTPException(
                 status_code=status.HTTP_400_BAD_REQUEST,
                 detail=f"Time slot {new_time} is not in Doctor's available slots"
             )

        conflict = db.query(Appointment).filter(
            Appointment.doctor_id == new_doc_id,
            Appointment.date == new_date,
            Appointment.time == new_time,
            Appointment.status == "Booked",
            Appointment.id != id
        ).first()
        
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Doctor is already booked for this date and time slot."
            )

    for key, value in update_data.items():
        setattr(appointment, key, value)
        
    db.commit()
    db.refresh(appointment)
    return appointment

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def cancel_appointment(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    # Patients can cancel their own, staff can cancel any
    is_authorized = False
    if current_user.role in ["Admin", "Receptionist"]:
        is_authorized = True
    elif current_user.role == "Patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient and appointment.patient_id == patient.id:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this appointment"
        )

    # Cancel the appointment by setting its status to 'Cancelled'
    appointment.status = "Cancelled"
    db.commit()
    return {"message": "Appointment cancelled successfully"}

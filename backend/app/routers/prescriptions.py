from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.schemas import PrescriptionCreate, PrescriptionResponse
from app.auth import get_current_user, require_doctor

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.get("/{patientId}", response_model=List[PrescriptionResponse])
def get_prescriptions(
    patientId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patientId).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Scoping check: Patients can only retrieve their own prescriptions
    if current_user.role == "Patient":
        if patient.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view these prescriptions"
            )
            
    # Doctor, Receptionist, Admin can view
    return db.query(Prescription).filter(Prescription.patient_id == patientId).order_by(Prescription.created_at.desc()).all()

@router.post("", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_prescription(
    payload: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
        
    # Verify doctor profile exists for logged-in user
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor profile not found for authenticated user"
        )

    # Double check payload matching doctor
    if payload.doctor_id != doctor.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only prescribe medicine for your own consultations"
        )

    # Create prescription
    prescription = Prescription(
        patient_id=payload.patient_id,
        doctor_id=doctor.id,
        appointment_id=payload.appointment_id,
        medicine_name=payload.medicine_name,
        dosage=payload.dosage,
        duration=payload.duration,
        doctor_notes=payload.doctor_notes
    )
    db.add(prescription)
    
    # Auto-complete appointment if appointment_id is provided
    if payload.appointment_id:
        appointment = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
        if appointment:
            appointment.status = "Completed"
            db.add(appointment)
            
    db.commit()
    db.refresh(prescription)
    return prescription

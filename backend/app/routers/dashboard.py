from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    
    if current_user.role == "Admin":
        total_doctors = db.query(Doctor).count()
        total_patients = db.query(Patient).count()
        total_appointments = db.query(Appointment).count()
        
        # Today's appointments (all statuses)
        todays_appointments = db.query(Appointment).filter(Appointment.date == today).all()
        
        # Format today's appointments response
        todays_appointments_formatted = []
        for appt in todays_appointments:
            todays_appointments_formatted.append({
                "id": appt.id,
                "patient_name": appt.patient.full_name if appt.patient else "Unknown",
                "doctor_name": appt.doctor.full_name if appt.doctor else "Unknown",
                "department": appt.doctor.department if appt.doctor else "Unknown",
                "time": appt.time,
                "status": appt.status
            })

        return {
            "role": "Admin",
            "stats": {
                "total_doctors": total_doctors,
                "total_patients": total_patients,
                "total_appointments": total_appointments,
                "todays_appointments_count": len(todays_appointments)
            },
            "todays_appointments": todays_appointments_formatted
        }
        
    elif current_user.role == "Receptionist":
        # Today's appointments
        todays_appts = db.query(Appointment).filter(
            Appointment.date == today
        ).order_by(Appointment.time.asc()).all()
        
        # Upcoming appointments (future date, status Booked)
        upcoming_appts = db.query(Appointment).filter(
            Appointment.date > today,
            Appointment.status == "Booked"
        ).order_by(Appointment.date.asc(), Appointment.time.asc()).all()
        
        def format_appt(appt):
            return {
                "id": appt.id,
                "patient_name": appt.patient.full_name if appt.patient else "Unknown",
                "doctor_name": appt.doctor.full_name if appt.doctor else "Unknown",
                "department": appt.doctor.department if appt.doctor else "Unknown",
                "date": str(appt.date),
                "time": appt.time,
                "status": appt.status
            }

        return {
            "role": "Receptionist",
            "stats": {
                "todays_appointments_count": len(todays_appts),
                "upcoming_appointments_count": len(upcoming_appts)
            },
            "todays_appointments": [format_appt(a) for a in todays_appts],
            "upcoming_appointments": [format_appt(a) for a in upcoming_appts]
        }
        
    elif current_user.role == "Doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor profile not found for current user"
            )
            
        # Today's schedule for this doctor
        todays_schedule = db.query(Appointment).filter(
            Appointment.doctor_id == doctor.id,
            Appointment.date == today
        ).order_by(Appointment.time.asc()).all()
        
        # Completed consultations count (all time or today? Let's do all time)
        completed_count = db.query(Appointment).filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status == "Completed"
        ).count()
        
        def format_doc_appt(appt):
            return {
                "id": appt.id,
                "patient_id": appt.patient.id if appt.patient else None,
                "patient_name": appt.patient.full_name if appt.patient else "Unknown",
                "patient_age": appt.patient.age if appt.patient else None,
                "patient_gender": appt.patient.gender if appt.patient else None,
                "time": appt.time,
                "status": appt.status
            }
            
        return {
            "role": "Doctor",
            "stats": {
                "todays_appointments_count": len(todays_schedule),
                "completed_consultations_count": completed_count
            },
            "todays_schedule": [format_doc_appt(a) for a in todays_schedule]
        }
        
    elif current_user.role == "Patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found for current user"
            )
            
        # Upcoming appointments
        upcoming = db.query(Appointment).filter(
            Appointment.patient_id == patient.id,
            Appointment.date >= today,
            Appointment.status == "Booked"
        ).order_by(Appointment.date.asc(), Appointment.time.asc()).all()
        
        # Previous appointments (either in the past, or completed/cancelled)
        previous = db.query(Appointment).filter(
            Appointment.patient_id == patient.id,
            (Appointment.date < today) | (Appointment.status.in_(["Completed", "Cancelled"]))
        ).order_by(Appointment.date.desc(), Appointment.time.desc()).all()
        
        # Prescriptions
        prescriptions = db.query(Prescription).filter(
            Prescription.patient_id == patient.id
        ).order_by(Prescription.created_at.desc()).all()
        
        def format_patient_appt(appt):
            return {
                "id": appt.id,
                "doctor_name": appt.doctor.full_name if appt.doctor else "Unknown",
                "department": appt.doctor.department if appt.doctor else "Unknown",
                "date": str(appt.date),
                "time": appt.time,
                "status": appt.status
            }
            
        def format_rx(rx):
            return {
                "id": rx.id,
                "doctor_name": rx.doctor.full_name if rx.doctor else "Unknown",
                "medicine_name": rx.medicine_name,
                "dosage": rx.dosage,
                "duration": rx.duration,
                "doctor_notes": rx.doctor_notes,
                "created_at": rx.created_at.strftime("%Y-%m-%d %H:%M:%S")
            }
            
        return {
            "role": "Patient",
            "stats": {
                "upcoming_appointments_count": len(upcoming),
                "previous_appointments_count": len(previous),
                "prescriptions_count": len(prescriptions)
            },
            "upcoming_appointments": [format_patient_appt(a) for a in upcoming],
            "previous_appointments": [format_patient_appt(a) for a in previous],
            "prescriptions": [format_rx(r) for r in prescriptions]
        }
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user role"
        )

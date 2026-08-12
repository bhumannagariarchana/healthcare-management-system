from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.schemas import PatientCreate, PatientUpdate, PatientResponse
from app.auth import get_current_user, require_staff, get_password_hash

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
def get_patients(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Patient role can't list all patients
    if current_user.role == "Patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patients are not authorized to view the patients registry"
        )
        
    query = db.query(Patient)
    if search:
        query = query.filter(
            or_(
                Patient.full_name.ilike(f"%{search}%"),
                Patient.email.ilike(f"%{search}%"),
                Patient.phone_number.ilike(f"%{search}%")
            )
        )
    return query.all()

@router.get("/{id}", response_model=PatientResponse)
def get_patient(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
        
    # Security check: patients can only access their own records
    if current_user.role == "Patient":
        if patient.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this patient record"
            )
            
    return patient

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    # Verify email is unique
    existing_patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )
        
    existing_user = db.query(User).filter(User.username == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email as username already exists"
        )

    # Receptionist registers patient -> Create user login (username=email)
    password = payload.password or "Patient@123"
    password_hash = get_password_hash(password)
    
    db_user = User(
        username=payload.email,
        password_hash=password_hash,
        role="Patient"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    db_patient = Patient(
        user_id=db_user.id,
        full_name=payload.full_name,
        age=payload.age,
        gender=payload.gender,
        phone_number=payload.phone_number,
        email=payload.email
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    
    return db_patient

@router.put("/{id}", response_model=PatientResponse)
def update_patient(
    id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Patients can only edit themselves, staff can edit any patient
    if current_user.role == "Patient" and patient.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this patient record"
        )
    elif current_user.role not in ["Admin", "Receptionist", "Patient"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit patient information"
        )

    # Perform updates
    update_data = payload.model_dump(exclude_unset=True)
    password = update_data.pop("password", None)
    
    if password and patient.user:
        patient.user.password_hash = get_password_hash(password)
        
    for key, value in update_data.items():
        setattr(patient, key, value)
        
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_patient(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Cascade delete is handled by database/SQLAlchemy relationships
    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted successfully"}

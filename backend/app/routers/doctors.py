from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.doctor import Doctor
from app.schemas import DoctorCreate, DoctorUpdate, DoctorResponse
from app.auth import get_current_user, require_admin, get_password_hash

router = APIRouter(prefix="/doctors", tags=["Doctors"])

@router.get("", response_model=List[DoctorResponse])
def get_doctors(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Doctor)
    if search:
        query = query.filter(
            or_(
                Doctor.full_name.ilike(f"%{search}%"),
                Doctor.department.ilike(f"%{search}%")
            )
        )
    return query.all()

@router.get("/{id}", response_model=DoctorResponse)
def get_doctor(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    return doctor

@router.post("", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(
    payload: DoctorCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    # Verify email is unique
    existing_doctor = db.query(Doctor).filter(Doctor.email == payload.email).first()
    if existing_doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor with this email already registered"
        )
        
    existing_user = db.query(User).filter(User.username == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Admin creates Doctor -> Create user login (username=email, role=Doctor)
    password_hash = get_password_hash(payload.password)
    db_user = User(
        username=payload.email,
        password_hash=password_hash,
        role="Doctor"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    db_doctor = Doctor(
        user_id=db_user.id,
        full_name=payload.full_name,
        department=payload.department,
        experience=payload.experience,
        available_slots=payload.available_slots,
        email=payload.email
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    
    return db_doctor

@router.put("/{id}", response_model=DoctorResponse)
def update_doctor(
    id: int,
    payload: DoctorUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    doctor = db.query(Doctor).filter(Doctor.id == id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    # Perform updates
    update_data = payload.model_dump(exclude_unset=True)
    password = update_data.pop("password", None)
    
    if password and doctor.user:
        doctor.user.password_hash = get_password_hash(password)
        
    for key, value in update_data.items():
        setattr(doctor, key, value)
        
    db.commit()
    db.refresh(doctor)
    return doctor

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_doctor(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    doctor = db.query(Doctor).filter(Doctor.id == id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
        
    # Delete the doctor (will cascade to delete the user via relationship or manual handling)
    db.delete(doctor)
    db.commit()
    return {"message": "Doctor deleted successfully"}

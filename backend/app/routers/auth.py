from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas import (
    LoginRequest, Token, RegisterRequest, UserResponse,
    ReceptionistCreate, ReceptionistResponse
)
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user, require_admin

router = APIRouter(tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_patient(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == payload.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Check if patient email already exists
    existing_patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )

    # Create user
    password_hash = get_password_hash(payload.password)
    db_user = User(
        username=payload.username,
        password_hash=password_hash,
        role="Patient"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create patient profile linked to user
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
    
    return {"message": "User registered successfully", "username": db_user.username}

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "user_id": user.id
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    # JWT is stateless, so we confirm logout. UI clears storage
    return {"message": "Successfully logged out"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    res = {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "created_at": current_user.created_at,
        "patient_id": None,
        "doctor_id": None,
        "full_name": current_user.username
    }
    
    if current_user.role == "Patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            res["patient_id"] = patient.id
            res["full_name"] = patient.full_name
            res["email"] = patient.email
            res["phone_number"] = patient.phone_number
            res["age"] = patient.age
            res["gender"] = patient.gender
    elif current_user.role == "Doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            res["doctor_id"] = doctor.id
            res["full_name"] = doctor.full_name
            res["email"] = doctor.email
            res["department"] = doctor.department
            res["experience"] = doctor.experience
            res["available_slots"] = doctor.available_slots
    return res

# Admin management of receptionists
@router.post("/receptionists", response_model=ReceptionistResponse, status_code=status.HTTP_201_CREATED)
def create_receptionist(payload: ReceptionistCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    password_hash = get_password_hash(payload.password)
    user = User(
        username=payload.username,
        password_hash=password_hash,
        role="Receptionist"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/receptionists", response_model=List[ReceptionistResponse])
def get_receptionists(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).filter(User.role == "Receptionist").all()

@router.delete("/receptionists/{id}", status_code=status.HTTP_200_OK)
def delete_receptionist(id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == id, User.role == "Receptionist").first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receptionist not found"
        )
    db.delete(user)
    db.commit()
    return {"message": "Receptionist deleted successfully"}

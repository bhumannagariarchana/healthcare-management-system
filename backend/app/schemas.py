from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import date, datetime

# --- Token & Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    user_id: int

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    age: int
    gender: str
    phone_number: str
    email: EmailStr

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Doctor Schemas ---
class DoctorBase(BaseModel):
    full_name: str
    department: str
    experience: int
    available_slots: List[str]
    email: EmailStr

class DoctorCreate(DoctorBase):
    # To create a doctor, admin also provides a password for their login
    password: str

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    experience: Optional[int] = None
    available_slots: Optional[List[str]] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None # Allow updating password

class DoctorResponse(DoctorBase):
    id: int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- Patient Schemas ---
class PatientBase(BaseModel):
    full_name: str
    age: int
    gender: str
    phone_number: str
    email: EmailStr

class PatientCreate(PatientBase):
    password: Optional[str] = None # Optional login password. If not provided, receptionist creates user account without dashboard login or creates default

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- Appointment Schemas ---
class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    date: date
    time: str # e.g. "09:00"

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    date: Optional[date] = None
    time: Optional[str] = None
    status: Optional[str] = None # 'Booked', 'Completed', 'Cancelled'

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    date: date
    time: str
    status: str
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True

# --- Prescription Schemas ---
class PrescriptionBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    medicine_name: str
    dosage: str
    duration: str
    doctor_notes: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionResponse(PrescriptionBase):
    id: int
    created_at: datetime
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True

# --- Receptionist Creation ---
class ReceptionistCreate(BaseModel):
    username: str
    password: str

class ReceptionistResponse(BaseModel):
    id: int
    username: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

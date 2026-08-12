import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date, timedelta

from app.database import Base, get_db
from app.main import app
from app.auth import get_password_hash

# Set up clean SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_records.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Re-create database schemas for testing
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Apply dependency override
app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_users():
    db = TestingSessionLocal()
    
    # Create test users
    from app.models.user import User
    from app.models.doctor import Doctor
    from app.models.patient import Patient
    
    admin = User(
        username="test_admin@clinic.com",
        password_hash=get_password_hash("AdminPassword123"),
        role="Admin"
    )
    receptionist = User(
        username="test_receptionist@clinic.com",
        password_hash=get_password_hash("ReceptionistPassword123"),
        role="Receptionist"
    )
    doctor_user = User(
        username="test_doctor@clinic.com",
        password_hash=get_password_hash("DoctorPassword123"),
        role="Doctor"
    )
    
    db.add_all([admin, receptionist, doctor_user])
    db.commit()
    
    # Create doctor profile
    doctor_profile = Doctor(
        user_id=doctor_user.id,
        full_name="Dr. House Test",
        department="Diagnostics",
        experience=20,
        available_slots=["09:00", "10:00", "11:00"],
        email="test_doctor@clinic.com"
    )
    db.add(doctor_profile)
    
    # Create patient profile & user
    patient_user = User(
        username="test_patient@clinic.com",
        password_hash=get_password_hash("PatientPassword123"),
        role="Patient"
    )
    db.add(patient_user)
    db.commit()
    
    patient_profile = Patient(
        user_id=patient_user.id,
        full_name="Bob Patient Test",
        age=30,
        gender="Male",
        phone_number="555-5678",
        email="test_patient@clinic.com"
    )
    db.add(patient_profile)
    
    db.commit()
    yield
    
    # Teardown database
    db.close()

def get_auth_headers(username, password):
    response = client.post("/login", json={"username": username, "password": password})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_login_success():
    response = client.post("/login", json={"username": "test_admin@clinic.com", "password": "AdminPassword123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "Admin"

def test_login_failure():
    response = client.post("/login", json={"username": "test_admin@clinic.com", "password": "WrongPassword"})
    assert response.status_code == 401

def test_register_patient():
    response = client.post("/register", json={
        "username": "selfregistered@clinic.com",
        "password": "RegisterPassword123",
        "full_name": "Charlie Register",
        "age": 42,
        "gender": "Male",
        "phone_number": "555-4321",
        "email": "selfregistered@clinic.com"
    })
    assert response.status_code == 201
    assert response.json()["username"] == "selfregistered@clinic.com"

def test_get_doctors_list():
    headers = get_auth_headers("test_patient@clinic.com", "PatientPassword123")
    response = client.get("/doctors", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert response.json()[0]["full_name"] == "Dr. House Test"

def test_appointment_booking_and_conflict():
    rec_headers = get_auth_headers("test_receptionist@clinic.com", "ReceptionistPassword123")
    
    # Book first appointment
    appt_date = str(date.today() + timedelta(days=5))
    response1 = client.post("/appointments", json={
        "patient_id": 1,
        "doctor_id": 1,
        "date": appt_date,
        "time": "09:00"
    }, headers=rec_headers)
    assert response1.status_code == 201
    assert response1.json()["status"] == "Booked"
    
    # Try double-booking the doctor at the same day/slot -> should fail!
    response2 = client.post("/appointments", json={
        "patient_id": 2, # different patient, same doctor/date/time
        "doctor_id": 1,
        "date": appt_date,
        "time": "09:00"
    }, headers=rec_headers)
    assert response2.status_code == 400
    assert "already booked" in response2.json()["detail"].lower()

def test_prescription_flow():
    doc_headers = get_auth_headers("test_doctor@clinic.com", "DoctorPassword123")
    
    # Add prescription (appointment id = 1, from test_appointment_booking_and_conflict)
    response = client.post("/prescriptions", json={
        "patient_id": 1,
        "doctor_id": 1,
        "appointment_id": 1,
        "medicine_name": "Vicodin",
        "dosage": "1 tablet",
        "duration": "7 days",
        "doctor_notes": "Take for pain management."
    }, headers=doc_headers)
    assert response.status_code == 201
    assert response.json()["medicine_name"] == "Vicodin"
    
    # Verify appointment is automatically marked as "Completed"
    headers = get_auth_headers("test_patient@clinic.com", "PatientPassword123")
    appt_resp = client.get("/appointments/1", headers=headers)
    assert appt_resp.status_code == 200
    assert appt_resp.json()["status"] == "Completed"

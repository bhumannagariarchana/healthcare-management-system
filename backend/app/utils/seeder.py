import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.auth import get_password_hash
from datetime import date, timedelta

logger = logging.getLogger("seeder")

def seed_db(db: Session):
    logger.info("Checking database and seeding default data...")
    
    # 1. Seed Admin
    admin_user = db.query(User).filter(User.username == "admin@healthcare.com").first()
    if not admin_user:
        admin_user = User(
            username="admin@healthcare.com",
            password_hash=get_password_hash("AdminPassword123"),
            role="Admin"
        )
        db.add(admin_user)
        logger.info("Admin user created: admin@healthcare.com / AdminPassword123")

    # 2. Seed Receptionist
    receptionist_user = db.query(User).filter(User.username == "receptionist@healthcare.com").first()
    if not receptionist_user:
        receptionist_user = User(
            username="receptionist@healthcare.com",
            password_hash=get_password_hash("ReceptionistPassword123"),
            role="Receptionist"
        )
        db.add(receptionist_user)
        logger.info("Receptionist user created: receptionist@healthcare.com / ReceptionistPassword123")

    # 3. Seed Doctors
    doc1_user = db.query(User).filter(User.username == "doctor@healthcare.com").first()
    if not doc1_user:
        doc1_user = User(
            username="doctor@healthcare.com",
            password_hash=get_password_hash("DoctorPassword123"),
            role="Doctor"
        )
        db.add(doc1_user)
        db.commit() # Commit to get ID
        
        doc1_profile = Doctor(
            user_id=doc1_user.id,
            full_name="Dr. John Doe",
            department="Cardiology",
            experience=15,
            available_slots=["09:00", "10:00", "11:00", "14:00", "15:00"],
            email="doctor@healthcare.com"
        )
        db.add(doc1_profile)
        logger.info("Doctor Dr. John Doe created: doctor@healthcare.com / DoctorPassword123")

    doc2_user = db.query(User).filter(User.username == "doctor2@healthcare.com").first()
    if not doc2_user:
        doc2_user = User(
            username="doctor2@healthcare.com",
            password_hash=get_password_hash("DoctorPassword123"),
            role="Doctor"
        )
        db.add(doc2_user)
        db.commit()
        
        doc2_profile = Doctor(
            user_id=doc2_user.id,
            full_name="Dr. Sarah Smith",
            department="Pediatrics",
            experience=8,
            available_slots=["10:00", "11:00", "12:00", "15:00", "16:00"],
            email="doctor2@healthcare.com"
        )
        db.add(doc2_profile)
        logger.info("Doctor Dr. Sarah Smith created: doctor2@healthcare.com / DoctorPassword123")

    # 4. Seed Patients
    pat1_user = db.query(User).filter(User.username == "patient@healthcare.com").first()
    if not pat1_user:
        pat1_user = User(
            username="patient@healthcare.com",
            password_hash=get_password_hash("PatientPassword123"),
            role="Patient"
        )
        db.add(pat1_user)
        db.commit()
        
        pat1_profile = Patient(
            user_id=pat1_user.id,
            full_name="Jane Smith",
            age=29,
            gender="Female",
            phone_number="123-456-7890",
            email="patient@healthcare.com"
        )
        db.add(pat1_profile)
        logger.info("Patient Jane Smith created: patient@healthcare.com / PatientPassword123")

    pat2_user = db.query(User).filter(User.username == "bob.jones@gmail.com").first()
    if not pat2_user:
        pat2_user = User(
            username="bob.jones@gmail.com",
            password_hash=get_password_hash("PatientPassword123"),
            role="Patient"
        )
        db.add(pat2_user)
        db.commit()
        
        pat2_profile = Patient(
            user_id=pat2_user.id,
            full_name="Bob Jones",
            age=45,
            gender="Male",
            phone_number="987-654-3210",
            email="bob.jones@gmail.com"
        )
        db.add(pat2_profile)
        logger.info("Patient Bob Jones created: bob.jones@gmail.com / PatientPassword123")

    db.commit()

    # 5. Seed some sample appointments and prescriptions if empty
    appts_count = db.query(Appointment).count()
    if appts_count == 0:
        # Get patient and doctor ids
        p1 = db.query(Patient).filter(Patient.email == "patient@healthcare.com").first()
        d1 = db.query(Doctor).filter(Doctor.email == "doctor@healthcare.com").first()
        d2 = db.query(Doctor).filter(Doctor.email == "doctor2@healthcare.com").first()
        
        if p1 and d1 and d2:
            # Past completed appointment
            past_date = date.today() - timedelta(days=2)
            appt_past = Appointment(
                patient_id=p1.id,
                doctor_id=d1.id,
                date=past_date,
                time="09:00",
                status="Completed"
            )
            db.add(appt_past)
            db.commit() # Commit to get ID
            
            # Seed a prescription for this past appointment
            rx = Prescription(
                patient_id=p1.id,
                doctor_id=d1.id,
                appointment_id=appt_past.id,
                medicine_name="Amoxicillin",
                dosage="500mg - twice a day",
                duration="5 days",
                doctor_notes="Take after food. Drink plenty of water."
            )
            db.add(rx)

            # Today's booked appointment
            appt_today = Appointment(
                patient_id=p1.id,
                doctor_id=d1.id,
                date=date.today(),
                time="10:00",
                status="Booked"
            )
            db.add(appt_today)

            # Future booked appointment
            future_date = date.today() + timedelta(days=2)
            appt_future = Appointment(
                patient_id=p1.id,
                doctor_id=d2.id,
                date=future_date,
                time="11:00",
                status="Booked"
            )
            db.add(appt_future)
            
            db.commit()
            logger.info("Sample appointments and prescriptions seeded successfully.")
            
    logger.info("Database seeding checked/completed.")

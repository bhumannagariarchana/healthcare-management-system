from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'Admin', 'Receptionist', 'Doctor', 'Patient'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    doctor = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    patient = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")

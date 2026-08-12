from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True)
    full_name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    experience = Column(Integer, nullable=False)
    available_slots = Column(JSON, nullable=False)  # e.g., ["09:00", "10:00", "11:00", "14:00", "15:00"]
    email = Column(String, unique=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="doctor", cascade="all, delete-orphan")

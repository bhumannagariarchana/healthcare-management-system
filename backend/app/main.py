import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.utils.seeder import seed_db
from app.routers.auth import router as auth_router
from app.routers.patients import router as patients_router
from app.routers.doctors import router as doctors_router
from app.routers.appointments import router as appointments_router
from app.routers.prescriptions import router as prescriptions_router
from app.routers.dashboard import router as dashboard_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Create database tables (runs on launch)
logger.info("Initializing database tables...")
Base.metadata.create_all(bind=engine)

# Seed database
try:
    db = next(get_db())
    seed_db(db)
except Exception as e:
    logger.error(f"Error seeding database: {e}")

# Initialize FastAPI App
app = FastAPI(
    title="Healthcare Management System API",
    description="Secure REST API backend for managing doctors, patients, appointments, and prescriptions.",
    version="1.0.0"
)

# CORS Configuration
# In production, specify allowed origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
# Mounting at root matches requested path endpoints: e.g. /register, /login, /patients, etc.
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(doctors_router)
app.include_router(appointments_router)
app.include_router(prescriptions_router)
app.include_router(dashboard_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the Full Stack Healthcare Management System REST API",
        "documentation": "/docs",
        "roles_supported": ["Admin", "Receptionist", "Doctor", "Patient"]
    }

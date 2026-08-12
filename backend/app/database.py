import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

db_url = settings.DATABASE_URL
engine = None

if db_url.startswith("postgresql"):
    try:
        # Create engine and test connection with a short timeout
        # Using connect_args for postgresql to set connection timeout
        temp_engine = create_engine(db_url, connect_args={"connect_timeout": 3})
        with temp_engine.connect() as conn:
            pass
        engine = temp_engine
        logger.info("Successfully connected to PostgreSQL database.")
    except Exception as e:
        logger.warning(f"Failed to connect to PostgreSQL ({e}). Falling back to SQLite.")
        db_url = "sqlite:///./healthcare.db"

if engine is None:
    connect_args = {}
    if db_url.startswith("sqlite") or "sqlite" in db_url:
        connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, connect_args=connect_args)
    logger.info(f"Using database: {db_url}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

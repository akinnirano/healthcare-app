from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# =========================================================
# DATABASE URL
# Example for PostgreSQL:
# postgresql://username:password@localhost:5432/dbname
# =========================================================
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://bestbrain:postgres@localhost:5432/healthcare_db")

# =========================================================
# SQLALCHEMY SETUP
# =========================================================
# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    future=True
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

# Base class for models
Base = declarative_base()

# =========================================================
# DEPENDENCY FOR FASTAPI
# =========================================================
def get_db() -> Session:
    """
    Dependency that provides a database session
    and closes it automatically after the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =========================================================
# UTILITY TO INITIALIZE DATABASE
# =========================================================
def init_db():
    """
    Import all models and create tables in the database.
    Run this once at startup or via a script.
    """
    from app.db import models  # Import all models
    Base.metadata.create_all(bind=engine)
    # Lightweight migration to ensure new columns exist when tables are already created
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS purpose VARCHAR(255)"))
    except Exception as _:
        # Safe to ignore; printed by echo logs if any
        pass
    print("Database tables created!")



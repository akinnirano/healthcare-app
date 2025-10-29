from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..db import models
from ..db.database import get_db

router = APIRouter()


@router.get("/union_staff", response_model=List[dict], summary="Join users with staff by user_id")
def union_staff(db: Session = Depends(get_db)):
    rows = (
        db.query(
            models.User.id.label("user_id"),
            models.User.full_name.label("name"),
            models.User.email.label("email"),
            models.Staff.id.label("staff_id"),
            models.Staff.latitude.label("latitude"),
            models.Staff.longitude.label("longitude"),
        )
        .join(models.Staff, models.Staff.user_id == models.User.id)
        .all()
    )
    return [
        {
            "user_id": r.user_id,
            "name": r.name,
            "email": r.email,
            "staff_id": r.staff_id,
            "latitude": r.latitude,
            "longitude": r.longitude,
        }
        for r in rows
    ]


@router.get("/union_patients", response_model=List[dict], summary="Join users with patients (by user_id if available, otherwise by email)")
def union_patients(db: Session = Depends(get_db)):
    # Prefer join on patient.user_id if the column exists; otherwise fallback to email equality
    # We detect availability by trying attribute access on model; SQLAlchemy will error if not present
    has_user_id = hasattr(models.Patient, "user_id")
    if has_user_id:
        q = (
            db.query(
                models.User.id.label("user_id"),
                models.User.full_name.label("name"),
                models.User.email.label("email"),
                models.Patient.id.label("patient_id"),
                models.Patient.address.label("address"),
                models.Patient.latitude.label("latitude"),
                models.Patient.longitude.label("longitude"),
            )
            .join(models.Patient, models.Patient.user_id == models.User.id)
        )
    else:
        q = (
            db.query(
                models.User.id.label("user_id"),
                models.User.full_name.label("name"),
                models.User.email.label("email"),
                models.Patient.id.label("patient_id"),
                models.Patient.address.label("address"),
                models.Patient.latitude.label("latitude"),
                models.Patient.longitude.label("longitude"),
            )
            .join(models.Patient, models.Patient.email == models.User.email)
        )
    rows = q.all()
    return [
        {
            "user_id": r.user_id,
            "name": r.name,
            "email": r.email,
            "patient_id": r.patient_id,
            "address": r.address,
            "latitude": r.latitude,
            "longitude": r.longitude,
        }
        for r in rows
    ]



from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import models, crud
from ..db.database import get_db
from .security import get_current_active_user

router = APIRouter()

@router.post("/", response_model=dict, summary="Create patient (public for registration)")
def create_patient(full_name: str, address: str = None, latitude: float = None, longitude: float = None, phone: str = None, email: str = None, db: Session = Depends(get_db)):
    patient = crud.create_patient(db, full_name, address, latitude, longitude, phone, email)
    return {"id": patient.id, "full_name": patient.full_name}

@router.get("/{patient_id}", response_model=dict, summary="Get patient (requires JWT)")
def get_patient(patient_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    patient = crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "address": patient.address,
        "latitude": patient.latitude,
        "longitude": patient.longitude,
        "email": patient.email,
        "phone": patient.phone,
    }

@router.get("/", response_model=List[dict], summary="List patients (requires JWT)")
def list_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    patients = crud.list_patients(db, skip=skip, limit=limit)
    return [{
        "id": p.id,
        "full_name": p.full_name,
        "address": p.address,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "email": p.email,
        "phone": p.phone,
    } for p in patients]

@router.put("/{patient_id}", response_model=dict, summary="Update patient (requires JWT)")
def update_patient(patient_id: int, full_name: str = None, address: str = None, latitude: float = None, longitude: float = None, phone: str = None, email: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    patient = crud.update_patient(db, patient_id, full_name=full_name, address=address, latitude=latitude, longitude=longitude, phone=phone, email=email)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"id": patient.id, "full_name": patient.full_name}

@router.delete("/{patient_id}", response_model=dict, summary="Delete patient (requires JWT)")
def delete_patient(patient_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    patient = crud.delete_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"detail": f"Patient {patient.full_name} deleted successfully"}

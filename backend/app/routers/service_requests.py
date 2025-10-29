from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import crud
from ..db.database import get_db

router = APIRouter()

@router.post("/", response_model=dict)
def create_request(patient_id: int, description: str, required_skill: str, db: Session = Depends(get_db)):
    sr = crud.create_service_request(db, patient_id=patient_id, description=description, required_skill=required_skill)
    return {"id": sr.id, "patient_id": sr.patient_id, "status": sr.status.value}

@router.get("/{request_id}", response_model=dict)
def get_request(request_id: int, db: Session = Depends(get_db)):
    sr = crud.get_service_request(db, request_id)
    if not sr:
        raise HTTPException(status_code=404, detail="Service request not found")
    return {"id": sr.id, "patient_id": sr.patient_id, "status": sr.status.value}

@router.get("/", response_model=List[dict])
def list_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    requests = crud.list_service_requests(db, skip=skip, limit=limit)
    return [{"id": r.id, "patient_id": r.patient_id, "status": r.status.value} for r in requests]

@router.put("/{request_id}", response_model=dict)
def update_request(request_id: int, description: str = None, required_skill: str = None, status: str = None, db: Session = Depends(get_db)):
    sr = crud.update_service_request(db, request_id, description=description, required_skill=required_skill, status=status)
    if not sr:
        raise HTTPException(status_code=404, detail="Service request not found")
    return {"id": sr.id, "patient_id": sr.patient_id, "status": sr.status.value}

@router.delete("/{request_id}", response_model=dict)
def delete_request(request_id: int, db: Session = Depends(get_db)):
    sr = crud.delete_service_request(db, request_id)
    if not sr:
        raise HTTPException(status_code=404, detail="Service request not found")
    return {"detail": f"Service request {sr.id} deleted successfully"}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import crud, models
from ..db.database import get_db

router = APIRouter()

@router.post("/", response_model=dict)
def create_visit(patient_id: int, staff_id: int, scheduled_time: str, notes: str = None, db: Session = Depends(get_db)):
    visit = crud.create_visit(db, patient_id=patient_id, staff_id=staff_id, scheduled_time=scheduled_time, notes=notes)
    return {"id": visit.id, "patient_id": visit.patient_id, "staff_id": visit.staff_id, "completed": visit.completed}

@router.get("/{visit_id}", response_model=dict)
def get_visit(visit_id: int, db: Session = Depends(get_db)):
    visit = crud.get_visit(db, visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"id": visit.id, "patient_id": visit.patient_id, "staff_id": visit.staff_id, "completed": visit.completed}

@router.put("/{visit_id}", response_model=dict)
def complete_visit(visit_id: int, completed: bool = True, db: Session = Depends(get_db)):
    visit = crud.update_visit(db, visit_id, completed=completed)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"id": visit.id, "patient_id": visit.patient_id, "staff_id": visit.staff_id, "completed": visit.completed}

@router.get("/", response_model=List[dict])
def list_visits(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Use direct ORM query to avoid relying on missing CRUD helpers
    visits = db.query(models.Visit).offset(skip).limit(limit).all()
    return [
        {"id": v.id, "patient_id": v.patient_id, "staff_id": v.staff_id, "completed": getattr(v, "completed", False)}
        for v in visits
    ]

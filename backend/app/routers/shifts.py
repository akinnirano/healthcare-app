from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import crud
from ..db.database import get_db

router = APIRouter()

@router.post("/", response_model=dict)
def start_shift(staff_id: int, start_lat: float = None, start_lng: float = None, purpose: str | None = None, db: Session = Depends(get_db)):
    shift = crud.start_shift(db, staff_id, start_lat, start_lng, purpose)
    return {"id": shift.id, "staff_id": shift.staff_id, "status": shift.status.value, "purpose": shift.purpose}

@router.put("/{shift_id}/end", response_model=dict)
def end_shift(shift_id: int, end_lat: float = None, end_lng: float = None, db: Session = Depends(get_db)):
    shift = crud.end_shift(db, shift_id, end_lat, end_lng)
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return {"id": shift.id, "staff_id": shift.staff_id, "status": shift.status.value}

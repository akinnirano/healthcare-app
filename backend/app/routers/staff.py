from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import crud
from ..db.database import get_db

router = APIRouter()

@router.post("/", response_model=dict)
def create_staff(user_id: int, license_number: str = None, skills: list = None, latitude: float = None, longitude: float = None, db: Session = Depends(get_db)):
    staff = crud.create_staff(db, user_id=user_id, license_number=license_number, skills=skills, latitude=latitude, longitude=longitude)
    return {"id": staff.id, "user_id": staff.user_id, "skills": staff.skills}

@router.get("/{staff_id}", response_model=dict)
def get_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = crud.get_staff(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {
        "id": staff.id,
        "user_id": staff.user_id,
        "skills": staff.skills,
        "latitude": staff.latitude,
        "longitude": staff.longitude,
    }

@router.get("/", response_model=List[dict])
def list_staff(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    staff_list = crud.list_staff(db, skip=skip, limit=limit)
    return [{
        "id": s.id,
        "user_id": s.user_id,
        "skills": s.skills,
        "latitude": s.latitude,
        "longitude": s.longitude,
    } for s in staff_list]

@router.put("/{staff_id}", response_model=dict)
def update_staff(staff_id: int, license_number: str = None, skills: list = None, latitude: float = None, longitude: float = None, db: Session = Depends(get_db)):
    staff = crud.update_staff(db, staff_id, license_number=license_number, skills=skills, latitude=latitude, longitude=longitude)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"id": staff.id, "user_id": staff.user_id, "skills": staff.skills}

@router.delete("/{staff_id}", response_model=dict)
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = crud.delete_staff(db, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"detail": f"Staff {staff.id} deleted successfully"}

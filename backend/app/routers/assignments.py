from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from ..db import crud
from ..db.database import get_db

router = APIRouter()

class AssignRequest(BaseModel):
    request_id: int
    staff_id: Optional[int] = None
    priority: Optional[str] = None
    # Accept either a date or a full datetime; pydantic will parse an ISO string
    due_date: Optional[datetime] = None

@router.post("/", response_model=dict)
def assign_staff(payload: AssignRequest, db: Session = Depends(get_db)):
    assignment = crud.assign_staff_to_patient_request(
        db,
        request_id=payload.request_id,
        staff_id=payload.staff_id,
        priority=payload.priority,
        due_date=payload.due_date,
    )
    return {
        "id": assignment.id,
        "service_request_id": assignment.service_request_id,
        "staff_id": assignment.staff_id,
        "confirmed": assignment.confirmed,
    }

@router.get("/{assignment_id}", response_model=dict)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = crud.get_assignment(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"id": assignment.id, "service_request_id": assignment.service_request_id, "staff_id": assignment.staff_id}

@router.get("/", response_model=List[dict])
def list_assignments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    assignments = crud.list_assignments(db, skip=skip, limit=limit)
    return [{"id": a.id, "service_request_id": a.service_request_id, "staff_id": a.staff_id} for a in assignments]

@router.put("/{assignment_id}", response_model=dict)
def update_assignment(assignment_id: int, confirmed: bool = None, db: Session = Depends(get_db)):
    assignment = crud.update_assignment(db, assignment_id, confirmed=confirmed)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"id": assignment.id, "service_request_id": assignment.service_request_id, "staff_id": assignment.staff_id, "confirmed": assignment.confirmed}

@router.delete("/{assignment_id}", response_model=dict)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = crud.delete_assignment(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"detail": f"Assignment {assignment.id} deleted successfully"}

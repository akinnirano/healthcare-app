from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import crud
from ..db.database import get_db

router = APIRouter()

@router.post("/", response_model=dict)
def submit_feedback(visit_id: int, rating: int, comments: str = None, db: Session = Depends(get_db)):
    feedback = crud.create_feedback(db, visit_id=visit_id, rating=rating, comments=comments)
    return {"id": feedback.id, "visit_id": feedback.visit_id, "rating": feedback.rating, "comments": feedback.comments}

@router.get("/{feedback_id}", response_model=dict)
def get_feedback(feedback_id: int, db: Session = Depends(get_db)):
    feedback = crud.get_feedback(db, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return {"id": feedback.id, "visit_id": feedback.visit_id, "rating": feedback.rating, "comments": feedback.comments}

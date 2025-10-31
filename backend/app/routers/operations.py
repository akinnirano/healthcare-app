# backend/app/routers/operations.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import dependencies
from datetime import datetime
from ..db import crud, models, database

router = APIRouter()

# --- Staff Assignment ---
@router.post("/assign_staff_blank")
def assign_staff_blank(request_id: int, db: Session = Depends(dependencies.get_db)):
    return crud.assign_staff_to_patient_request(db, request_id, None, None, None)

# --- Shift Management ---
@router.post("/start_shift")
def start_shift(staff_id: int, lat: float, lon: float, db: Session = Depends(dependencies.get_db)):
    return crud.start_shift(db, staff_id, lat, lon, datetime.utcnow())

@router.post("/end_shift")
def end_shift(staff_id: int, db: Session = Depends(dependencies.get_db)):
    return crud.end_shift(db, staff_id, datetime.utcnow())

# --- Timesheet & Payroll ---
@router.post("/submit_timesheet")
def submit_timesheet(staff_id: int, db: Session = Depends(dependencies.get_db)):
    return crud.submit_timesheet(db, staff_id)

@router.post("/process_payroll")
def process_payroll(db: Session = Depends(dependencies.get_db)):
    return crud.process_payroll(db)

# --- Compliance ---
@router.get("/verify_compliance")
def verify_compliance(db: Session = Depends(dependencies.get_db)):
    return crud.verify_compliance(db)

# --- Patient Visits ---
@router.get("/today_visits")
def today_visits(db: Session = Depends(dependencies.get_db)):
    return crud.list_today_visits(db)

@router.post("/complete_visit")
def complete_visit(visit_id: int, db: Session = Depends(dependencies.get_db)):
    return crud.complete_visit(db, visit_id)

@router.post("/assign_staff")
def assign_staff(
    request_id: int,
    staff_id: int | None = None,
    priority: str | None = None,
    due_date: datetime | None = None,
    db: Session = Depends(dependencies.get_db)):
    return crud.assign_staff_to_patient_request(db, request_id, staff_id, priority, due_date)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import crud
from ..db.database import get_db

router = APIRouter()

@router.post("/", response_model=dict)
def create_payroll(timesheet_id: int, hourly_rate: float, db: Session = Depends(get_db)):
    payroll = crud.create_payroll(db, timesheet_id=timesheet_id, hourly_rate=hourly_rate)
    return {"id": payroll.id, "timesheet_id": payroll.timesheet_id, "total_pay": payroll.total_pay, "status": payroll.status.value}

@router.get("/{payroll_id}", response_model=dict)
def get_payroll(payroll_id: int, db: Session = Depends(get_db)):
    payroll = crud.get_payroll(db, payroll_id)
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
    return {"id": payroll.id, "timesheet_id": payroll.timesheet_id, "total_pay": payroll.total_pay, "status": payroll.status.value}

@router.put("/{payroll_id}", response_model=dict)
def update_payroll(payroll_id: int, status: str = None, db: Session = Depends(get_db)):
    payroll = crud.update_payroll(db, payroll_id, status=status)
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
    return {"id": payroll.id, "timesheet_id": payroll.timesheet_id, "total_pay": payroll.total_pay, "status": payroll.status.value}

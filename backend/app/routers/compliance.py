from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import crud
from ..db.database import get_db

router = APIRouter()

@router.post("/", response_model=dict)
def add_compliance(staff_id: int, document_type: str, document_number: str, expiry_date: str, db: Session = Depends(get_db)):
    record = crud.create_compliance(db, staff_id=staff_id, document_type=document_type, document_number=document_number, expiry_date=expiry_date)
    return {"id": record.id, "staff_id": record.staff_id, "document_type": record.document_type, "valid": record.valid}

@router.get("/{compliance_id}", response_model=dict)
def get_compliance(compliance_id: int, db: Session = Depends(get_db)):
    record = crud.get_compliance(db, compliance_id)
    if not record:
        raise HTTPException(status_code=404, detail="Compliance record not found")
    return {"id": record.id, "staff_id": record.staff_id, "document_type": record.document_type, "valid": record.valid}

@router.put("/{compliance_id}", response_model=dict)
def update_compliance(compliance_id: int, valid: bool = None, db: Session = Depends(get_db)):
    record = crud.update_compliance(db, compliance_id, valid=valid)
    if not record:
        raise HTTPException(status_code=404, detail="Compliance record not found")
    return {"id": record.id, "staff_id": record.staff_id, "document_type": record.document_type, "valid": record.valid}

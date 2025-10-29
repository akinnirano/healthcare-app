from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import crud
from ..db.database import get_db

router = APIRouter()

@router.post("/", response_model=dict)
def create_invoice(payroll_id: int, invoice_number: str, amount: float, db: Session = Depends(get_db)):
    invoice = crud.create_invoice(db, payroll_id=payroll_id, invoice_number=invoice_number, amount=amount)
    return {"id": invoice.id, "payroll_id": invoice.payroll_id, "invoice_number": invoice.invoice_number, "amount": invoice.amount}

@router.get("/{invoice_id}", response_model=dict)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = crud.get_invoice(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"id": invoice.id, "payroll_id": invoice.payroll_id, "invoice_number": invoice.invoice_number, "amount": invoice.amount}

@router.put("/{invoice_id}", response_model=dict)
def update_invoice(invoice_id: int, sent: bool = None, paid: bool = None, db: Session = Depends(get_db)):
    invoice = crud.update_invoice(db, invoice_id, sent=sent, paid=paid)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"id": invoice.id, "payroll_id": invoice.payroll_id, "invoice_number": invoice.invoice_number, "amount": invoice.amount, "sent": invoice.sent, "paid": invoice.paid}

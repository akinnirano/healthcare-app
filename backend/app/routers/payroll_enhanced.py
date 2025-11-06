"""
Enhanced Payroll API with Tax Calculations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..db import models
from ..db.database import get_db
from .security import get_current_user
from ..services.payroll_service import PayrollProcessor

router = APIRouter()

class PayrollProcessRequest(BaseModel):
    staff_id: int
    pay_period_start: datetime
    pay_period_end: datetime
    hours_worked: Optional[float] = None
    timesheet_id: Optional[int] = None

class BulkPayrollProcessRequest(BaseModel):
    company_id: int
    pay_period_start: datetime
    pay_period_end: datetime

class PayrollResponse(BaseModel):
    id: int
    staff_id: int
    company_id: Optional[int]
    country_id: Optional[int]
    hours_worked: float
    hourly_rate: float
    gross_pay: float
    federal_tax: float
    state_provincial_tax: float
    social_security_tax: float
    medicare_tax: float
    other_deductions: float
    total_deductions: float
    net_pay: float
    pay_period_start: Optional[datetime]
    pay_period_end: Optional[datetime]
    status: str
    tax_calculation_details: Optional[Dict[str, Any]]
    generated_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/process", response_model=PayrollResponse, summary="Process payroll for a staff member")
def process_staff_payroll(
    request: PayrollProcessRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process payroll for a single staff member with automatic tax calculations
    """
    processor = PayrollProcessor(db)
    
    try:
        payroll = processor.process_payroll(
            staff_id=request.staff_id,
            pay_period_start=request.pay_period_start,
            pay_period_end=request.pay_period_end,
            hours_worked=request.hours_worked,
            timesheet_id=request.timesheet_id
        )
        return payroll
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing payroll: {str(e)}"
        )

@router.post("/process/bulk", response_model=List[PayrollResponse], summary="Process payroll for all staff in a company")
def process_bulk_payroll(
    request: BulkPayrollProcessRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process payroll for all active staff in a company for a given pay period
    """
    # TODO: Add permission check - only company admin should be able to do this
    
    processor = PayrollProcessor(db)
    
    try:
        payrolls = processor.bulk_process_payroll(
            company_id=request.company_id,
            pay_period_start=request.pay_period_start,
            pay_period_end=request.pay_period_end
        )
        return payrolls
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing bulk payroll: {str(e)}"
        )

@router.get("/", response_model=List[PayrollResponse], summary="List payroll records")
def list_payrolls(
    skip: int = 0,
    limit: int = 100,
    staff_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List payroll records with optional filtering
    Automatically filters by company for non-admin users
    """
    query = db.query(models.Payroll)
    
    # Filter by company for multi-tenancy
    if current_user.company_id:
        query = query.filter(models.Payroll.company_id == current_user.company_id)
    
    if staff_id:
        query = query.filter(models.Payroll.staff_id == staff_id)
    
    if status:
        query = query.filter(models.Payroll.status == status)
    
    query = query.order_by(models.Payroll.generated_at.desc())
    payrolls = query.offset(skip).limit(limit).all()
    
    return payrolls

@router.get("/{payroll_id}", response_model=PayrollResponse)
def get_payroll(
    payroll_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payroll record by ID"""
    payroll = db.get(models.Payroll, payroll_id)
    if not payroll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll record not found"
        )
    
    # Check company access
    if current_user.company_id and payroll.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return payroll

@router.put("/{payroll_id}/approve", response_model=PayrollResponse)
def approve_payroll(
    payroll_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve a payroll record"""
    payroll = db.get(models.Payroll, payroll_id)
    if not payroll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll record not found"
        )
    
    # Check company access
    if current_user.company_id and payroll.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    payroll.status = models.PayrollStatus.APPROVED
    db.commit()
    db.refresh(payroll)
    
    return payroll

@router.put("/{payroll_id}/mark-paid", response_model=PayrollResponse)
def mark_payroll_paid(
    payroll_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a payroll record as paid"""
    payroll = db.get(models.Payroll, payroll_id)
    if not payroll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll record not found"
        )
    
    # Check company access
    if current_user.company_id and payroll.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    payroll.status = models.PayrollStatus.PAID
    payroll.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(payroll)
    
    return payroll


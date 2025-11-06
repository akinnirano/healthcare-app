"""
Staff Salary Configuration API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..db import models
from ..db.database import get_db
from .security import get_current_user

router = APIRouter()

class SalaryConfigCreate(BaseModel):
    staff_id: int
    hourly_rate: float
    expected_hours_per_week: float = 40.0
    expected_hours_per_pay_period: Optional[float] = None
    pay_frequency: str = "biweekly"  # weekly, biweekly, monthly
    overtime_rate_multiplier: float = 1.5
    overtime_threshold_hours: float = 40.0
    has_benefits: bool = False
    benefits_deduction: float = 0.0
    additional_deductions: Optional[Dict[str, Any]] = None

class SalaryConfigUpdate(BaseModel):
    hourly_rate: Optional[float] = None
    expected_hours_per_week: Optional[float] = None
    expected_hours_per_pay_period: Optional[float] = None
    pay_frequency: Optional[str] = None
    overtime_rate_multiplier: Optional[float] = None
    overtime_threshold_hours: Optional[float] = None
    has_benefits: Optional[bool] = None
    benefits_deduction: Optional[float] = None
    additional_deductions: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class SalaryConfigResponse(BaseModel):
    id: int
    staff_id: int
    company_id: int
    hourly_rate: float
    expected_hours_per_week: float
    expected_hours_per_pay_period: Optional[float]
    pay_frequency: str
    overtime_rate_multiplier: float
    overtime_threshold_hours: float
    has_benefits: bool
    benefits_deduction: float
    additional_deductions: Optional[Dict[str, Any]]
    effective_date: datetime
    end_date: Optional[datetime]
    is_active: bool
    
    class Config:
        from_attributes = True

@router.post("/", response_model=SalaryConfigResponse, status_code=status.HTTP_201_CREATED)
def create_salary_config(
    config: SalaryConfigCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create salary configuration for a staff member"""
    # Check if staff exists
    staff = db.get(models.Staff, config.staff_id)
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    # Check if config already exists
    existing = db.query(models.StaffSalaryConfig).filter(
        models.StaffSalaryConfig.staff_id == config.staff_id,
        models.StaffSalaryConfig.is_active == True
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active salary configuration already exists for this staff member"
        )
    
    # Get company_id from user
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be associated with a company"
        )
    
    # Calculate hours per pay period if not provided
    hours_per_pay_period = config.expected_hours_per_pay_period
    if not hours_per_pay_period:
        if config.pay_frequency == "weekly":
            hours_per_pay_period = config.expected_hours_per_week
        elif config.pay_frequency == "biweekly":
            hours_per_pay_period = config.expected_hours_per_week * 2
        elif config.pay_frequency == "monthly":
            hours_per_pay_period = config.expected_hours_per_week * 4.33  # Average
    
    db_config = models.StaffSalaryConfig(
        staff_id=config.staff_id,
        company_id=current_user.company_id,
        hourly_rate=config.hourly_rate,
        expected_hours_per_week=config.expected_hours_per_week,
        expected_hours_per_pay_period=hours_per_pay_period,
        pay_frequency=config.pay_frequency,
        overtime_rate_multiplier=config.overtime_rate_multiplier,
        overtime_threshold_hours=config.overtime_threshold_hours,
        has_benefits=config.has_benefits,
        benefits_deduction=config.benefits_deduction,
        additional_deductions=config.additional_deductions,
        is_active=True
    )
    
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    
    return db_config

@router.get("/", response_model=List[SalaryConfigResponse])
def list_salary_configs(
    skip: int = 0,
    limit: int = 100,
    staff_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List salary configurations"""
    query = db.query(models.StaffSalaryConfig)
    
    # Filter by company
    if current_user.company_id:
        query = query.filter(models.StaffSalaryConfig.company_id == current_user.company_id)
    
    if staff_id:
        query = query.filter(models.StaffSalaryConfig.staff_id == staff_id)
    
    configs = query.offset(skip).limit(limit).all()
    return configs

@router.get("/{config_id}", response_model=SalaryConfigResponse)
def get_salary_config(
    config_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get salary configuration by ID"""
    config = db.get(models.StaffSalaryConfig, config_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salary configuration not found"
        )
    
    # Check company access
    if current_user.company_id and config.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return config

@router.put("/{config_id}", response_model=SalaryConfigResponse)
def update_salary_config(
    config_id: int,
    config_update: SalaryConfigUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update salary configuration"""
    config = db.get(models.StaffSalaryConfig, config_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salary configuration not found"
        )
    
    # Check company access
    if current_user.company_id and config.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    update_data = config_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    
    return config

@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_salary_config(
    config_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate salary configuration"""
    config = db.get(models.StaffSalaryConfig, config_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salary configuration not found"
        )
    
    # Check company access
    if current_user.company_id and config.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    config.is_active = False
    config.end_date = datetime.utcnow()
    db.commit()
    
    return None


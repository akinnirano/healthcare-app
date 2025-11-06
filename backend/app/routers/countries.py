"""
Country Management API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..db import models
from ..db.database import get_db
from .security import get_current_user

router = APIRouter()

class CountryCreate(BaseModel):
    code: str  # US, CA, etc.
    name: str
    currency: str = "USD"

class CountryResponse(BaseModel):
    id: int
    code: str
    name: str
    currency: str
    is_active: bool
    
    class Config:
        from_attributes = True

@router.post("/", response_model=CountryResponse, status_code=status.HTTP_201_CREATED)
def create_country(
    country: CountryCreate,
    db: Session = Depends(get_db)
):
    """Create a new country"""
    # Check if already exists
    existing = db.query(models.Country).filter(
        models.Country.code == country.code.upper()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Country with this code already exists"
        )
    
    db_country = models.Country(
        code=country.code.upper(),
        name=country.name,
        currency=country.currency,
        is_active=True
    )
    db.add(db_country)
    db.commit()
    db.refresh(db_country)
    return db_country

@router.get("/", response_model=List[CountryResponse])
def list_countries(db: Session = Depends(get_db)):
    """List all countries"""
    return db.query(models.Country).filter(models.Country.is_active == True).all()

@router.get("/{country_id}", response_model=CountryResponse)
def get_country(country_id: int, db: Session = Depends(get_db)):
    """Get country by ID"""
    country = db.get(models.Country, country_id)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Country not found"
        )
    return country


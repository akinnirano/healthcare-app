"""
Company Management API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import secrets

from ..db import models
from ..db.database import get_db
from .security import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter()

# =========================================================
# SCHEMAS
# =========================================================
class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., description="Company email for docs-website login")
    password: str = Field(..., min_length=8)
    country_id: int
    address: Optional[str] = None
    phone: Optional[str] = None
    registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    discord_webhook_url: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    discord_webhook_url: Optional[str] = None
    is_active: Optional[bool] = None

class CompanyResponse(BaseModel):
    id: int
    name: str
    email: str
    country_id: int
    address: Optional[str]
    phone: Optional[str]
    registration_number: Optional[str]
    tax_id: Optional[str]
    discord_webhook_url: Optional[str]
    is_active: bool
    datecreated: datetime

    class Config:
        from_attributes = True

class CompanyLoginRequest(BaseModel):
    email: str
    password: str

class CompanyLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    company_id: int
    company_name: str

class CompanyApiKeyResponse(BaseModel):
    api_key: str
    created_at: datetime
    last_used: Optional[datetime]

# =========================================================
# AUTHENTICATION
# =========================================================
@router.post("/login", response_model=CompanyLoginResponse, summary="Company login for docs-website")
def company_login(req: CompanyLoginRequest, db: Session = Depends(get_db)):
    """
    Company login endpoint for documentation website access
    """
    company = db.query(models.Company).filter(
        models.Company.email == req.email.lower().strip()
    ).first()
    
    if not company or not verify_password(req.password, company.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not company.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company account is inactive"
        )
    
    # Create JWT token with company info
    token = create_access_token(
        subject=str(company.id),
        additional_claims={
            "company_name": company.name,
            "type": "company"
        }
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "company_id": company.id,
        "company_name": company.name
    }

@router.get("/api-key", response_model=CompanyApiKeyResponse, summary="Get or create company API key")
def get_company_api_key(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get API key for the current user's company
    Automatically creates one if it doesn't exist
    """
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any company"
        )
    
    # Check if company already has an API key
    api_key_record = db.query(models.CompanyApiKey).filter(
        models.CompanyApiKey.company_id == current_user.company_id,
        models.CompanyApiKey.is_active == True
    ).first()
    
    if api_key_record:
        return {
            "api_key": api_key_record.key,
            "created_at": api_key_record.created_at,
            "last_used": api_key_record.last_used
        }
    
    # Generate new API key for company
    raw_key = f"hc_company_{secrets.token_urlsafe(32)}"
    
    new_key = models.CompanyApiKey(
        company_id=current_user.company_id,
        key=raw_key,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    
    return {
        "api_key": raw_key,
        "created_at": new_key.created_at,
        "last_used": None
    }

@router.post("/api-key/regenerate", response_model=CompanyApiKeyResponse, summary="Regenerate company API key")
def regenerate_company_api_key(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Regenerate API key for the current user's company
    Invalidates the old key
    """
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any company"
        )
    
    # Deactivate all existing keys for this company
    db.query(models.CompanyApiKey).filter(
        models.CompanyApiKey.company_id == current_user.company_id
    ).update({"is_active": False})
    
    # Generate new API key
    raw_key = f"hc_company_{secrets.token_urlsafe(32)}"
    
    new_key = models.CompanyApiKey(
        company_id=current_user.company_id,
        key=raw_key,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    
    return {
        "api_key": raw_key,
        "created_at": new_key.created_at,
        "last_used": None
    }

# =========================================================
# CRUD OPERATIONS
# =========================================================
@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    """
    Create a new company
    """
    # Check if email already exists
    existing = db.query(models.Company).filter(
        models.Company.email == company.email.lower()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company with this email already exists"
        )
    
    # Check if country exists
    country = db.get(models.Country, company.country_id)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Country not found"
        )
    
    # Hash password
    password_hash = get_password_hash(company.password)
    
    # Create company
    db_company = models.Company(
        name=company.name,
        email=company.email.lower(),
        password_hash=password_hash,
        country_id=company.country_id,
        address=company.address,
        phone=company.phone,
        registration_number=company.registration_number,
        tax_id=company.tax_id,
        discord_webhook_url=company.discord_webhook_url,
        is_active=True
    )
    
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    
    return db_company

@router.get("/", response_model=List[CompanyResponse])
def list_companies(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all companies (admin only) or current user's company
    """
    # TODO: Add role-based access control
    # For now, return all companies
    companies = db.query(models.Company).offset(skip).limit(limit).all()
    return companies

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get company by ID
    """
    company = db.get(models.Company, company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # TODO: Check if user has access to this company
    return company

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_update: CompanyUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update company information
    """
    company = db.get(models.Company, company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # TODO: Check if user has access to update this company
    
    # Update fields
    update_data = company_update.dict(exclude_unset=True)
    
    # Hash password if provided
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = get_password_hash(update_data["password"])
        del update_data["password"]
    
    for field, value in update_data.items():
        setattr(company, field, value)
    
    db.commit()
    db.refresh(company)
    
    return company

@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete (deactivate) a company
    """
    company = db.get(models.Company, company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # TODO: Check if user has access to delete this company
    
    # Soft delete - just mark as inactive
    company.is_active = False
    db.commit()
    
    return None

# =========================================================
# DISCORD WEBHOOK MANAGEMENT
# =========================================================
class DiscordWebhookUpdate(BaseModel):
    discord_webhook_url: Optional[str] = Field(None, max_length=500, description="Discord webhook URL for notifications")

@router.get("/discord-webhook", summary="Get company Discord webhook URL")
def get_discord_webhook(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get Discord webhook URL for the current user's company
    """
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any company"
        )
    
    company = db.get(models.Company, current_user.company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return {
        "discord_webhook_url": company.discord_webhook_url,
        "company_id": company.id,
        "company_name": company.name
    }

@router.put("/discord-webhook", summary="Update company Discord webhook URL")
def update_discord_webhook(
    webhook_data: DiscordWebhookUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update Discord webhook URL for the current user's company
    """
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any company"
        )
    
    company = db.get(models.Company, current_user.company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Update webhook URL
    company.discord_webhook_url = webhook_data.discord_webhook_url
    db.commit()
    db.refresh(company)
    
    return {
        "discord_webhook_url": company.discord_webhook_url,
        "company_id": company.id,
        "company_name": company.name,
        "message": "Discord webhook URL updated successfully"
    }


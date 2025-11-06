"""
API Key management for documentation access
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import secrets
import hashlib
from datetime import datetime

from ..db import models
from ..db.database import get_db
from .security import get_current_user, get_password_hash
from ..utils.emailer import send_email
import os

router = APIRouter()

class ApiKeyResponse(BaseModel):
    api_key: str
    created_at: Optional[str] = None
    last_used: Optional[str] = None

class DocsUserRegister(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str
    company_name: str
    country_id: int = 1  # Default to US

class DocsUserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    message: str

@router.post("/register", response_model=DocsUserResponse, status_code=status.HTTP_201_CREATED, summary="Register a new docs user")
def register_docs_user(user_data: DocsUserRegister, db: Session = Depends(get_db)):
    """
    Register a new user with 'docs' role for documentation access
    Creates user, company (if new), and assigns 'docs' role
    """
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if phone already exists
    if user_data.phone:
        existing_phone = db.query(models.User).filter(models.User.phone == user_data.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
    
    # Get or create 'docs' role
    docs_role = db.query(models.Role).filter(models.Role.name.ilike('docs')).first()
    if not docs_role:
        # Create docs role if it doesn't exist
        docs_role = models.Role(
            name="Docs",
            description="Documentation access user with limited privileges"
        )
        db.add(docs_role)
        db.flush()
    
    # Check if company exists, otherwise create it
    company = db.query(models.Company).filter(
        models.Company.name.ilike(user_data.company_name)
    ).first()
    
    if not company:
        # Create new company
        company = models.Company(
            name=user_data.company_name,
            email=user_data.email.lower(),  # Use registrant's email
            password_hash=get_password_hash(user_data.password),  # Same password for company login
            country_id=user_data.country_id,
            is_active=True
        )
        db.add(company)
        db.flush()
    
    # Create user
    new_user = models.User(
        full_name=user_data.full_name,
        email=user_data.email.lower(),
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        role_id=docs_role.id,
        company_id=company.id,
        country_id=user_data.country_id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send welcome email
    try:
        base_url = os.getenv("FRONTEND_BASE_URL", "https://api.hremsoftconsulting.com")
        login_url = f"{base_url}/docs-website/login"
        docs_url = f"{base_url}/docs-website/getting-started"
        
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .header h1 {{ color: white; margin: 0; font-size: 24px; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #14b8a6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }}
                .info-box {{ background: white; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to Healthcare API Documentation!</h1>
                </div>
                <div class="content">
                    <p>Hi <strong>{new_user.full_name}</strong>,</p>
                    
                    <p>Thank you for registering! Your account has been successfully created.</p>
                    
                    <div class="info-box">
                        <strong>Account Details:</strong><br>
                        Email: {new_user.email}<br>
                        Company: {company.name}<br>
                        Role: Documentation User
                    </div>
                    
                    <p>You can now access the complete Healthcare API documentation and generate your API key.</p>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="{login_url}" class="button">Sign In Now</a>
                    </p>
                    
                    <p><strong>What's Next?</strong></p>
                    <ol>
                        <li>Login with your credentials at <a href="{login_url}">{login_url}</a></li>
                        <li>Your API key will be automatically generated</li>
                        <li>Browse the complete API documentation</li>
                        <li>Start integrating with our Healthcare API</li>
                    </ol>
                    
                    <div class="info-box">
                        <strong>Quick Links:</strong><br>
                        • Login: <a href="{login_url}">{login_url}</a><br>
                        • Documentation: <a href="{docs_url}">{docs_url}</a><br>
                        • API Reference: <a href="{base_url}/docs">{base_url}/docs</a>
                    </div>
                    
                    <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
                    
                    <p>Best regards,<br>
                    <strong>Healthcare Platform Team</strong></p>
                </div>
                <div class="footer">
                    <p>Healthcare Management System • API Documentation</p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        send_email(
            subject="Welcome to Healthcare API Documentation! 🎉",
            to_email=new_user.email,
            html_body=html_body,
            from_name="Healthcare API Documentation"
        )
    except Exception as e:
        # Don't fail registration if email fails
        print(f"[Email Warning] Failed to send welcome email: {e}")
    
    return {
        "id": new_user.id,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "message": "Registration successful! Check your email for welcome message."
    }

@router.get("/api-key", response_model=ApiKeyResponse, summary="Get or create API key for current user", dependencies=[Depends(get_current_user)])
def get_api_key(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the API key for the authenticated user.
    If no API key exists, creates one automatically.
    """
    # Check if user already has an API key
    api_key_record = db.query(models.DocsApiKey).filter(
        models.DocsApiKey.user_id == current_user.id,
        models.DocsApiKey.is_active == True
    ).first()

    if api_key_record:
        return {
            "api_key": api_key_record.key,
            "created_at": api_key_record.created_at.isoformat() if api_key_record.created_at else None,
            "last_used": api_key_record.last_used.isoformat() if api_key_record.last_used else None
        }

    # Generate new API key
    raw_key = f"hc_{secrets.token_urlsafe(32)}"
    
    # Store the key (in production, you might want to hash it)
    new_key = models.DocsApiKey(
        user_id=current_user.id,
        key=raw_key,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)

    return {
        "api_key": raw_key,
        "created_at": new_key.created_at.isoformat() if new_key.created_at else None,
        "last_used": None
    }

@router.post("/api-key/regenerate", response_model=ApiKeyResponse, summary="Regenerate API key", dependencies=[Depends(get_current_user)])
def regenerate_api_key(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Invalidate the current API key and generate a new one.
    """
    # Deactivate all existing keys for this user
    db.query(models.DocsApiKey).filter(
        models.DocsApiKey.user_id == current_user.id
    ).update({"is_active": False})

    # Generate new API key
    raw_key = f"hc_{secrets.token_urlsafe(32)}"
    
    new_key = models.DocsApiKey(
        user_id=current_user.id,
        key=raw_key,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)

    return {
        "api_key": raw_key,
        "created_at": new_key.created_at.isoformat() if new_key.created_at else None,
        "last_used": None
    }

@router.delete("/api-key", summary="Revoke API key", dependencies=[Depends(get_current_user)])
def revoke_api_key(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke (deactivate) the current user's API key.
    """
    result = db.query(models.DocsApiKey).filter(
        models.DocsApiKey.user_id == current_user.id,
        models.DocsApiKey.is_active == True
    ).update({"is_active": False})

    db.commit()

    if result > 0:
        return {"detail": "API key revoked successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active API key found"
        )



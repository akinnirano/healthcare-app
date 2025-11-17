from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List

from ..db import models
from .security import verify_password, create_access_token, get_db, get_password_hash

router = APIRouter()

class LoginRequest(BaseModel):
    email: str = Field(..., description="Email or phone identifier", examples=["user@example.com", "+15555555555"])  # can be email or phone (identifier)
    password: str = Field(..., description="Account password", examples=["your-password"])

class LoginResponse(BaseModel):
    access_token: str = Field(..., description="JWT Bearer token")
    token_type: str = Field("bearer", description="Token type")
    role: Optional[str] = Field(None, description="Resolved role for the user")
    privileges: Optional[List[str]] = Field(None, description="Privilege codes for the user's role")

@router.post("/login", response_model=LoginResponse, summary="Obtain JWT by email/phone + password")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    identifier = (req.email or "").strip()

    user: Optional[models.User] = None
    if identifier:
        # Case-insensitive email match first
        user = db.query(models.User).filter(func.lower(models.User.email) == identifier.lower()).first()
        # Fallback to phone exact match
        if user is None:
            user = db.query(models.User).filter(models.User.phone == identifier).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    try:
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    except Exception:
        # Any verification error treated as invalid
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    role_name = None
    privilege_codes: List[str] = []
    if user.role_id:
        # Use Session.get for reliable primary key fetching
        r = db.get(models.Role, user.role_id)
        role_name = r.name if r else None
        if r and getattr(r, 'privileges', None):
            try:
                privilege_codes = [p.code for p in r.privileges if p and p.code]
            except Exception:
                privilege_codes = []

    claims = {}
    if role_name:
        claims["role"] = role_name
    if privilege_codes:
        claims["privileges"] = privilege_codes

    token = create_access_token(subject=str(user.id), additional_claims=claims if claims else None)
    return {"access_token": token, "token_type": "bearer", "role": role_name, "privileges": privilege_codes}

# Development-only helper to reset a user's password quickly
class SetPasswordRequest(BaseModel):
    email: str = Field(..., description="User email (case-insensitive)")
    new_password: str = Field(..., min_length=6)

@router.post("/set_password", summary="Set a user's password (development)")
def set_password(req: SetPasswordRequest, db: Session = Depends(get_db)):
    user: Optional[models.User] = db.query(models.User).filter(func.lower(models.User.email) == req.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"detail": "Password updated"}


@router.get("/verify_email", summary="Verify email via token")
def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    """
    Verify user email address using a verification token.
    Also activates the user account upon successful verification.
    """
    rec = db.query(models.EmailToken).filter(models.EmailToken.token == token).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Invalid token")
    if rec.used:
        return {"detail": "Token already used", "verified": True}
    if rec.expires_at and rec.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")
    
    # Mark token as used
    rec.used = True
    
    # Activate the user account
    user = db.get(models.User, rec.user_id)
    if user:
        user.is_active = True
        db.commit()
        return {
            "detail": "Email verified successfully",
            "verified": True,
            "user_id": user.id,
            "email": user.email,
            "is_active": user.is_active
        }
    
    db.commit()
    return {"detail": "Email verified"}

class VerifyUserRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="User ID to verify")
    email: Optional[str] = Field(None, description="Email address to verify")
    token: Optional[str] = Field(None, description="Verification token")

@router.post("/verify_user", summary="Verify user by ID, email, or token")
def verify_user(
    req: VerifyUserRequest,
    db: Session = Depends(get_db)
):
    """
    Verify a user account by user ID, email, or verification token.
    This endpoint can be used by admins to manually verify users.
    """
    user: Optional[models.User] = None
    
    if req.user_id:
        user = db.get(models.User, req.user_id)
    elif req.email:
        user = db.query(models.User).filter(func.lower(models.User.email) == req.email.lower()).first()
    elif req.token:
        # Verify via token (same logic as verify_email)
        rec = db.query(models.EmailToken).filter(models.EmailToken.token == req.token).first()
        if not rec:
            raise HTTPException(status_code=404, detail="Invalid token")
        if rec.expires_at and rec.expires_at < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Token expired")
        user = db.get(models.User, rec.user_id)
        if user and rec:
            rec.used = True
    else:
        raise HTTPException(status_code=400, detail="Must provide user_id, email, or token")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Activate the user account
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    return {
        "detail": "User verified successfully",
        "verified": True,
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active
    }

class ResendVerificationRequest(BaseModel):
    email: str = Field(..., description="Email address to resend verification to")

@router.post("/resend_verification", summary="Resend verification email")
def resend_verification(
    req: ResendVerificationRequest,
    db: Session = Depends(get_db)
):
    """
    Resend verification email to a user
    """
    from ..utils.emailer import send_email
    import secrets
    import os
    
    user = db.query(models.User).filter(func.lower(models.User.email) == req.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_active:
        return {"detail": "User is already verified", "is_active": True}
    
    # Create new verification token
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=48)
    
    # Deactivate old tokens for this user
    db.query(models.EmailToken).filter(
        models.EmailToken.user_id == user.id,
        models.EmailToken.purpose == "verify",
        models.EmailToken.used == False
    ).update({"used": True})
    
    # Create new token
    rec = models.EmailToken(
        user_id=user.id,
        email=user.email,
        token=token,
        purpose="verify",
        expires_at=expires
    )
    db.add(rec)
    db.commit()
    
    # Send verification email
    frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
    verify_link = f"{frontend_base}/verify?token={token}"
    backend_verify = os.getenv("BACKEND_BASE_URL", "http://localhost:8000") + f"/auth/verify_email?token={token}"
    
    html = f"""
        <div style='font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif'>
          <h2>Verify Your Email Address</h2>
          <p>Hi {user.full_name},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <p><a href="{backend_verify}" style="display:inline-block;padding:10px 16px;background:#0ea5e9;color:#fff;border-radius:8px;text-decoration:none">Verify Email</a></p>
          <p>If the button doesn't work, copy this link:</p>
          <p><a href="{verify_link}">{verify_link}</a></p>
          <p>This link will expire in 48 hours.</p>
          <hr/>
          <p>Best regards,<br/>Healthcare Team</p>
        </div>
    """
    
    try:
        send_email("Verify your email", user.email, html)
        return {"detail": "Verification email sent successfully", "email": user.email}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

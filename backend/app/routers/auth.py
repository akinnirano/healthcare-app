from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime
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
    rec = db.query(models.EmailToken).filter(models.EmailToken.token == token).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Invalid token")
    if rec.used:
        return {"detail": "Token already used"}
    if rec.expires_at and rec.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")
    rec.used = True
    db.commit()
    return {"detail": "Email verified"}

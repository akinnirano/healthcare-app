from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import secrets
from datetime import datetime, timedelta
from ..db import models, crud
from ..db.database import get_db
from ..utils.emailer import send_email

router = APIRouter()

@router.post("/", response_model=dict)
def create_user(full_name: str, email: str, password_hash: str, role_id: Optional[int] = None, phone: str = None, db: Session = Depends(get_db)):
    # Validate duplicate email
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    # Validate role if provided
    if role_id is not None:
        role = db.query(models.Role).get(role_id)
        if role is None:
            raise HTTPException(status_code=400, detail="Invalid role_id: role not found")
    user = crud.create_user(db, full_name=full_name, email=email, password_hash=password_hash, role_id=role_id, phone=phone)

    # Send verification + welcome email if email provided
    if email:
        try:
            token = secrets.token_urlsafe(32)
            expires = datetime.utcnow() + timedelta(hours=48)
            rec = models.EmailToken(user_id=user.id, email=email, token=token, purpose="verify", expires_at=expires)
            db.add(rec)
            db.commit()

            frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
            verify_link = f"{frontend_base}/verify?token={token}"
            backend_verify = os.getenv("BACKEND_BASE_URL", "http://localhost:8000") + f"/auth/verify_email?token={token}"

            html = f"""
                <div style='font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif'>
                  <h2>Welcome to Healthcare Platform</h2>
                  <p>Hi {full_name},</p>
                  <p>Thanks for registering. Please verify your email address by clicking the button below:</p>
                  <p><a href="{backend_verify}" style="display:inline-block;padding:10px 16px;background:#0ea5e9;color:#fff;border-radius:8px;text-decoration:none">Verify Email</a></p>
                  <p>If the button doesn't work, copy this link:</p>
                  <p><a href="{verify_link}">{verify_link}</a></p>
                  <hr/>
                  <p>Best regards,<br/>Healthcare Team</p>
                </div>
            """
            send_email("Verify your email", email, html)

            # Welcome email (no token required)
            welcome_html = f"""
                <div style='font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif'>
                  <h2>Welcome, {full_name}!</h2>
                  <p>Your account has been created successfully.</p>
                  <p>You can login anytime at <a href="{frontend_base}/login">{frontend_base}/login</a>.</p>
                  <p>— Healthcare Platform</p>
                </div>
            """
            send_email("Welcome to Healthcare Platform", email, welcome_html)
        except Exception:
            # Do not fail user creation if email sending fails
            pass

    return {"id": user.id, "full_name": user.full_name, "email": user.email, "role_id": user.role_id}

@router.get("/{user_id}", response_model=dict)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "full_name": user.full_name, "email": user.email, "role_id": user.role_id}

@router.get("/", response_model=List[dict])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.list_users(db, skip=skip, limit=limit)
    return [{"id": u.id, "full_name": u.full_name, "email": u.email, "role_id": u.role_id} for u in users]

@router.put("/{user_id}", response_model=dict)
def update_user(user_id: int, full_name: str = None, email: str = None, role_id: int = None, phone: str = None, db: Session = Depends(get_db)):
    if email:
        other = db.query(models.User).filter(models.User.email == email, models.User.id != user_id).first()
        if other:
            raise HTTPException(status_code=400, detail="Email already exists")
    if role_id is not None:
        role = db.query(models.Role).get(role_id)
        if role is None:
            raise HTTPException(status_code=400, detail="Invalid role_id: role not found")
    user = crud.update_user(db, user_id, full_name=full_name, email=email, role_id=role_id, phone=phone)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "full_name": user.full_name, "email": user.email, "role_id": user.role_id}

@router.delete("/{user_id}", response_model=dict)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": f"User {user.full_name} deleted successfully"}

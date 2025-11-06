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
from .security import get_current_user

router = APIRouter()

class ApiKeyResponse(BaseModel):
    api_key: str
    created_at: Optional[str] = None
    last_used: Optional[str] = None

@router.get("/api-key", response_model=ApiKeyResponse, summary="Get or create API key for current user")
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

@router.post("/api-key/regenerate", response_model=ApiKeyResponse, summary="Regenerate API key")
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

@router.delete("/api-key", summary="Revoke API key")
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


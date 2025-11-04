from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from ..db import models
from ..db.database import get_db
from .security import get_current_active_user

router = APIRouter()

class LocationUpdate(BaseModel):
    latitude: float = Field(..., description="GPS latitude coordinate", ge=-90, le=90)
    longitude: float = Field(..., description="GPS longitude coordinate", ge=-180, le=180)
    accuracy: Optional[float] = Field(None, description="GPS accuracy in meters")
    timestamp: Optional[datetime] = Field(None, description="Timestamp of location reading")

class LocationResponse(BaseModel):
    success: bool
    message: str
    latitude: float
    longitude: float
    updated_profile: Optional[str] = None  # 'staff' or 'patient'

@router.post("/update", response_model=LocationResponse, summary="Update current user's GPS location")
def update_my_location(
    location: LocationUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update the current authenticated user's GPS coordinates.
    Automatically updates staff or patient profile based on user role.
    """
    updated_profile = None
    
    # Try to update staff profile first
    staff = db.query(models.Staff).filter(models.Staff.user_id == current_user.id).first()
    if staff:
        staff.latitude = location.latitude
        staff.longitude = location.longitude
        updated_profile = 'staff'
        db.commit()
    
    # If no staff profile, try to update patient profile
    if not updated_profile:
        patient = db.query(models.Patient).filter(
            models.Patient.email == current_user.email
        ).first()
        
        if patient:
            patient.latitude = location.latitude
            patient.longitude = location.longitude
            updated_profile = 'patient'
            db.commit()
    
    # If neither profile exists, return success but note no profile was updated
    if not updated_profile:
        return LocationResponse(
            success=True,
            message="Location received but no staff/patient profile found to update",
            latitude=location.latitude,
            longitude=location.longitude,
            updated_profile=None
        )
    
    return LocationResponse(
        success=True,
        message=f"Location updated successfully for {updated_profile} profile",
        latitude=location.latitude,
        longitude=location.longitude,
        updated_profile=updated_profile
    )

@router.get("/current", summary="Get current user's location")
def get_my_location(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the current authenticated user's stored GPS coordinates.
    """
    # Check staff profile first
    staff = db.query(models.Staff).filter(models.Staff.user_id == current_user.id).first()
    if staff and staff.latitude is not None and staff.longitude is not None:
        return {
            "latitude": staff.latitude,
            "longitude": staff.longitude,
            "source": "staff",
            "user_id": current_user.id
        }
    
    # Check patient profile
    patient = db.query(models.Patient).filter(
        models.Patient.email == current_user.email
    ).first()
    
    if patient and patient.latitude is not None and patient.longitude is not None:
        return {
            "latitude": patient.latitude,
            "longitude": patient.longitude,
            "source": "patient",
            "user_id": current_user.id
        }
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No location data found for current user"
    )


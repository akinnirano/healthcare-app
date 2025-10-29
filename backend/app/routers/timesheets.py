from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
from ..db import crud, models
from ..db.database import get_db

router = APIRouter()

@router.post("/", response_model=dict)
def submit_timesheet(staff_id: int, shift_id: int, total_hours: float, db: Session = Depends(get_db)):
    ts = crud.create_timesheet(db, staff_id, shift_id, total_hours)
    return {"id": ts.id, "staff_id": ts.staff_id, "shift_id": ts.shift_id, "total_hours": ts.total_hours}

@router.get("/id/{timesheet_id}", response_model=dict)
def get_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    ts = crud.get_timesheet(db, timesheet_id)
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    return {"id": ts.id, "staff_id": ts.staff_id, "shift_id": ts.shift_id, "total_hours": ts.total_hours}


@router.get("/assignments_by_day", response_model=dict, summary="List assignments grouped by day for a given month")
def assignments_by_day(year: int, month: int, staff_id: int | None = None, db: Session = Depends(get_db)):
    try:
        start = datetime(year, month, 1)
        next_month = month + 1
        next_year = year + 1 if next_month == 13 else year
        next_month = 1 if next_month == 13 else next_month
        end = datetime(next_year, next_month, 1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid year or month")

    q = db.query(models.Assignment).filter(models.Assignment.assigned_at >= start, models.Assignment.assigned_at < end)
    if staff_id:
        q = q.filter(models.Assignment.staff_id == staff_id)
    rows = q.all()

    by_day: dict[str, list] = {}
    for a in rows:
        key = a.assigned_at.date().isoformat() if a.assigned_at else start.date().isoformat()
        if key not in by_day:
            by_day[key] = []
        by_day[key].append({
            "id": a.id,
            "service_request_id": a.service_request_id,
            "staff_id": a.staff_id,
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
            "confirmed": a.confirmed,
        })

    days = [{"date": d, "count": len(items), "assignments": items} for d, items in sorted(by_day.items())]
    return {"year": year, "month": month, "days": days}


@router.get("/monthly", response_model=dict, summary="All assignments in a month grouped by staff and day")
def assignments_monthly(year: int, month: int, db: Session = Depends(get_db)):
    try:
        start = datetime(year, month, 1)
        next_month = month + 1
        next_year = year + 1 if next_month == 13 else year
        next_month = 1 if next_month == 13 else next_month
        end = datetime(next_year, next_month, 1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid year or month")

    rows = (
        db.query(models.Assignment)
        .options(
            joinedload(models.Assignment.service_request).joinedload(models.ServiceRequest.patient),
            joinedload(models.Assignment.staff).joinedload(models.Staff.user),
        )
        .filter(models.Assignment.assigned_at >= start, models.Assignment.assigned_at < end)
        .all()
    )

    by_staff: dict[int, dict[str, list]] = {}
    for a in rows:
        staff_key = a.staff_id or 0
        if staff_key not in by_staff:
            by_staff[staff_key] = {}
        day_key = a.assigned_at.date().isoformat() if a.assigned_at else start.date().isoformat()
        if day_key not in by_staff[staff_key]:
            by_staff[staff_key][day_key] = []
        patient = getattr(a.service_request, 'patient', None)
        user = getattr(a.staff, 'user', None)
        by_staff[staff_key][day_key].append({
            "id": a.id,
            "service_request_id": a.service_request_id,
            "staff_id": a.staff_id,
            "staff_name": getattr(user, 'full_name', None),
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
            "confirmed": a.confirmed,
            "patient": {
                "id": getattr(patient, 'id', None),
                "name": getattr(patient, 'full_name', None),
                "address": getattr(patient, 'address', None),
                "latitude": getattr(patient, 'latitude', None),
                "longitude": getattr(patient, 'longitude', None),
            }
        })

    staff_blocks = []
    for staff_key, days_map in by_staff.items():
        staff_days = [{"date": d, "count": len(items), "assignments": items} for d, items in sorted(days_map.items())]
        staff_blocks.append({
            "staff_id": None if staff_key == 0 else staff_key,
            "total_assignments": sum(len(items) for items in days_map.values()),
            "days": staff_days,
        })

    return {"year": year, "month": month, "staff": staff_blocks}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
from pydantic import BaseModel
from ..db import crud, models
from ..db.database import get_db

router = APIRouter()


class TimesheetCreate(BaseModel):
    staff_id: int | None = None
    shift_id: int
    total_hours: float | None = None


class TimesheetUpdate(BaseModel):
    staff_id: int | None = None
    total_hours: float | None = None
    submitted: bool | None = None
    verified: bool | None = None
    shift_id: int | None = None


DEFAULT_LIMIT = 250


def serialize_timesheet(ts: models.Timesheet) -> dict:
    if not ts:
        return {}
    staff = ts.staff
    staff_user = getattr(staff, "user", None) if staff else None
    shift = ts.shift
    start_time = getattr(shift, "start_time", None) if shift else None
    end_time = getattr(shift, "end_time", None) if shift else None
    role_name = None
    if staff_user is not None:
        role_rel = getattr(staff_user, "role", None)
        if role_rel is not None:
            role_name = getattr(role_rel, "name", None)

    return {
        "id": ts.id,
        "staff_id": ts.staff_id,
        "staff_name": (getattr(staff_user, "full_name", None) if staff_user else None) or getattr(staff, "full_name", None),
        "staff_email": getattr(staff_user, "email", None) if staff_user else None,
        "staff_role": role_name,
        "total_hours": ts.total_hours,
        "submitted": ts.submitted,
        "verified": ts.verified,
        "created_at": ts.created_at.isoformat() if ts.created_at else None,
        "shift_id": ts.shift_id,
        "shift_start": start_time.isoformat() if start_time else None,
        "shift_end": end_time.isoformat() if end_time else None,
        "shift_status": shift.status.value if shift and shift.status else None,
        "start_lat": getattr(shift, "start_lat", None) if shift else None,
        "start_lng": getattr(shift, "start_lng", None) if shift else None,
        "end_lat": getattr(shift, "end_lat", None) if shift else None,
        "end_lng": getattr(shift, "end_lng", None) if shift else None,
        "timesheet_ref": f"TS-{ts.id:05d}",
    }


@router.get("/", response_model=List[dict], summary="List timesheets with staff and shift details")
def list_timesheets(
    staff_id: int | None = None,
    limit: int = DEFAULT_LIMIT,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Timesheet)
        .options(
            joinedload(models.Timesheet.staff).joinedload(models.Staff.user).joinedload(models.User.role),
            joinedload(models.Timesheet.shift),
        )
        .order_by(models.Timesheet.created_at.desc())
    )
    if staff_id:
        query = query.filter(models.Timesheet.staff_id == staff_id)
    timesheets = query.limit(limit).all()
    return [serialize_timesheet(ts) for ts in timesheets]


@router.post("/", response_model=dict)
def submit_timesheet(payload: TimesheetCreate, db: Session = Depends(get_db)):
    try:
        ts = crud.create_timesheet(db, payload.staff_id, payload.shift_id, payload.total_hours)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return serialize_timesheet(ts)


@router.get("/id/{timesheet_id}", response_model=dict)
def get_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    ts = crud.get_timesheet(db, timesheet_id)
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    return serialize_timesheet(ts)


@router.put("/{timesheet_id}", response_model=dict)
def update_timesheet(timesheet_id: int, payload: TimesheetUpdate, db: Session = Depends(get_db)):
    ts = crud.update_timesheet(db, timesheet_id, **payload.dict(exclude_none=True))
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    return serialize_timesheet(ts)


@router.delete("/{timesheet_id}", response_model=dict)
def remove_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    ts = crud.delete_timesheet(db, timesheet_id)
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    return {"detail": "Timesheet deleted", "timesheet": serialize_timesheet(ts)}


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

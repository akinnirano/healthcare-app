from sqlalchemy.orm import Session
from contextvars import ContextVar
from datetime import datetime, timedelta
from app.db import models

# Per-request context for auditing creator
_created_by_ctx: ContextVar[str] = ContextVar("created_by", default="system")

def set_created_by(value: str | None) -> None:
    try:
        _created_by_ctx.set((value or "system").strip() or "system")
    except Exception:
        _created_by_ctx.set("system")

def get_created_by() -> str:
    try:
        return _created_by_ctx.get()
    except LookupError:
        return "system"

# =========================================================
# ROLE CRUD
# =========================================================
def create_role(db: Session, name: str, description: str = None):
    role = models.Role(name=name, description=description, createdby=get_created_by())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

def get_role(db: Session, role_id: int):
    return db.query(models.Role).filter(models.Role.id == role_id).first()

def list_roles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Role).offset(skip).limit(limit).all()

def update_role(db: Session, role_id: int, name: str = None, description: str = None):
    role = get_role(db, role_id)
    if not role:
        return None
    if name:
        role.name = name
    if description:
        role.description = description
    db.commit()
    db.refresh(role)
    return role

def delete_role(db: Session, role_id: int):
    role = get_role(db, role_id)
    if not role:
        return None
    db.delete(role)
    db.commit()
    return role

# =========================================================
# PRIVILEGE CRUD
# =========================================================
def create_privilege(db: Session, code: str, description: str = None):
    privilege = models.Privilege(code=code, description=description, createdby=get_created_by())
    db.add(privilege)
    db.commit()
    db.refresh(privilege)
    return privilege

def get_privilege(db: Session, privilege_id: int):
    return db.query(models.Privilege).filter(models.Privilege.id == privilege_id).first()

def list_privileges(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Privilege).offset(skip).limit(limit).all()

def update_privilege(db: Session, privilege_id: int, code: str = None, description: str = None):
    privilege = get_privilege(db, privilege_id)
    if not privilege:
        return None
    if code:
        privilege.code = code
    if description:
        privilege.description = description
    db.commit()
    db.refresh(privilege)
    return privilege

def delete_privilege(db: Session, privilege_id: int):
    privilege = get_privilege(db, privilege_id)
    if not privilege:
        return None
    db.delete(privilege)
    db.commit()
    return privilege

# =========================================================
# USER CRUD
# =========================================================
def create_user(db: Session, full_name: str, email: str, password_hash: str, role_id: int, phone: str = None):
    created_by = get_created_by()
    if (not created_by or created_by == "system") and email:
        created_by = email
    user = models.User(full_name=full_name, email=email, password_hash=password_hash, role_id=role_id, phone=phone, createdby=created_by)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def list_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, **kwargs):
    user = get_user(db, user_id)
    if not user:
        return None
    for key, value in kwargs.items():
        # Only update fields that are provided (not None)
        if hasattr(user, key) and value is not None:
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = get_user(db, user_id)
    if not user:
        return None
    db.delete(user)
    db.commit()
    return user

# =========================================================
# STAFF CRUD
# =========================================================
def create_staff(db: Session, user_id: int, license_number: str = None, skills: list = None, latitude: float = None, longitude: float = None):
    staff = models.Staff(user_id=user_id, license_number=license_number, skills=skills or [], latitude=latitude, longitude=longitude, createdby=get_created_by())
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff

def get_staff(db: Session, staff_id: int):
    return db.query(models.Staff).filter(models.Staff.id == staff_id).first()

def list_staff(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Staff).offset(skip).limit(limit).all()

def update_staff(db: Session, staff_id: int, **kwargs):
    staff = get_staff(db, staff_id)
    if not staff:
        return None
    for key, value in kwargs.items():
        # Only update fields that are provided (not None)
        if hasattr(staff, key) and value is not None:
            setattr(staff, key, value)
    db.commit()
    db.refresh(staff)
    return staff

def delete_staff(db: Session, staff_id: int):
    staff = get_staff(db, staff_id)
    if not staff:
        return None
    db.delete(staff)
    db.commit()
    return staff

# =========================================================
# PATIENT CRUD
# =========================================================
def create_patient(db: Session, full_name: str, address: str = None, latitude: float = None, longitude: float = None, phone: str = None, email: str = None):
    created_by = get_created_by()
    if (not created_by or created_by == "system") and email:
        created_by = email
    patient = models.Patient(full_name=full_name, address=address, latitude=latitude, longitude=longitude, phone=phone, email=email, createdby=created_by)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

def get_patient(db: Session, patient_id: int):
    return db.query(models.Patient).filter(models.Patient.id == patient_id).first()

def list_patients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Patient).offset(skip).limit(limit).all()

def update_patient(db: Session, patient_id: int, **kwargs):
    patient = get_patient(db, patient_id)
    if not patient:
        return None
    for key, value in kwargs.items():
        # Only update fields that are provided (not None)
        if hasattr(patient, key) and value is not None:
            setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    return patient

def delete_patient(db: Session, patient_id: int):
    patient = get_patient(db, patient_id)
    if not patient:
        return None
    db.delete(patient)
    db.commit()
    return patient

# =========================================================
# SERVICE REQUEST CRUD
# =========================================================
def create_service_request(db: Session, patient_id: int, description: str, required_skill: str):
    request = models.ServiceRequest(patient_id=patient_id, description=description, required_skill=required_skill, createdby=get_created_by())
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

def get_service_request(db: Session, request_id: int):
    return db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()

def list_service_requests(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ServiceRequest).offset(skip).limit(limit).all()

def update_service_request(db: Session, request_id: int, **kwargs):
    request = get_service_request(db, request_id)
    if not request:
        return None
    for key, value in kwargs.items():
        # Only update fields that are provided (not None)
        if hasattr(request, key) and value is not None:
            setattr(request, key, value)
    db.commit()
    db.refresh(request)
    return request

def delete_service_request(db: Session, request_id: int):
    request = get_service_request(db, request_id)
    if not request:
        return None
    db.delete(request)
    db.commit()
    return request

# =========================================================
# ASSIGNMENT CRUD
# =========================================================
def create_assignment(db: Session, service_request_id: int, staff_id: int, confirmed: bool = False):
    assignment = models.Assignment(service_request_id=service_request_id, staff_id=staff_id, confirmed=confirmed, createdby=get_created_by())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

def get_assignment(db: Session, assignment_id: int):
    return db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()

def list_assignments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Assignment).offset(skip).limit(limit).all()

def update_assignment(db: Session, assignment_id: int, **kwargs):
    assignment = get_assignment(db, assignment_id)
    if not assignment:
        return None
    for key, value in kwargs.items():
        # Only update fields that are provided (not None)
        if hasattr(assignment, key) and value is not None:
            setattr(assignment, key, value)
    db.commit()
    db.refresh(assignment)
    return assignment

# =========================================================
# VISITS & FEEDBACK & COMPLIANCE
# =========================================================

def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        # Support both "YYYY-MM-DDTHH:MM:SS" and Z-suffixed UTC
        value_norm = value.replace('Z', '+00:00')
        return datetime.fromisoformat(value_norm)
    except Exception:
        return None

# ---- Visits ----
def create_visit(db: Session, patient_id: int, staff_id: int, scheduled_time: str | None, notes: str | None = None):
    scheduled_dt = _parse_iso_datetime(scheduled_time)
    visit = models.Visit(
        patient_id=patient_id,
        staff_id=staff_id,
        scheduled_time=scheduled_dt,
        notes=notes,
        createdby=get_created_by(),
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit

def get_visit(db: Session, visit_id: int):
    return db.query(models.Visit).filter(models.Visit.id == visit_id).first()

def update_visit(db: Session, visit_id: int, completed: bool | None = None, notes: str | None = None):
    visit = get_visit(db, visit_id)
    if not visit:
        return None
    if completed is not None:
        visit.completed = bool(completed)
    if notes is not None:
        visit.notes = notes
    db.commit()
    db.refresh(visit)
    return visit

def complete_visit(db: Session, visit_id: int):
    return update_visit(db, visit_id, completed=True)

def list_today_visits(db: Session):
    start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return db.query(models.Visit).filter(models.Visit.scheduled_time >= start, models.Visit.scheduled_time < end).all()

# ---- Feedback ----
def create_feedback(db: Session, visit_id: int, rating: int, comments: str | None = None):
    fb = models.Feedback(visit_id=visit_id, rating=rating, comments=comments, createdby=get_created_by())
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb

def get_feedback(db: Session, feedback_id: int):
    return db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()

# ---- Compliance ----
def create_compliance(db: Session, staff_id: int, document_type: str, document_number: str, expiry_date: str):
    expiry_dt = _parse_iso_datetime(expiry_date) or _parse_iso_datetime(f"{expiry_date}T00:00:00")
    rec = models.Compliance(
        staff_id=staff_id,
        document_type=document_type,
        document_number=document_number,
        expiry_date=expiry_dt,
        valid=True,
        createdby=get_created_by(),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

def get_compliance(db: Session, compliance_id: int):
    return db.query(models.Compliance).filter(models.Compliance.id == compliance_id).first()

def update_compliance(db: Session, compliance_id: int, valid: bool | None = None):
    rec = get_compliance(db, compliance_id)
    if not rec:
        return None
    if valid is not None:
        rec.valid = bool(valid)
    db.commit()
    db.refresh(rec)
    return rec

def delete_assignment(db: Session, assignment_id: int):
    assignment = get_assignment(db, assignment_id)
    if not assignment:
        return None
    db.delete(assignment)
    db.commit()
    return assignment

# =========================================================
# SHIFTS HELPERS (start/end)
# =========================================================
def start_shift(db: Session, staff_id: int, start_lat: float | None = None, start_lng: float | None = None, purpose: str | None = None):
    shift = models.Shift(
        staff_id=staff_id,
        purpose=purpose,
        start_time=datetime.utcnow(),
        start_lat=start_lat,
        start_lng=start_lng,
        status=models.ShiftStatus.STARTED,
        createdby=get_created_by(),
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift

def end_shift(db: Session, shift_id: int, end_lat: float | None = None, end_lng: float | None = None):
    shift = db.query(models.Shift).filter(models.Shift.id == shift_id).first()
    if not shift:
        return None
    shift.end_time = datetime.utcnow()
    shift.end_lat = end_lat
    shift.end_lng = end_lng
    shift.status = models.ShiftStatus.ENDED
    db.commit()
    db.refresh(shift)
    return shift

# Convenience: assign staff to a patient service request (accepts optional staff)
def assign_staff_to_patient_request(
    db: Session,
    request_id: int,
    staff_id: int | None = None,
    priority: str | None = None,
    due_date: datetime | None = None,
):
    # Create or update assignment linked to the request
    assignment = models.Assignment(service_request_id=request_id, staff_id=staff_id)
    db.add(assignment)
    # Update service request status
    req = get_service_request(db, request_id)
    if req:
        req.status = models.RequestStatus.ASSIGNED
    db.commit()
    db.refresh(assignment)
    return assignment

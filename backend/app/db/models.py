from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, Enum,
    Table, JSON, func
)
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum
import datetime

# =========================================================
# ENUMS
# =========================================================
class RequestStatus(str, enum.Enum):
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ShiftStatus(str, enum.Enum):
    STARTED = "started"
    ENDED = "ended"
    VERIFIED = "verified"

class PayrollStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"

# =========================================================
# ASSOCIATION TABLES
# =========================================================
role_privilege_table = Table(
    "role_privileges",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE")),
    Column("privilege_id", Integer, ForeignKey("privileges.id", ondelete="CASCADE")),
)

# =========================================================
# PRIVILEGE / ROLE / USER
# =========================================================
class Privilege(Base):
    __tablename__ = "privileges"

    id = Column(Integer, primary_key=True)
    code = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))
    roles = relationship("Role", secondary=role_privilege_table, back_populates="privileges")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))
    privileges = relationship("Privilege", secondary=role_privilege_table, back_populates="roles")
    users = relationship("User", back_populates="role")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(50))
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("Role", back_populates="users")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

    staff_profile = relationship("Staff", back_populates="user", uselist=False)

# =========================================================
# STAFF AND PATIENT PROFILES
# =========================================================
class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    license_number = Column(String(100))
    certification_expiry = Column(DateTime)
    skills = Column(JSON)  # e.g., ["nursing", "CPR", "medication"]
    latitude = Column(Float)
    longitude = Column(Float)
    available = Column(Boolean, default=True)

    user = relationship("User", back_populates="staff_profile")
    assignments = relationship("Assignment", back_populates="staff")
    shifts = relationship("Shift", back_populates="staff")
    timesheets = relationship("Timesheet", back_populates="staff")
    compliance_records = relationship("Compliance", back_populates="staff")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(255))
    address = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)
    phone = Column(String(50))
    email = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    requests = relationship("ServiceRequest", back_populates="patient")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

# =========================================================
# SERVICE REQUESTS & ASSIGNMENTS
# =========================================================
class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    description = Column(Text)
    required_skill = Column(String(100))
    status = Column(Enum(RequestStatus), default=RequestStatus.OPEN)
    created_at = Column(DateTime, server_default=func.now())

    patient = relationship("Patient", back_populates="requests")
    assignment = relationship("Assignment", back_populates="service_request", uselist=False)
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True)
    service_request_id = Column(Integer, ForeignKey("service_requests.id"))
    staff_id = Column(Integer, ForeignKey("staff.id"))
    assigned_at = Column(DateTime, server_default=func.now())
    confirmed = Column(Boolean, default=False)

    service_request = relationship("ServiceRequest", back_populates="assignment")
    staff = relationship("Staff", back_populates="assignments")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

# =========================================================
# SHIFT, TIMESHEET, PAYROLL
# =========================================================
class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True)
    staff_id = Column(Integer, ForeignKey("staff.id"))
    purpose = Column(String(255))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    start_lat = Column(Float)
    start_lng = Column(Float)
    end_lat = Column(Float)
    end_lng = Column(Float)
    status = Column(Enum(ShiftStatus), default=ShiftStatus.STARTED)
    staff = relationship("Staff", back_populates="shifts")
    timesheet = relationship("Timesheet", back_populates="shift", uselist=False)
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

class Timesheet(Base):
    __tablename__ = "timesheets"

    id = Column(Integer, primary_key=True)
    staff_id = Column(Integer, ForeignKey("staff.id"))
    shift_id = Column(Integer, ForeignKey("shifts.id"))
    total_hours = Column(Float)
    submitted = Column(Boolean, default=False)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    staff = relationship("Staff", back_populates="timesheets")
    shift = relationship("Shift", back_populates="timesheet")
    payroll = relationship("Payroll", back_populates="timesheet", uselist=False)
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

class Payroll(Base):
    __tablename__ = "payroll"

    id = Column(Integer, primary_key=True)
    timesheet_id = Column(Integer, ForeignKey("timesheets.id"))
    hourly_rate = Column(Float)
    total_pay = Column(Float)
    status = Column(Enum(PayrollStatus), default=PayrollStatus.PENDING)
    generated_at = Column(DateTime, server_default=func.now())

    timesheet = relationship("Timesheet", back_populates="payroll")
    invoice = relationship("Invoice", back_populates="payroll", uselist=False)
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True)
    payroll_id = Column(Integer, ForeignKey("payroll.id"))
    invoice_number = Column(String(100), unique=True)
    amount = Column(Float)
    sent = Column(Boolean, default=False)
    paid = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    payroll = relationship("Payroll", back_populates="invoice")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

# =========================================================
# COMPLIANCE & REGULATORY CHECK
# =========================================================
class Compliance(Base):
    __tablename__ = "compliance"

    id = Column(Integer, primary_key=True)
    staff_id = Column(Integer, ForeignKey("staff.id"))
    document_type = Column(String(100))  # e.g., "license", "CPR_certificate"
    document_number = Column(String(100))
    expiry_date = Column(DateTime)
    valid = Column(Boolean, default=True)
    last_checked = Column(DateTime, onupdate=func.now())

    staff = relationship("Staff", back_populates="compliance_records")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

# =========================================================
# PATIENT VISITS & FEEDBACK
# =========================================================
class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    staff_id = Column(Integer, ForeignKey("staff.id"))
    scheduled_time = Column(DateTime)
    completed = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    feedback = relationship("Feedback", back_populates="visit", uselist=False)
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True)
    visit_id = Column(Integer, ForeignKey("visits.id"))
    rating = Column(Integer)  # e.g., 1–5
    comments = Column(Text)
    submitted_at = Column(DateTime, server_default=func.now())

    visit = relationship("Visit", back_populates="feedback")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

# =========================================================
# EMAIL TOKENS (verification / notifications)
# =========================================================
class EmailToken(Base):
    __tablename__ = "email_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    email = Column(String(255), index=True)
    token = Column(String(255), unique=True, index=True, nullable=False)
    purpose = Column(String(50), default="verify")  # e.g., verify, welcome
    used = Column(Boolean, default=False)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

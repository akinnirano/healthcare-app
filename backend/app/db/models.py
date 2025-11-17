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
# COMPANY & COUNTRY (Multi-tenancy)
# =========================================================
class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True)
    code = Column(String(3), unique=True, nullable=False)  # US, CA
    name = Column(String(100), nullable=False)  # United States, Canada
    currency = Column(String(3), default="USD")  # USD, CAD
    is_active = Column(Boolean, default=True)
    
    companies = relationship("Company", back_populates="country")
    tax_rates = relationship("TaxRate", back_populates="country")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)  # For company login to docs
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    address = Column(Text)
    phone = Column(String(50))
    registration_number = Column(String(100))  # Business registration number
    tax_id = Column(String(100))  # Tax ID / EIN
    discord_webhook_url = Column(String(500))  # Discord webhook URL for notifications
    is_active = Column(Boolean, default=True)
    
    country = relationship("Country", back_populates="companies")
    users = relationship("User", back_populates="company")
    api_keys = relationship("CompanyApiKey", back_populates="company")
    staff_salary_configs = relationship("StaffSalaryConfig", back_populates="company")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

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
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)  # Multi-tenancy
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=True)  # For tax
    role = relationship("Role", back_populates="users")
    company = relationship("Company", back_populates="users")
    country = relationship("Country")
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
    salary_config = relationship("StaffSalaryConfig", back_populates="staff", uselist=False)
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
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)  # Link directly to staff
    timesheet_id = Column(Integer, ForeignKey("timesheets.id"), nullable=True)  # Optional
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)  # Company isolation
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=True)  # For tax calculation
    
    # Pay calculation
    hours_worked = Column(Float, nullable=False, default=0.0)
    hourly_rate = Column(Float, nullable=False, default=0.0)
    gross_pay = Column(Float, nullable=False, default=0.0)
    
    # Tax deductions (Canada/US)
    federal_tax = Column(Float, default=0.0)
    state_provincial_tax = Column(Float, default=0.0)
    social_security_tax = Column(Float, default=0.0)  # US: SS, CA: CPP
    medicare_tax = Column(Float, default=0.0)  # US: Medicare, CA: EI
    other_deductions = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    net_pay = Column(Float, nullable=False, default=0.0)
    
    # Backward compatibility
    total_pay = Column(Float)  # Keep old field for compatibility
    
    # Status and dates
    status = Column(Enum(PayrollStatus), default=PayrollStatus.PENDING)
    pay_period_start = Column(DateTime)
    pay_period_end = Column(DateTime)
    generated_at = Column(DateTime, server_default=func.now())
    paid_at = Column(DateTime, nullable=True)
    
    # Tax calculation details (JSON for flexibility)
    tax_calculation_details = Column(JSON)
    
    # Relationships
    staff = relationship("Staff")
    company = relationship("Company")
    country = relationship("Country")
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

# =========================================================
# TAX RATES (Canada & US)
# =========================================================
class TaxRate(Base):
    __tablename__ = "tax_rates"

    id = Column(Integer, primary_key=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    state_province = Column(String(50))  # State/Province code (e.g., CA, ON, TX)
    tax_year = Column(Integer, nullable=False)  # e.g., 2025
    
    # Federal taxes
    federal_rate = Column(Float, default=0.0)  # % rate
    federal_bracket_min = Column(Float, default=0.0)  # Income threshold min
    federal_bracket_max = Column(Float, nullable=True)  # Income threshold max (null = no cap)
    
    # State/Provincial taxes
    state_provincial_rate = Column(Float, default=0.0)
    
    # Social Security / CPP
    social_security_rate = Column(Float, default=0.0)  # US: 6.2%, CA: 5.95%
    social_security_max_income = Column(Float, nullable=True)  # Cap on taxable income
    
    # Medicare / EI
    medicare_rate = Column(Float, default=0.0)  # US: 1.45%, CA: 1.58%
    medicare_max_income = Column(Float, nullable=True)
    
    # Additional info
    description = Column(String(255))
    is_active = Column(Boolean, default=True)
    
    country = relationship("Country", back_populates="tax_rates")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

# =========================================================
# STAFF SALARY CONFIGURATION
# =========================================================
class StaffSalaryConfig(Base):
    __tablename__ = "staff_salary_config"

    id = Column(Integer, primary_key=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False, unique=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Salary details
    hourly_rate = Column(Float, nullable=False)
    expected_hours_per_week = Column(Float, default=40.0)
    expected_hours_per_pay_period = Column(Float)
    
    # Pay period settings
    pay_frequency = Column(String(20), default="biweekly")  # weekly, biweekly, monthly
    
    # Overtime settings
    overtime_rate_multiplier = Column(Float, default=1.5)  # 1.5x for overtime
    overtime_threshold_hours = Column(Float, default=40.0)  # Weekly overtime threshold
    
    # Benefits/Additional
    has_benefits = Column(Boolean, default=False)
    benefits_deduction = Column(Float, default=0.0)
    additional_deductions = Column(JSON)  # Flexible for other deductions
    
    # Status
    effective_date = Column(DateTime, server_default=func.now())
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    staff = relationship("Staff", back_populates="salary_config")
    company = relationship("Company", back_populates="staff_salary_configs")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

# =========================================================
# COMPANY API KEYS (for docs-website authentication)
# =========================================================
class CompanyApiKey(Base):
    __tablename__ = "company_api_keys"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    key = Column(String(255), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    last_used = Column(DateTime, nullable=True)
    
    company = relationship("Company", back_populates="api_keys")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

# =========================================================
# USER API KEYS (DEPRECATED - use CompanyApiKey instead)
# =========================================================
class DocsApiKey(Base):
    __tablename__ = "docs_api_keys"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key = Column(String(255), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    last_used = Column(DateTime, nullable=True)
    
    user = relationship("User", backref="api_keys")
    createdby = Column(String(255), default="system")
    datecreated = Column(DateTime, server_default=func.now())

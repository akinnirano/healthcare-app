from fastapi import FastAPI, Request
from app.db.database import init_db
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    assignments,
    compliance,
    feedback,
    invoices,
    operations,
    patients,
    payroll,
    priviledges,
    roles,
    service_requests,
    shifts,
    staff,
    timesheets,
    users,
    visits,
    auth,
    mapdata
)
from app.db.database import SessionLocal
from app.db import models
from app.db import crud as crud_module
from app.routers.security import decode_access_token

# =========================================================
# Initialize FastAPI App
# =========================================================
app = FastAPI(
    title="Healthcare Staffing & Management API",
    version="1.0.0",
    description="API to manage staff assignments, timesheets, payroll, compliance, and patient visits."
)

# CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[

        "https://healthcare.hremsoftconsulting.com",
        "https://api.hremsoftconsulting.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# Initialize Database
# =========================================================
init_db()  # Creates all tables if they don't exist

# =========================================================
# Include Routers
# =========================================================
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(roles.router, prefix="/roles", tags=["Roles"])
app.include_router(staff.router, prefix="/staff", tags=["Staff"])
app.include_router(patients.router, prefix="/patients", tags=["Patients"])
app.include_router(service_requests.router, prefix="/service_requests", tags=["Service Requests"])
app.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])
app.include_router(shifts.router, prefix="/shifts", tags=["Shifts"])
app.include_router(timesheets.router, prefix="/timesheets", tags=["Timesheets"])
app.include_router(payroll.router, prefix="/payroll", tags=["Payroll"])
app.include_router(priviledges.router, prefix="/priviledges", tags=["Priviledges"])
app.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
app.include_router(compliance.router, prefix="/compliance", tags=["Compliance"])
app.include_router(operations.router, prefix="/operations", tags=["Operations"])
app.include_router(visits.router, prefix="/visits", tags=["Visits"])
app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])
app.include_router(mapdata.router, prefix="/map", tags=["MapData"]) 

# =========================================================
# Root Endpoint
# =========================================================
@app.get("/")
def root():
    return {"message": "Welcome to the Healthcare Staffing & Management API!"}

# =========================================================
# Middleware: set createdby from current authenticated user (if any)
# =========================================================
@app.middleware("http")
async def attach_created_by(request: Request, call_next):
    created_by = "system"
    try:
        auth = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split()[1]
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            if user_id:
                db = SessionLocal()
                try:
                    u = db.get(models.User, int(user_id))
                    if u:
                        created_by = u.email or u.full_name or f"user:{u.id}"
                finally:
                    db.close()
    except Exception:
        created_by = "system"
    try:
        crud_module.set_created_by(created_by)
    except Exception:
        pass
    response = await call_next(request)
    return response

# =========================================================
# Optional: Startup & Shutdown Events
# =========================================================
@app.on_event("startup")
async def startup_event():
    print("Application startup: initializing resources...")

@app.on_event("shutdown")
async def shutdown_event():
    print("Application shutdown: cleaning up resources...")

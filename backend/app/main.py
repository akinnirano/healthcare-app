from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.db.database import init_db
from fastapi.middleware.cors import CORSMiddleware
import os
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
    mapdata,
    location
)
from app.db.database import SessionLocal
from app.db import models
from app.db import crud as crud_module
from app.routers.security import decode_access_token, get_current_active_user

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
# Public endpoints (no JWT required)
app.include_router(auth.router, prefix="/auth", tags=["Auth"])  # login, verify email, etc.

# Registration endpoints (no JWT required for POST operations used by registration)
# Individual endpoints will handle authentication where needed
app.include_router(users.router, prefix="/users", tags=["Users"])  # POST for registration
app.include_router(roles.router, prefix="/roles", tags=["Roles"])  # GET for registration (role lookup)
app.include_router(staff.router, prefix="/staff", tags=["Staff"])  # POST for practitioner registration
app.include_router(patients.router, prefix="/patients", tags=["Patients"])  # POST for patient registration
app.include_router(priviledges.router, prefix="/priviledges", tags=["Priviledges"])  # GET/POST for admin setup

# Protected endpoints (JWT required for all operations)
secured = [Depends(get_current_active_user)]
app.include_router(service_requests.router, prefix="/service_requests", tags=["Service Requests"], dependencies=secured)
app.include_router(assignments.router, prefix="/assignments", tags=["Assignments"], dependencies=secured)
app.include_router(shifts.router, prefix="/shifts", tags=["Shifts"], dependencies=secured)
app.include_router(timesheets.router, prefix="/timesheets", tags=["Timesheets"], dependencies=secured)
app.include_router(payroll.router, prefix="/payroll", tags=["Payroll"], dependencies=secured)
app.include_router(invoices.router, prefix="/invoices", tags=["Invoices"], dependencies=secured)
app.include_router(compliance.router, prefix="/compliance", tags=["Compliance"], dependencies=secured)
app.include_router(operations.router, prefix="/operations", tags=["Operations"], dependencies=secured)
app.include_router(visits.router, prefix="/visits", tags=["Visits"], dependencies=secured)
app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"], dependencies=secured)
app.include_router(mapdata.router, prefix="/map", tags=["MapData"], dependencies=secured)
app.include_router(location.router, prefix="/location", tags=["Location"], dependencies=secured) 

# =========================================================
# Serve Documentation Website
# =========================================================
# Try multiple paths to find docs-website dist folder
docs_dist_path = None
possible_paths = [
    "/app/docs-website/dist",  # Docker container path
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "docs-website", "dist"),  # Relative path
    os.path.join(os.getcwd(), "docs-website", "dist"),  # Current working directory
]

for path in possible_paths:
    if os.path.exists(path) and os.path.isdir(path):
        docs_dist_path = path
        print(f"✓ Found docs-website at: {docs_dist_path}")
        break

if docs_dist_path:
    try:
        # Mount static files (CSS, JS, images, etc.) first
        # This will handle files like /docs-website/assets/...
        static_files = StaticFiles(directory=docs_dist_path)
        app.mount("/docs-website/assets", static_files, name="docs-assets")
        
        # Also mount docs folder for markdown files
        docs_public_path = os.path.join(docs_dist_path, "docs")
        if os.path.exists(docs_public_path):
            app.mount("/docs-website/docs", StaticFiles(directory=docs_public_path), name="docs-markdown")
        
        # Catch-all route for React Router client-side routing
        # This must be AFTER the static mounts but handles all other paths
        @app.get("/docs-website/{full_path:path}")
        async def serve_docs_website(full_path: str):
            """
            Serve React Router app. For client-side routes like /docs-website/getting-started,
            serve index.html so React Router can handle the routing.
            """
            # Check if it's a file request (has extension)
            if '.' in full_path and '/' not in full_path.split('/')[-1]:
                # It might be a direct file request, try to serve it
                file_path = os.path.join(docs_dist_path, full_path)
                if os.path.isfile(file_path):
                    return FileResponse(file_path)
            
            # For all other paths (React Router routes), serve index.html
            index_path = os.path.join(docs_dist_path, "index.html")
            if os.path.isfile(index_path):
                return FileResponse(index_path)
            raise HTTPException(status_code=404, detail="Documentation not found")
        
        # Also handle root /docs-website path
        @app.get("/docs-website/")
        async def serve_docs_root():
            """Serve index.html for /docs-website/ root path"""
            index_path = os.path.join(docs_dist_path, "index.html")
            if os.path.isfile(index_path):
                return FileResponse(index_path)
            raise HTTPException(status_code=404, detail="Documentation not found")
        
        print(f"✓ Mounted documentation website at /docs-website/")
    except Exception as e:
        print(f"✗ Failed to mount docs-website: {e}")
        import traceback
        traceback.print_exc()
else:
    print("⚠ docs-website/dist not found. Documentation will not be available.")
    print(f"  Searched paths: {possible_paths}")

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

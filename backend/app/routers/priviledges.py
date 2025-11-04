from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import models, crud
from ..db.database import get_db
from .security import get_current_active_user

router = APIRouter()

@router.post("/", response_model=dict, summary="Create privilege (public for registration)")
def create_privilege(code: str, description: str = None, db: Session = Depends(get_db)):
    privilege = crud.create_privilege(db, code=code, description=description)
    return {"id": privilege.id, "code": privilege.code, "description": privilege.description}

@router.get("/{privilege_id}", response_model=dict, summary="Get privilege (public for registration)")
def get_privilege(privilege_id: int, db: Session = Depends(get_db)):
    privilege = crud.get_privilege(db, privilege_id)
    if not privilege:
        raise HTTPException(status_code=404, detail="Privilege not found")
    return {"id": privilege.id, "code": privilege.code, "description": privilege.description}

@router.get("/", response_model=List[dict], summary="List privileges (public for registration)")
def list_privileges(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    privileges = crud.list_privileges(db, skip=skip, limit=limit)
    return [{"id": p.id, "code": p.code, "description": p.description} for p in privileges]

@router.put("/{privilege_id}", response_model=dict, summary="Update privilege (requires JWT)")
def update_privilege(privilege_id: int, code: str = None, description: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    privilege = crud.update_privilege(db, privilege_id, code=code, description=description)
    if not privilege:
        raise HTTPException(status_code=404, detail="Privilege not found")
    return {"id": privilege.id, "code": privilege.code, "description": privilege.description}

@router.delete("/{privilege_id}", response_model=dict, summary="Delete privilege (requires JWT)")
def delete_privilege(privilege_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    privilege = crud.delete_privilege(db, privilege_id)
    if not privilege:
        raise HTTPException(status_code=404, detail="Privilege not found")
    return {"detail": f"Privilege {privilege.code} deleted successfully"}

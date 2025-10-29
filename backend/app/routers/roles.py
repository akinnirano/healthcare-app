from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db import models, crud
from ..db.database import get_db

router = APIRouter()

# --------------------------
# CREATE ROLE WITH PRIVILEGES
# --------------------------
@router.post("/", response_model=dict)
def create_role(name: str, description: str = None, privilege_ids: List[int] = [], db: Session = Depends(get_db)):
    existing_role = db.query(models.Role).filter(models.Role.name == name).first()
    if existing_role:
        raise HTTPException(status_code=400, detail="Role already exists")
    
    role = crud.create_role(db, name=name, description=description)
    
    # Assign privileges
    privileges = db.query(models.Privilege).filter(models.Privilege.id.in_(privilege_ids)).all()
    role.privileges = privileges
    db.commit()
    db.refresh(role)
    
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "privileges": [{"id": p.id, "code": p.code} for p in role.privileges]
    }

# --------------------------
# GET ROLE BY ID
# --------------------------
@router.get("/{role_id}", response_model=dict)
def get_role(role_id: int, db: Session = Depends(get_db)):
    role = crud.get_role(db, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "privileges": [{"id": p.id, "code": p.code} for p in role.privileges]
    }

# --------------------------
# LIST ALL ROLES
# --------------------------
@router.get("/", response_model=List[dict])
def list_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    roles = crud.list_roles(db, skip=skip, limit=limit)
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "privileges": [{"id": p.id, "code": p.code} for p in r.privileges]
        } for r in roles
    ]

# --------------------------
# UPDATE ROLE
# --------------------------
@router.put("/{role_id}", response_model=dict)
def update_role(role_id: int, name: str = None, description: str = None, privilege_ids: List[int] = None, db: Session = Depends(get_db)):
    role = crud.update_role(db, role_id, name=name, description=description)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if privilege_ids is not None:
        privileges = db.query(models.Privilege).filter(models.Privilege.id.in_(privilege_ids)).all()
        role.privileges = privileges
        db.commit()
        db.refresh(role)
    
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "privileges": [{"id": p.id, "code": p.code} for p in role.privileges]
    }

# --------------------------
# DELETE ROLE
# --------------------------
@router.delete("/{role_id}", response_model=dict)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    role = crud.delete_role(db, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"detail": f"Role {role.name} deleted successfully"}

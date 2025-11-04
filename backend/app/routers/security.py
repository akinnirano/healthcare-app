import os
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..db import models
from ..db.database import SessionLocal

SECRET_KEY = os.getenv('SECRET_KEY', 'change-me-in-prod')
ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/auth/login')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: str, expires_delta: Optional[timedelta] = None, additional_claims: dict = None) -> str:
    to_encode = {'sub': str(subject)}
    if additional_claims:
        to_encode.update(additional_claims)
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({'exp': expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    """
    Decodes and validates JWT token.
    Raises 401 if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail='Token has expired',
            headers={'WWW-Authenticate': 'Bearer'}
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail='Could not validate credentials',
            headers={'WWW-Authenticate': 'Bearer'}
        )


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """
    Validates JWT token and returns the current authenticated user.
    Raises 401 if token is invalid or user not found.
    """
    payload = decode_access_token(token)
    user_id = payload.get('sub')
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail='Invalid token payload',
            headers={'WWW-Authenticate': 'Bearer'}
        )
    user = db.get(models.User, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail='User not found',
            headers={'WWW-Authenticate': 'Bearer'}
        )
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Inactive user')
    return current_user

def roles_required(allowed_roles: List[str]):
    """
    Dependency that requires the current user to have one of the specified roles.
    Usage: Depends(roles_required(['admin', 'manager']))
    """
    def _dependency(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
        role_name = None
        if current_user.role_id:
            r = db.get(models.Role, current_user.role_id)
            role_name = r.name if r else None
        if role_name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f'Insufficient privileges. Required roles: {", ".join(allowed_roles)}'
            )
        return current_user
    return _dependency

def privileges_required(required_codes: List[str]):
    """
    Dependency that requires the current user to have all specified privilege codes.
    Usage: Depends(privileges_required(['read_patients', 'write_patients']))
    """
    required = [c.lower() for c in required_codes or []]
    def _dependency(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
        codes: List[str] = []
        if current_user.role_id:
            r = db.get(models.Role, current_user.role_id)
            if r and getattr(r, 'privileges', None):
                try:
                    codes = [p.code.lower() for p in r.privileges if p and p.code]
                except Exception:
                    codes = []
        missing = [code for code in required if code not in codes]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f'Insufficient privileges. Missing: {", ".join(missing)}'
            )
        return current_user
    return _dependency

"""
Auth router
POST /api/auth/register   — create account
POST /api/auth/login      — returns JWT
GET  /api/auth/me         — current user profile
PUT  /api/auth/profile    — update profile fields
PUT  /api/auth/password   — change password
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from ..models.database import get_db
from ..services.auth_service import (
    create_user, authenticate_user, create_access_token,
    decode_token, get_user_by_id, update_profile, change_password,
)
from ..models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Dependency: current user ──────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive.")
    return user


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    subject: Optional[str] = ""
    department: Optional[str] = ""
    grade_level: Optional[str] = ""


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    subject: Optional[str] = None
    department: Optional[str] = None
    grade_level: Optional[str] = None
    bio: Optional[str] = None
    avatar_color: Optional[str] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": f"{user.first_name} {user.last_name}",
        "subject": user.subject or "",
        "department": user.department or "",
        "grade_level": user.grade_level or "",
        "bio": user.bio or "",
        "avatar_color": user.avatar_color or "#D01012",
        "is_admin": getattr(user, "is_admin", False),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201, summary="Register a new teacher account")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = create_user(
            db,
            email=req.email,
            password=req.password,
            first_name=req.first_name,
            last_name=req.last_name,
            subject=req.subject or "",
            department=req.department or "",
            grade_level=req.grade_level or "",
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": _user_to_dict(user)}


@router.post("/login", summary="Login and receive JWT token")
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": _user_to_dict(user)}


@router.get("/me", summary="Get current user profile")
def get_me(current_user: User = Depends(get_current_user)):
    return _user_to_dict(current_user)


@router.put("/profile", summary="Update teacher profile")
def update_teacher_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated = update_profile(db, current_user.id, data.model_dump(exclude_none=True))
    return _user_to_dict(updated)


@router.put("/password", summary="Change password")
def change_pw(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ok = change_password(db, current_user.id, data.old_password, data.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    return {"message": "Password updated successfully."}

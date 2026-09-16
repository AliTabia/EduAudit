"""
Auth Service
- Password hashing with bcrypt (via passlib)
- JWT access token creation and verification
- User CRUD against SQLite
"""

import uuid
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..models.user import User

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_IN_PRODUCTION_use_openssl_rand_hex_32")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    """Return user_id from a valid token, or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ── User CRUD ─────────────────────────────────────────────────────────────────

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower()).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(
    db: Session,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    subject: str = "",
    department: str = "",
    grade_level: str = "",
) -> User:
    if get_user_by_email(db, email):
        raise ValueError("An account with this email already exists.")

    user = User(
        id=str(uuid.uuid4()),
        email=email.lower().strip(),
        hashed_password=hash_password(password),
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        subject=subject.strip(),
        department=department.strip(),
        grade_level=grade_level.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"New user registered: {user.email} ({user.id})")
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def update_profile(db: Session, user_id: str, data: dict) -> Optional[User]:
    user = get_user_by_id(db, user_id)
    if not user:
        return None

    allowed = {"first_name", "last_name", "subject", "department",
               "grade_level", "bio", "avatar_color"}
    for key, value in data.items():
        if key in allowed and value is not None:
            setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user_id: str, old_pw: str, new_pw: str) -> bool:
    user = get_user_by_id(db, user_id)
    if not user or not verify_password(old_pw, user.hashed_password):
        return False
    user.hashed_password = hash_password(new_pw)
    db.commit()
    return True

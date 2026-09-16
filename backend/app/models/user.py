"""
User / Teacher model.
Each teacher has: credentials + a pedagogical profile.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    # ── Identity ──────────────────────────────────────────────────────────────
    id            = Column(String, primary_key=True, index=True)   # UUID
    email         = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active     = Column(Boolean, default=True)

    # ── Personal info ─────────────────────────────────────────────────────────
    first_name    = Column(String(80), nullable=False)
    last_name     = Column(String(80), nullable=False)

    # ── Teacher profile ───────────────────────────────────────────────────────
    # The subject(s) they teach — free text, e.g. "Mathematics, Statistics"
    subject       = Column(String(200), nullable=True, default="")
    # Their department / option, e.g. "Computer Science", "Business"
    department    = Column(String(200), nullable=True, default="")
    # Their grade level(s), e.g. "1st year", "Master 1"
    grade_level   = Column(String(200), nullable=True, default="")
    # Short bio
    bio           = Column(Text, nullable=True, default="")
    # Avatar colour (hex) — used to generate initials avatar in the UI
    avatar_color  = Column(String(7), nullable=True, default="#D01012")
    is_admin      = Column(Boolean, default=False)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

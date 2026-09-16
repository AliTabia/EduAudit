"""
Database setup — SQLite via SQLAlchemy 2.0.
The DB file lives at backend/data/eduaudit.db
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from pathlib import Path

DB_DIR = Path(__file__).resolve().parents[2] / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{DB_DIR / 'eduaudit.db'}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite + FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and run any pending column migrations."""
    from . import user  # noqa: F401 — ensure model is registered
    Base.metadata.create_all(bind=engine)
    _migrate()


def _migrate():
    """
    Safe ALTER TABLE migrations for SQLite.
    SQLite doesn't support IF NOT EXISTS on ALTER TABLE, so we check manually.
    Add any new columns here — they will be applied automatically on startup.
    """
    import sqlite3
    db_path = str(DB_DIR / "eduaudit.db")
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()

    cur.execute("PRAGMA table_info(users)")
    existing = {row[1] for row in cur.fetchall()}

    pending = [
        ("is_admin",     "BOOLEAN NOT NULL DEFAULT 0"),
        ("avatar_color", "VARCHAR(7) DEFAULT '#D01012'"),
    ]

    for col, definition in pending:
        if col not in existing:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} {definition}")
            import logging
            logging.getLogger(__name__).info(f"Migration: added column users.{col}")

    conn.commit()
    conn.close()

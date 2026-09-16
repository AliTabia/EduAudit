"""
Feature 10 — Admin Role + Department Dashboard
Admin users see all teachers' stats, rankings, and platform-wide metrics.
"""

import logging
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from ..models.database import get_db
from ..models.user import User
from ..routers.auth import get_current_user
from ..services.audit_service import list_audits

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["Admin"])

DATA_DIR   = Path(__file__).resolve().parents[2] / "data"
AUDITS_DIR = DATA_DIR / "audits"


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user


@router.get("/stats", summary="Platform-wide statistics")
def admin_stats(admin: User = Depends(_require_admin), db: Session = Depends(get_db)):
    all_audits = list_audits()  # no user filter

    teachers  = db.query(User).filter(User.is_active == True).all()
    n_teachers = len(teachers)

    scores = [a["global_score"] for a in all_audits]
    avg    = round(sum(scores) / len(scores), 2) if scores else None

    grade_dist: dict = {}
    for a in all_audits:
        g = a["grade"]
        grade_dist[g] = grade_dist.get(g, 0) + 1

    # Per-department stats
    dept_audits: dict = {}
    for a in all_audits:
        dept = a.get("department", "Unknown") or "Unknown"
        dept_audits.setdefault(dept, []).append(a["global_score"])

    dept_stats = {
        dept: {
            "count": len(scores_),
            "avg":   round(sum(scores_) / len(scores_), 2),
        }
        for dept, scores_ in dept_audits.items()
    }

    return {
        "total_audits":       len(all_audits),
        "total_teachers":     n_teachers,
        "average_score":      avg,
        "grade_distribution": grade_dist,
        "department_stats":   dept_stats,
    }


@router.get("/teachers", summary="All teachers with their audit stats")
def admin_teachers(admin: User = Depends(_require_admin), db: Session = Depends(get_db)):
    teachers  = db.query(User).filter(User.is_active == True).all()
    all_audits = list_audits()

    # Build per-teacher audit index
    audit_by_user: dict = {}
    for a in all_audits:
        uid = a.get("user_id") or "unknown"
        audit_by_user.setdefault(uid, []).append(a)

    result = []
    for t in teachers:
        t_audits = audit_by_user.get(t.id, [])
        scores   = [a["global_score"] for a in t_audits]
        result.append({
            "user_id":    t.id,
            "name":       f"{t.first_name} {t.last_name}",
            "email":      t.email,
            "subject":    t.subject or "",
            "department": t.department or "",
            "grade_level": t.grade_level or "",
            "total_audits": len(t_audits),
            "avg_score":  round(sum(scores) / len(scores), 2) if scores else None,
            "best_score": round(max(scores), 2) if scores else None,
            "last_audit": t_audits[0]["created_at"] if t_audits else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        })

    result.sort(key=lambda x: (x["avg_score"] or 0), reverse=True)
    return {"total": len(result), "teachers": result}


@router.get("/audits", summary="All audits across all teachers")
def admin_all_audits(
    admin: User = Depends(_require_admin),
    limit: int = 50,
    offset: int = 0,
):
    all_audits = list_audits()
    paginated  = all_audits[offset: offset + limit]
    return {
        "total":  len(all_audits),
        "offset": offset,
        "limit":  limit,
        "audits": paginated,
    }


@router.get("/rankings", summary="Teacher ranking by average audit score")
def admin_rankings(admin: User = Depends(_require_admin), db: Session = Depends(get_db)):
    teachers   = {t.id: t for t in db.query(User).filter(User.is_active == True).all()}
    all_audits = list_audits()

    audit_by_user: dict = {}
    for a in all_audits:
        uid = a.get("user_id") or "unknown"
        audit_by_user.setdefault(uid, []).append(a)

    rankings = []
    for uid, audits in audit_by_user.items():
        scores  = [a["global_score"] for a in audits]
        teacher = teachers.get(uid)
        rankings.append({
            "rank":         0,
            "user_id":      uid,
            "name":         f"{teacher.first_name} {teacher.last_name}" if teacher else "Unknown",
            "subject":      teacher.subject if teacher else "",
            "department":   teacher.department if teacher else "",
            "avg_score":    round(sum(scores) / len(scores), 2),
            "total_audits": len(audits),
            "trend":        "up" if len(scores) > 1 and scores[0] > scores[1] else "down" if len(scores) > 1 else "stable",
        })

    rankings.sort(key=lambda x: x["avg_score"], reverse=True)
    for i, r in enumerate(rankings):
        r["rank"] = i + 1

    return {"rankings": rankings}


@router.post("/users/{user_id}/promote", summary="Promote user to admin")
def promote_user(
    user_id: str,
    admin: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    from ..services.auth_service import get_user_by_id
    target = get_user_by_id(db, user_id)
    if not target:
        raise HTTPException(404, "User not found.")
    target.is_admin = True
    db.commit()
    return {"message": f"{target.email} promoted to admin."}

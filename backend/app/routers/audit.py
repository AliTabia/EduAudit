"""
Audit router — trigger audits, retrieve reports, list history.
All endpoints require a valid JWT (teacher must be logged in).
Audits are scoped per user.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..models.schemas import AuditRequest, HistoryResponse, HistoryItem, AuditStatus
from ..models.database import get_db
from ..models.user import User
from ..services.audit_service import run_audit, get_audit_report, list_audits
from ..services.document_ingestion import load_document
from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/audit", tags=["Audit"])


@router.post("/run", summary="Run an audit on an uploaded document")
async def trigger_audit(
    request: AuditRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run the full LLM-powered audit pipeline on a document.
    The audit is tagged with the requesting teacher's user_id.
    """
    try:
        load_document(request.doc_id)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Document '{request.doc_id}' not found. Upload it first.",
        )

    valid_criteria = {"pedagogical_coherence", "writing_quality"}
    invalid = set(request.criteria) - valid_criteria
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unknown criteria: {invalid}")
    if not request.criteria:
        raise HTTPException(status_code=400, detail="At least one criterion required.")

    try:
        report = run_audit(
            doc_id=request.doc_id,
            criteria=request.criteria,
            language=request.language,
            user_id=current_user.id,
            user_name=f"{current_user.first_name} {current_user.last_name}",
        )
        return report
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception(f"Audit failed for doc {request.doc_id}")
        raise HTTPException(status_code=500, detail=f"Audit failed: {str(e)}")


@router.get("/report/{audit_id}", summary="Retrieve a saved audit report")
async def get_report(
    audit_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        report = get_audit_report(audit_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Audit '{audit_id}' not found.")
    # Users can only see their own reports (admins could bypass this)
    if report.get("user_id") and report["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return report


@router.get("/history", response_model=HistoryResponse, summary="List my audit reports")
async def get_history(current_user: User = Depends(get_current_user)):
    audits = list_audits(user_id=current_user.id)
    items = [
        HistoryItem(
            audit_id=a["audit_id"],
            doc_id=a["doc_id"],
            filename=a["filename"],
            global_score=a["global_score"],
            grade=a["grade"],
            status=AuditStatus(a["status"]),
            created_at=a["created_at"],
            processing_time_seconds=a["processing_time_seconds"],
        )
        for a in audits
    ]
    return HistoryResponse(total=len(items), items=items)


@router.get("/stats", summary="Get my audit statistics")
async def get_stats(current_user: User = Depends(get_current_user)):
    audits = list_audits(user_id=current_user.id)
    if not audits:
        return {"total_audits": 0, "average_global_score": None, "grade_distribution": {}}

    scores = [a["global_score"] for a in audits]
    avg = round(sum(scores) / len(scores), 2)

    grade_dist: dict = {}
    for a in audits:
        g = a["grade"]
        grade_dist[g] = grade_dist.get(g, 0) + 1

    return {
        "total_audits": len(audits),
        "average_global_score": avg,
        "min_score": round(min(scores), 2),
        "max_score": round(max(scores), 2),
        "grade_distribution": grade_dist,
    }

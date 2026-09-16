"""
Insights Router — 5 advanced features:
1. Open Courseware Comparison
2. Quality Evolution Timeline
3. Related Open Resources
4. Collaboration Suggestions
5. Custom Audit Rubrics
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..models.database import get_db
from ..models.user import User
from ..routers.auth import get_current_user
from ..services.document_ingestion import load_document
from ..services.insights_service import (
    compare_with_courseware,
    record_score, get_evolution, get_all_evolutions,
    find_related_resources,
    find_collaboration_opportunities,
    create_rubric, list_rubrics, get_rubric, delete_rubric, audit_with_rubric,
)
from ..services.audit_service import _detect_language

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/insights", tags=["Insights"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class CoursewareRequest(BaseModel):
    doc_id: str
    language: Optional[str] = "auto"

class ResourcesRequest(BaseModel):
    doc_id: str
    language: Optional[str] = "auto"

class CollabRequest(BaseModel):
    doc_id: str

class RubricCriterion(BaseModel):
    name: str
    weight: float = Field(ge=0, le=1)
    description: str = ""
    max_score: float = 10.0

class CreateRubricRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    department: str = ""
    criteria: List[RubricCriterion]

class RubricAuditRequest(BaseModel):
    doc_id: str
    rubric_id: str
    language: Optional[str] = "auto"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_doc_lang(doc_id: str, language: str = "auto"):
    try:
        doc = load_document(doc_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Document '{doc_id}' not found.")
    if language == "auto":
        language = _detect_language(doc["text"])
    return doc, language


# ══════════════════════════════════════════════════════════════════════════════
# Feature 1 — Open Courseware Comparison
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/courseware-comparison", summary="Compare document against MIT/Stanford/Coursera courses")
async def courseware_comparison(req: CoursewareRequest, _: User = Depends(get_current_user)):
    doc, lang = _load_doc_lang(req.doc_id, req.language)
    try:
        return compare_with_courseware(doc["text"], doc["filename"], lang)
    except Exception as e:
        logger.exception("Courseware comparison failed")
        raise HTTPException(500, str(e))


# ══════════════════════════════════════════════════════════════════════════════
# Feature 2 — Quality Evolution Timeline
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/evolution", summary="Get evolution summaries for all documents")
async def get_all_doc_evolutions(_: User = Depends(get_current_user)):
    return {"evolutions": get_all_evolutions()}


@router.get("/evolution/{doc_id}", summary="Get score evolution for a document")
async def get_doc_evolution(doc_id: str, _: User = Depends(get_current_user)):
    return get_evolution(doc_id)


# ══════════════════════════════════════════════════════════════════════════════
# Feature 3 — Related Open Resources
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/related-resources", summary="Find related open educational resources")
async def related_resources(req: ResourcesRequest, _: User = Depends(get_current_user)):
    doc, lang = _load_doc_lang(req.doc_id, req.language)
    try:
        return find_related_resources(doc["text"], doc["filename"], lang)
    except Exception as e:
        logger.exception("Related resources search failed")
        raise HTTPException(500, str(e))


# ══════════════════════════════════════════════════════════════════════════════
# Feature 4 — Collaboration Suggestions
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/collaboration", summary="Find collaboration opportunities with other teachers")
async def collaboration_suggestions(
    req: CollabRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        load_document(req.doc_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Document '{req.doc_id}' not found.")
    try:
        return find_collaboration_opportunities(req.doc_id, current_user.id)
    except Exception as e:
        logger.exception("Collaboration suggestions failed")
        raise HTTPException(500, str(e))


# ══════════════════════════════════════════════════════════════════════════════
# Feature 5 — Custom Audit Rubrics
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/rubrics", status_code=201, summary="Create a custom audit rubric")
async def create_new_rubric(
    req: CreateRubricRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        rubric = create_rubric(
            name=req.name,
            description=req.description,
            criteria=[c.model_dump() for c in req.criteria],
            created_by=current_user.id,
            department=req.department or current_user.department or "",
        )
        return rubric
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/rubrics", summary="List all available rubrics")
async def list_all_rubrics(
    department: Optional[str] = None,
    _: User = Depends(get_current_user),
):
    return {"rubrics": list_rubrics(department)}


@router.get("/rubrics/{rubric_id}", summary="Get a rubric by ID")
async def get_rubric_detail(rubric_id: str, _: User = Depends(get_current_user)):
    try:
        return get_rubric(rubric_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Rubric '{rubric_id}' not found.")


@router.delete("/rubrics/{rubric_id}", summary="Delete a rubric")
async def delete_rubric_endpoint(rubric_id: str, current_user: User = Depends(get_current_user)):
    try:
        rubric = get_rubric(rubric_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Rubric '{rubric_id}' not found.")
    if rubric.get("created_by") != current_user.id and not getattr(current_user, "is_admin", False):
        raise HTTPException(403, "Only the rubric creator or admin can delete it.")
    delete_rubric(rubric_id)
    return {"message": "Rubric deleted."}


@router.post("/rubrics/audit", summary="Run an audit using a custom rubric")
async def rubric_audit(req: RubricAuditRequest, _: User = Depends(get_current_user)):
    doc, lang = _load_doc_lang(req.doc_id, req.language)
    try:
        rubric = get_rubric(req.rubric_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Rubric '{req.rubric_id}' not found.")
    try:
        return audit_with_rubric(doc["text"], doc["filename"], rubric, lang)
    except Exception as e:
        logger.exception("Rubric audit failed")
        raise HTTPException(500, str(e))


# ══════════════════════════════════════════════════════════════════════════════
# Feature B — AI Course Outline Generator
# ══════════════════════════════════════════════════════════════════════════════

class CourseOutlineRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=300)
    target_level: str = Field(default="Bachelor 1st year")
    num_weeks: int = Field(default=12, ge=2, le=30)
    hours_per_week: float = Field(default=3.0, ge=1, le=10)
    language: Optional[str] = "fr"
    additional_instructions: Optional[str] = ""


@router.post("/generate-outline", summary="Generate a complete course syllabus from a topic")
async def generate_outline(req: CourseOutlineRequest, _: User = Depends(get_current_user)):
    from ..services.insights_service import generate_course_outline
    try:
        return generate_course_outline(
            topic=req.topic,
            target_level=req.target_level,
            num_weeks=req.num_weeks,
            hours_per_week=req.hours_per_week,
            language=req.language or "fr",
            additional_instructions=req.additional_instructions or "",
        )
    except Exception as e:
        logger.exception("Course outline generation failed")
        raise HTTPException(500, str(e))

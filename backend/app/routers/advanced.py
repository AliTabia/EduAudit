"""
Advanced Features Router
Covers Features 1,2,3,6,7,9,11,12,13,14,15 via single router.
Endpoints:
  POST /api/advanced/similarity/scan          — F1: corpus scan
  POST /api/advanced/similarity/compare       — F1: pairwise
  POST /api/advanced/generate/missing-content — F2
  POST /api/advanced/generate/module-audit    — F3
  POST /api/advanced/generate/exam            — F12
  POST /api/advanced/generate/comprehension   — F13
  POST /api/advanced/analyze/competencies     — F6
  POST /api/advanced/analyze/freshness        — F7
  POST /api/advanced/translate/recommendations— F14
  GET  /api/advanced/report/{audit_id}/pdf    — F9
  POST /api/advanced/chat                     — F11
  GET  /api/advanced/predict/{doc_id}         — F15
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import io

from ..routers.auth import get_current_user
from ..models.user import User
from ..services.document_ingestion import load_document
from ..services.similarity_service import compute_similarity, scan_corpus
from ..services.content_generator import (
    generate_missing_content, generate_exam, simulate_student_comprehension,
    detect_outdated_content, align_to_competencies, audit_module,
    generate_multilingual_recommendations,
)
from ..services.pdf_export import generate_audit_pdf
from ..services.rag_chat import chat_with_document
from ..services.predictive_scorer import predict_quality
from ..services.audit_service import get_audit_report

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/advanced", tags=["Advanced Features"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class SimilarityScanRequest(BaseModel):
    doc_id: str
    top_k: Optional[int] = 10

class SimilarityCompareRequest(BaseModel):
    doc_id_a: str
    doc_id_b: str

class MissingContentRequest(BaseModel):
    doc_id: str
    weaknesses: Optional[List[str]] = []
    bloom_level: Optional[str] = "Apply"
    language: Optional[str] = "auto"

class ModuleAuditRequest(BaseModel):
    doc_ids: List[str]
    module_name: str
    language: Optional[str] = "auto"

class ExamRequest(BaseModel):
    doc_id: str
    bloom_level: Optional[str] = "Apply"
    num_mcq: Optional[int] = 10
    num_open: Optional[int] = 3
    num_case: Optional[int] = 1
    language: Optional[str] = "auto"

class ComprehensionRequest(BaseModel):
    doc_id: str
    language: Optional[str] = "auto"

class CompetencyRequest(BaseModel):
    doc_id: str
    competencies: List[Dict[str, str]]
    language: Optional[str] = "auto"

class FreshnessRequest(BaseModel):
    doc_id: str
    language: Optional[str] = "auto"

class TranslateRequest(BaseModel):
    recommendations: List[str]
    source_language: Optional[str] = "fr"
    target_languages: Optional[List[str]] = ["ar", "en"]

class ChatRequest(BaseModel):
    doc_id: str
    question: str
    history: Optional[List[Dict[str, str]]] = []


# ── Helper: load & optionally detect language ─────────────────────────────────

def _load_doc_lang(doc_id: str, language: str = "auto"):
    try:
        doc = load_document(doc_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Document '{doc_id}' not found.")
    if language == "auto":
        from ..services.audit_service import _detect_language
        language = _detect_language(doc["text"])
    return doc, language


# ── F1: Similarity ────────────────────────────────────────────────────────────

@router.post("/similarity/scan", summary="F1: Scan corpus for similar documents")
async def similarity_scan(req: SimilarityScanRequest, _: User = Depends(get_current_user)):
    try:
        return scan_corpus(req.doc_id, top_k=req.top_k)
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        logger.exception("Similarity scan failed")
        raise HTTPException(500, str(e))

@router.post("/similarity/compare", summary="F1: Compare two documents")
async def similarity_compare(req: SimilarityCompareRequest, _: User = Depends(get_current_user)):
    try:
        return compute_similarity(req.doc_id_a, req.doc_id_b)
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


# ── F2: Missing Content Generator ────────────────────────────────────────────

@router.post("/generate/missing-content", summary="F2: Generate missing content suggestions")
async def gen_missing_content(req: MissingContentRequest, _: User = Depends(get_current_user)):
    doc, lang = _load_doc_lang(req.doc_id, req.language or "auto")
    try:
        return generate_missing_content(doc["text"], req.weaknesses or [], req.bloom_level or "Apply", lang)
    except Exception as e:
        logger.exception("Content generation failed")
        raise HTTPException(500, str(e))


# ── F3: Module Audit ──────────────────────────────────────────────────────────

@router.post("/generate/module-audit", summary="F3: Audit a full module (multiple docs)")
async def module_audit(req: ModuleAuditRequest, user: User = Depends(get_current_user)):
    if len(req.doc_ids) < 2:
        raise HTTPException(400, "At least 2 documents required for module audit.")
    try:
        from ..services.audit_service import _detect_language
        lang = req.language
        if lang == "auto":
            try:
                doc = load_document(req.doc_ids[0])
                lang = _detect_language(doc["text"])
            except Exception:
                lang = "fr"
        return audit_module(req.doc_ids, req.module_name, lang)
    except Exception as e:
        logger.exception("Module audit failed")
        raise HTTPException(500, str(e))


# ── F6: Competency Alignment ──────────────────────────────────────────────────

@router.post("/analyze/competencies", summary="F6: Competency alignment matrix")
async def competency_alignment(req: CompetencyRequest, _: User = Depends(get_current_user)):
    doc, lang = _load_doc_lang(req.doc_id, req.language or "auto")
    try:
        return align_to_competencies(doc["text"], doc["filename"], req.competencies, lang)
    except Exception as e:
        logger.exception("Competency alignment failed")
        raise HTTPException(500, str(e))


# ── F7: Freshness / Trend Detection ──────────────────────────────────────────

@router.post("/analyze/freshness", summary="F7: Detect outdated content")
async def analyze_freshness(req: FreshnessRequest, _: User = Depends(get_current_user)):
    doc, lang = _load_doc_lang(req.doc_id, req.language or "auto")
    try:
        return detect_outdated_content(doc["text"], doc["filename"], lang)
    except Exception as e:
        logger.exception("Freshness analysis failed")
        raise HTTPException(500, str(e))


# ── F9: PDF Export ────────────────────────────────────────────────────────────

@router.get("/report/{audit_id}/pdf", summary="F9: Download audit report as PDF")
async def export_pdf(audit_id: str, user: User = Depends(get_current_user)):
    try:
        report = get_audit_report(audit_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Audit '{audit_id}' not found.")

    if report.get("user_id") and report["user_id"] != user.id and not getattr(user, "is_admin", False):
        raise HTTPException(403, "Access denied.")

    try:
        pdf_bytes = generate_audit_pdf(report)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        logger.exception("PDF generation failed")
        raise HTTPException(500, str(e))

    filename = f"audit_{audit_id[:8]}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── F11: RAG Chat ─────────────────────────────────────────────────────────────

@router.post("/chat", summary="F11: Chat with a document using RAG")
async def rag_chat(req: ChatRequest, _: User = Depends(get_current_user)):
    if not req.question.strip():
        raise HTTPException(400, "Question cannot be empty.")
    try:
        return chat_with_document(req.doc_id, req.question, req.history)
    except Exception as e:
        logger.exception("RAG chat failed")
        raise HTTPException(500, str(e))


# ── F12: Exam Generator ───────────────────────────────────────────────────────

@router.post("/generate/exam", summary="F12: Auto-generate exam from document")
async def generate_exam_endpoint(req: ExamRequest, _: User = Depends(get_current_user)):
    doc, lang = _load_doc_lang(req.doc_id, req.language or "auto")
    try:
        return generate_exam(
            doc["text"], doc["filename"],
            bloom_level=req.bloom_level or "Apply",
            num_mcq=req.num_mcq or 10,
            num_open=req.num_open or 3,
            num_case=req.num_case or 1,
            language=lang,
        )
    except Exception as e:
        logger.exception("Exam generation failed")
        raise HTTPException(500, str(e))


# ── F13: Comprehension Simulation ────────────────────────────────────────────

@router.post("/generate/comprehension", summary="F13: Student comprehension simulation")
async def comprehension_simulation(req: ComprehensionRequest, _: User = Depends(get_current_user)):
    doc, lang = _load_doc_lang(req.doc_id, req.language or "auto")
    try:
        return simulate_student_comprehension(doc["text"], doc["filename"], lang)
    except Exception as e:
        logger.exception("Comprehension simulation failed")
        raise HTTPException(500, str(e))


# ── F14: Multilingual Recommendations ────────────────────────────────────────

@router.post("/translate/recommendations", summary="F14: Translate audit recommendations")
async def translate_recs(req: TranslateRequest, _: User = Depends(get_current_user)):
    if not req.recommendations:
        raise HTTPException(400, "No recommendations provided.")
    try:
        return generate_multilingual_recommendations(
            req.recommendations, req.source_language or "fr", req.target_languages
        )
    except Exception as e:
        logger.exception("Translation failed")
        raise HTTPException(500, str(e))


# ── F15: Predictive Score ─────────────────────────────────────────────────────

@router.get("/predict/{doc_id}", summary="F15: Instant quality prediction")
async def predict_score(doc_id: str, _: User = Depends(get_current_user)):
    try:
        doc = load_document(doc_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Document '{doc_id}' not found.")
    return predict_quality(doc["text"], doc["filename"])

"""
Audit Service — orchestrates the full audit pipeline:
  1. Load document
  2. Run LLM analyses in sequence
  3. Compute scores & grade
  4. Generate executive summary
  5. Persist audit report to disk
"""

import uuid
import json
import time
import logging
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional

from .document_ingestion import load_document
from .llm_engine import (
    analyze_pedagogical_coherence,
    analyze_writing_quality,
    generate_executive_summary,
)

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
AUDITS_DIR = DATA_DIR / "audits"
AUDITS_DIR.mkdir(parents=True, exist_ok=True)


# ─── Grade helper ─────────────────────────────────────────────────────────────

def _score_to_grade(score: float) -> str:
    if score >= 9.0:
        return "A+"
    elif score >= 8.0:
        return "A"
    elif score >= 7.0:
        return "B"
    elif score >= 6.0:
        return "C"
    elif score >= 5.0:
        return "D"
    else:
        return "F"


def _detect_language(text: str) -> str:
    """Simple heuristic language detection (fr/en)."""
    fr_markers = ["le ", "la ", "les ", "de ", "du ", "des ", "est ", "que ", "qui ", "une ", "un "]
    en_markers = ["the ", "is ", "are ", "and ", "for ", "with ", "this ", "that ", "have ", "from "]
    text_lower = text[:3000].lower()
    fr_count = sum(text_lower.count(m) for m in fr_markers)
    en_count = sum(text_lower.count(m) for m in en_markers)
    return "fr" if fr_count > en_count else "en"


# ─── Main audit runner ────────────────────────────────────────────────────────

def run_audit(
    doc_id: str,
    criteria: List[str],
    language: str = "auto",
    user_id: Optional[str] = None,
    user_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Execute a full audit on a document and return the structured report.

    Args:
        doc_id: ID of the previously ingested document
        criteria: list of criteria to apply (pedagogical_coherence, writing_quality)
        language: document language hint ('auto', 'fr', 'en')

    Returns:
        Full audit report dict (matches AuditReport schema)
    """
    audit_id = str(uuid.uuid4())
    t_start = time.time()

    logger.info(f"Starting audit {audit_id} for document {doc_id}")

    # 1. Load document
    doc = load_document(doc_id)
    text = doc["text"]

    if language == "auto":
        language = _detect_language(text)
    logger.info(f"Detected language: {language}")

    model_used = os.getenv("LLM_MODEL", "gpt-4o-mini")

    # 2. Run requested analyses
    peda_result: Optional[Dict[str, Any]] = None
    writing_result: Optional[Dict[str, Any]] = None

    if "pedagogical_coherence" in criteria:
        logger.info("Running pedagogical coherence analysis...")
        peda_result = analyze_pedagogical_coherence(text, language=language)

    if "writing_quality" in criteria:
        logger.info("Running writing quality analysis...")
        writing_result = analyze_writing_quality(text, language=language)

    # 3. Default fallback if a criterion was skipped
    if peda_result is None:
        peda_result = {
            "overall_score": 0.0,
            "bloom_analysis": {
                "detected_level": "Unknown",
                "detected_verbs": [],
                "objectives_found": [],
                "alignment_score": 0.0,
                "commentary": "Not analyzed",
            },
            "objectives_clarity": 0.0,
            "content_alignment": 0.0,
            "evaluation_alignment": 0.0,
            "strengths": [],
            "weaknesses": ["Pedagogical coherence was not included in this audit."],
            "recommendations": [],
        }

    if writing_result is None:
        writing_result = {
            "overall_score": 0.0,
            "clarity_score": 0.0,
            "structure_score": 0.0,
            "readability_score": 0.0,
            "spelling_grammar_score": 0.0,
            "strengths": [],
            "weaknesses": ["Writing quality was not included in this audit."],
            "recommendations": [],
        }

    # 4. Compute global score (weighted average)
    peda_score = float(peda_result.get("overall_score", 0.0))
    writing_score = float(writing_result.get("overall_score", 0.0))

    active_criteria_count = len([c for c in criteria if c in ["pedagogical_coherence", "writing_quality"]])
    if active_criteria_count == 2:
        global_score = round((peda_score * 0.6 + writing_score * 0.4), 2)
    elif "pedagogical_coherence" in criteria:
        global_score = round(peda_score, 2)
    else:
        global_score = round(writing_score, 2)

    grade = _score_to_grade(global_score)

    # 5. Top priority recommendations (merge from both)
    all_recs = (
        peda_result.get("recommendations", []) +
        writing_result.get("recommendations", [])
    )
    priority_recommendations = all_recs[:5]

    # 6. Executive summary
    logger.info("Generating executive summary...")
    executive_summary = generate_executive_summary(
        filename=doc["filename"],
        global_score=global_score,
        grade=grade,
        peda_score=peda_score,
        peda_weaknesses=peda_result.get("weaknesses", []),
        writing_score=writing_score,
        writing_weaknesses=writing_result.get("weaknesses", []),
        language=language,
    )

    processing_time = round(time.time() - t_start, 2)
    now = datetime.utcnow().isoformat()

    # 7. Assemble report — include user info
    report = {
        "audit_id": audit_id,
        "doc_id": doc_id,
        "user_id": user_id,
        "user_name": user_name,
        "document": {
            "doc_id": doc_id,
            "filename": doc["filename"],
            "format": doc["format"],
            "page_count": doc["page_count"],
            "word_count": doc["word_count"],
            "uploaded_at": doc["uploaded_at"],
            "file_size_kb": doc["file_size_kb"],
        },
        "status": "completed",
        "scores": {
            "global_score": global_score,
            "pedagogical_coherence": round(peda_score, 2),
            "writing_quality": round(writing_score, 2),
            "grade": grade,
        },
        "pedagogical_coherence": {
            "overall_score": peda_score,
            "bloom_analysis": peda_result.get("bloom_analysis", {}),
            "objectives_clarity": float(peda_result.get("objectives_clarity", 0.0)),
            "content_alignment": float(peda_result.get("content_alignment", 0.0)),
            "evaluation_alignment": float(peda_result.get("evaluation_alignment", 0.0)),
            "strengths": peda_result.get("strengths", []),
            "weaknesses": peda_result.get("weaknesses", []),
            "recommendations": peda_result.get("recommendations", []),
        },
        "writing_quality": {
            "overall_score": writing_score,
            "clarity_score": float(writing_result.get("clarity_score", 0.0)),
            "structure_score": float(writing_result.get("structure_score", 0.0)),
            "readability_score": float(writing_result.get("readability_score", 0.0)),
            "spelling_grammar_score": float(writing_result.get("spelling_grammar_score", 0.0)),
            "strengths": writing_result.get("strengths", []),
            "weaknesses": writing_result.get("weaknesses", []),
            "recommendations": writing_result.get("recommendations", []),
        },
        "executive_summary": executive_summary,
        "priority_recommendations": priority_recommendations,
        "processing_time_seconds": processing_time,
        "created_at": now,
        "llm_model_used": model_used,
    }

    # 8. Persist report
    audit_path = AUDITS_DIR / f"{audit_id}.json"
    audit_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info(f"Audit {audit_id} completed in {processing_time}s — saved to {audit_path}")

    # 9. Record score for evolution tracking
    try:
        from .insights_service import record_score
        record_score(doc_id, doc["filename"], global_score, grade, audit_id)
    except Exception as e:
        logger.warning(f"Failed to record evolution: {e}")

    return report


# ─── Report retrieval ─────────────────────────────────────────────────────────

def get_audit_report(audit_id: str) -> Dict[str, Any]:
    """Load a saved audit report by ID."""
    path = AUDITS_DIR / f"{audit_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Audit report '{audit_id}' not found.")
    return json.loads(path.read_text(encoding="utf-8"))


def list_audits(user_id: Optional[str] = None) -> list:
    """Return audits sorted by date descending, optionally filtered by user."""
    audits = []
    if AUDITS_DIR.exists():
        for f in sorted(AUDITS_DIR.glob("*.json"), reverse=True):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                # Filter by user if requested
                if user_id and data.get("user_id") and data["user_id"] != user_id:
                    continue
                audits.append({
                    "audit_id": data["audit_id"],
                    "doc_id": data["doc_id"],
                    "filename": data["document"]["filename"],
                    "global_score": data["scores"]["global_score"],
                    "grade": data["scores"]["grade"],
                    "status": data["status"],
                    "created_at": data["created_at"],
                    "processing_time_seconds": data["processing_time_seconds"],
                })
            except Exception:
                continue
    return audits

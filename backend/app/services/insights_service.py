"""
Insights Service — Powers 5 advanced features:
1. Open Courseware Comparison (MIT/Stanford benchmark)
2. Quality Evolution Timeline (score history per doc)
3. Related Open Resources (YouTube, OCW, papers)
4. Cross-ESPRIT Collaboration Suggestions
5. Custom Audit Rubrics
"""

import time
import json
import logging
import re
from typing import Dict, Any, List, Optional
from pathlib import Path
from datetime import datetime

from .llm_engine import _get_client, _get_model, _truncate_text, _call_llm_json, _is_ollama
from .document_ingestion import load_document, list_documents
from .similarity_service import _tfidf_similarity, _tokenize

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


# ══════════════════════════════════════════════════════════════════════════════
# Feature 1 — Open Courseware Comparison
# ══════════════════════════════════════════════════════════════════════════════

def compare_with_courseware(text: str, filename: str, language: str = "fr") -> Dict[str, Any]:
    """
    Compare document content against well-known open university courses.
    Uses LLM knowledge of MIT OCW, Stanford, Coursera, etc.
    """
    snippet = _truncate_text(text, 4000 if _is_ollama() else 8000)

    messages = [
        {"role": "system", "content": (
            "You are an expert in university curriculum design with deep knowledge of "
            "MIT OpenCourseWare, Stanford Online, Coursera, edX, and major international "
            "university programs. You compare course content against global standards. "
            "CRITICAL: Respond with ONLY valid JSON. Start with { and end with }."
        )},
        {"role": "user", "content": f"""Analyze this educational document and compare it against equivalent courses from top international universities.

Document: {filename}
Language: {language}

Document content:
---
{snippet}
---

Identify:
1. What subject/topic this document covers
2. Which top university courses cover the same topic (MIT OCW, Stanford, Coursera, etc.)
3. What percentage of the standard curriculum this document covers
4. What key topics are MISSING compared to international standards
5. What this document does BETTER than typical courses

Respond ONLY with this JSON:
{{
  "detected_subject": "<subject area>",
  "detected_topics": ["<topic1>", "<topic2>", "<topic3>"],
  "benchmark_courses": [
    {{
      "university": "<MIT / Stanford / Coursera / etc.>",
      "course_name": "<official course name>",
      "course_code": "<code if known>",
      "url_hint": "<probable URL pattern>",
      "coverage_match_percent": <int 0-100>,
      "matching_topics": ["<topic covered in both>"],
      "missing_from_document": ["<topic in their course but not in this doc>"]
    }}
  ],
  "overall_coverage_score": <float 0-10>,
  "global_ranking_estimate": "<top_tier|competitive|average|below_average>",
  "strengths_vs_international": ["<what this doc does well>"],
  "gaps_vs_international": ["<critical missing topic>"],
  "improvement_suggestions": ["<actionable suggestion to reach international level>"],
  "recommended_resources": [
    {{"title": "<resource>", "source": "<platform>", "url_hint": "<url>", "relevance": "<why>"}}
  ]
}}"""}
    ]

    t0 = time.time()
    result = _call_llm_json(messages, max_tokens=2500, temperature=0.3)
    result["processing_time"] = round(time.time() - t0, 2)
    result["filename"] = filename
    return result


# ══════════════════════════════════════════════════════════════════════════════
# Feature 2 — Quality Evolution Timeline
# ══════════════════════════════════════════════════════════════════════════════

EVOLUTION_DIR = DATA_DIR / "evolution"
EVOLUTION_DIR.mkdir(parents=True, exist_ok=True)


def record_score(doc_id: str, filename: str, score: float, grade: str, audit_id: str):
    """Record a score data point for evolution tracking."""
    history_path = EVOLUTION_DIR / f"{doc_id}.json"
    if history_path.exists():
        history = json.loads(history_path.read_text(encoding="utf-8"))
    else:
        history = {"doc_id": doc_id, "filename": filename, "data_points": []}

    history["filename"] = filename
    history["data_points"].append({
        "audit_id": audit_id,
        "score": score,
        "grade": grade,
        "timestamp": datetime.utcnow().isoformat(),
    })

    history_path.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8")


def get_evolution(doc_id: str) -> Dict[str, Any]:
    """Get score evolution for a document."""
    history_path = EVOLUTION_DIR / f"{doc_id}.json"
    if not history_path.exists():
        return {"doc_id": doc_id, "data_points": [], "trend": "none", "improvement": 0}

    history = json.loads(history_path.read_text(encoding="utf-8"))
    points = history.get("data_points", [])

    if len(points) < 2:
        trend = "insufficient_data"
        improvement = 0
    else:
        first_score = points[0]["score"]
        last_score = points[-1]["score"]
        improvement = round(last_score - first_score, 2)
        if improvement > 0.5:
            trend = "improving"
        elif improvement < -0.5:
            trend = "declining"
        else:
            trend = "stable"

    return {
        "doc_id": doc_id,
        "filename": history.get("filename", ""),
        "data_points": points,
        "total_audits": len(points),
        "trend": trend,
        "improvement": improvement,
        "first_score": points[0]["score"] if points else None,
        "latest_score": points[-1]["score"] if points else None,
        "best_score": max(p["score"] for p in points) if points else None,
    }


def get_all_evolutions(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get evolution summaries for all documents."""
    results = []
    if EVOLUTION_DIR.exists():
        for f in EVOLUTION_DIR.glob("*.json"):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                points = data.get("data_points", [])
                if not points:
                    continue
                results.append({
                    "doc_id": data["doc_id"],
                    "filename": data.get("filename", ""),
                    "total_audits": len(points),
                    "first_score": points[0]["score"],
                    "latest_score": points[-1]["score"],
                    "improvement": round(points[-1]["score"] - points[0]["score"], 2),
                    "trend": "improving" if points[-1]["score"] > points[0]["score"] + 0.5 else
                             "declining" if points[-1]["score"] < points[0]["score"] - 0.5 else "stable",
                })
            except Exception:
                continue
    results.sort(key=lambda x: x.get("improvement", 0), reverse=True)
    return results


# ══════════════════════════════════════════════════════════════════════════════
# Feature 3 — Related Open Resources
# ══════════════════════════════════════════════════════════════════════════════

def find_related_resources(text: str, filename: str, language: str = "fr") -> Dict[str, Any]:
    """
    Extract keywords from document and find related open educational resources:
    YouTube lectures, MIT OCW, Khan Academy, arXiv papers.
    """
    snippet = _truncate_text(text, 3000 if _is_ollama() else 6000)

    messages = [
        {"role": "system", "content": (
            "You are an expert librarian and educational resource curator. "
            "You know all major open educational platforms: YouTube EDU, MIT OCW, "
            "Khan Academy, Coursera, edX, arXiv, Google Scholar, GitHub. "
            "CRITICAL: Respond with ONLY valid JSON. Start with { and end with }."
        )},
        {"role": "user", "content": f"""Based on this educational document, suggest the most relevant open resources for both teachers and students.

Document: {filename} | Language: {language}

Content:
---
{snippet}
---

Find resources that:
- Cover the same topics (for reference/comparison)
- Complement weak areas in the document
- Provide visual/video explanations of key concepts
- Offer practice exercises or labs

Respond ONLY with this JSON:
{{
  "document_keywords": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"],
  "detected_field": "<academic field>",
  "resources": [
    {{
      "title": "<resource title>",
      "platform": "<YouTube|MIT OCW|Khan Academy|Coursera|edX|arXiv|GitHub|Other>",
      "type": "<video|course|paper|tutorial|lab|textbook>",
      "url_hint": "<probable URL or search query>",
      "relevance_score": <float 0-10>,
      "covers_topics": ["<topic1>", "<topic2>"],
      "why_useful": "<1-sentence explanation>"
    }}
  ],
  "youtube_search_queries": ["<search query 1>", "<search query 2>", "<search query 3>"],
  "arxiv_search_queries": ["<search query for arXiv>"],
  "complementary_topics": ["<topic not in document but important for the field>"]
}}"""}
    ]

    t0 = time.time()
    result = _call_llm_json(messages, max_tokens=2000, temperature=0.4)
    result["processing_time"] = round(time.time() - t0, 2)
    result["filename"] = filename
    return result


# ══════════════════════════════════════════════════════════════════════════════
# Feature 4 — Cross-ESPRIT Collaboration Suggestions
# ══════════════════════════════════════════════════════════════════════════════

def find_collaboration_opportunities(
    doc_id: str,
    user_id: str,
    db_session=None,
) -> Dict[str, Any]:
    """
    Find other ESPRIT teachers whose documents overlap with this one.
    Suggests collaboration to reduce redundancy and improve coherence.
    """
    target = load_document(doc_id)
    all_docs = list_documents()

    # Load audit metadata to find user info
    from .audit_service import AUDITS_DIR
    audit_user_map: Dict[str, Dict] = {}
    if AUDITS_DIR.exists():
        for f in AUDITS_DIR.glob("*.json"):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                d_id = data.get("doc_id")
                u_id = data.get("user_id")
                u_name = data.get("user_name")
                if d_id and u_id and u_id != user_id:
                    audit_user_map[d_id] = {"user_id": u_id, "user_name": u_name or "Unknown"}
            except Exception:
                continue

    # Find similar docs from other users
    suggestions = []
    for meta in all_docs:
        if meta["doc_id"] == doc_id:
            continue
        if meta["doc_id"] not in audit_user_map:
            continue

        try:
            other = load_document(meta["doc_id"])
            score = _tfidf_similarity(target["text"], other["text"])
            if score >= 0.20:  # meaningful overlap threshold
                teacher_info = audit_user_map[meta["doc_id"]]
                suggestions.append({
                    "doc_id": meta["doc_id"],
                    "filename": meta["filename"],
                    "teacher_name": teacher_info["user_name"],
                    "teacher_id": teacher_info["user_id"],
                    "similarity_score": round(score, 4),
                    "overlap_percent": round(score * 100, 1),
                    "collaboration_type": (
                        "merge_content" if score >= 0.7 else
                        "align_modules" if score >= 0.4 else
                        "cross_reference"
                    ),
                    "suggestion": (
                        f"High overlap ({round(score*100)}%) — consider merging shared content into a joint module."
                        if score >= 0.7 else
                        f"Moderate overlap ({round(score*100)}%) — coordinate to ensure progressive Bloom levels."
                        if score >= 0.4 else
                        f"Some overlap ({round(score*100)}%) — cross-reference each other's material for students."
                    ),
                })
        except Exception:
            continue

    suggestions.sort(key=lambda x: x["similarity_score"], reverse=True)

    return {
        "doc_id": doc_id,
        "filename": target["filename"],
        "total_suggestions": len(suggestions),
        "suggestions": suggestions[:10],
        "collaboration_potential": (
            "high" if any(s["similarity_score"] >= 0.5 for s in suggestions) else
            "medium" if suggestions else "low"
        ),
    }


# ══════════════════════════════════════════════════════════════════════════════
# Feature 5 — Custom Audit Rubrics
# ══════════════════════════════════════════════════════════════════════════════

RUBRICS_DIR = DATA_DIR / "rubrics"
RUBRICS_DIR.mkdir(parents=True, exist_ok=True)


def create_rubric(
    name: str,
    description: str,
    criteria: List[Dict[str, Any]],
    created_by: str,
    department: str = "",
) -> Dict[str, Any]:
    """
    Create a custom audit rubric.
    criteria: [{"name": "...", "weight": 0.3, "description": "...", "max_score": 10}]
    """
    import uuid
    rubric_id = str(uuid.uuid4())

    # Validate weights sum to ~1.0
    total_weight = sum(c.get("weight", 0) for c in criteria)
    if abs(total_weight - 1.0) > 0.05:
        raise ValueError(f"Criteria weights must sum to 1.0 (got {total_weight:.2f})")

    rubric = {
        "rubric_id": rubric_id,
        "name": name,
        "description": description,
        "department": department,
        "created_by": created_by,
        "created_at": datetime.utcnow().isoformat(),
        "criteria": criteria,
        "is_active": True,
    }

    path = RUBRICS_DIR / f"{rubric_id}.json"
    path.write_text(json.dumps(rubric, ensure_ascii=False, indent=2), encoding="utf-8")
    return rubric


def list_rubrics(department: Optional[str] = None) -> List[Dict[str, Any]]:
    """List all rubrics, optionally filtered by department."""
    rubrics = []
    if RUBRICS_DIR.exists():
        for f in RUBRICS_DIR.glob("*.json"):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                if department and data.get("department") != department:
                    continue
                rubrics.append(data)
            except Exception:
                continue
    rubrics.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return rubrics


def get_rubric(rubric_id: str) -> Dict[str, Any]:
    """Get a rubric by ID."""
    path = RUBRICS_DIR / f"{rubric_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Rubric '{rubric_id}' not found.")
    return json.loads(path.read_text(encoding="utf-8"))


def delete_rubric(rubric_id: str) -> bool:
    path = RUBRICS_DIR / f"{rubric_id}.json"
    if path.exists():
        path.unlink()
        return True
    return False


def audit_with_rubric(
    text: str,
    filename: str,
    rubric: Dict[str, Any],
    language: str = "fr",
) -> Dict[str, Any]:
    """
    Run an audit using a custom rubric instead of the default criteria.
    Each rubric criterion is scored individually by the LLM.
    """
    snippet = _truncate_text(text, 4000 if _is_ollama() else 8000)

    criteria_desc = "\n".join(
        f"- **{c['name']}** (weight: {c['weight']}, max: {c.get('max_score',10)}): {c.get('description','')}"
        for c in rubric["criteria"]
    )

    messages = [
        {"role": "system", "content": (
            "You are an educational quality assessor. You evaluate documents against "
            "a custom rubric provided by the institution. Score each criterion precisely. "
            "CRITICAL: Respond with ONLY valid JSON. Start with { and end with }."
        )},
        {"role": "user", "content": f"""Evaluate this educational document against the following custom rubric.

Rubric: "{rubric['name']}"
Description: {rubric.get('description', '')}

Criteria to evaluate:
{criteria_desc}

Document: {filename} | Language: {language}
---
{snippet}
---

Score each criterion out of its max_score. Provide justification.

Respond ONLY with this JSON:
{{
  "rubric_name": "{rubric['name']}",
  "overall_score": <weighted average float 0-10>,
  "grade": "<A+|A|B|C|D|F>",
  "criteria_scores": [
    {{
      "criterion": "<name>",
      "score": <float>,
      "max_score": <float>,
      "weight": <float>,
      "justification": "<why this score>",
      "suggestions": ["<improvement suggestion>"]
    }}
  ],
  "overall_strengths": ["<strength>"],
  "overall_weaknesses": ["<weakness>"],
  "priority_actions": ["<action>"]
}}"""}
    ]

    t0 = time.time()
    result = _call_llm_json(messages, max_tokens=2000, temperature=0.2)
    result["rubric_id"] = rubric["rubric_id"]
    result["processing_time"] = round(time.time() - t0, 2)
    return result


# ══════════════════════════════════════════════════════════════════════════════
# Feature B — AI Course Outline Generator
# ══════════════════════════════════════════════════════════════════════════════

def generate_course_outline(
    topic: str,
    target_level: str = "Bachelor 1st year",
    num_weeks: int = 12,
    hours_per_week: float = 3.0,
    language: str = "fr",
    additional_instructions: str = "",
) -> Dict[str, Any]:
    """
    Generate a complete structured syllabus from scratch.
    Returns: weekly objectives, activities, Bloom progression,
    reading list, assessment plan.
    """
    extra = f"\nAdditional instructions: {additional_instructions}" if additional_instructions else ""

    messages = [
        {"role": "system", "content": (
            "You are a world-class university curriculum designer with expertise in "
            "instructional design, Bloom's Taxonomy, and competency-based education. "
            "You create detailed, actionable course outlines for higher education. "
            "CRITICAL: Respond with ONLY valid JSON. Start with { and end with }."
        )},
        {"role": "user", "content": f"""Design a complete university course outline with these parameters:

Topic: {topic}
Target Level: {target_level}
Duration: {num_weeks} weeks
Hours per week: {hours_per_week}h
Language: {language}
{extra}

The outline must include:
1. Course title and description
2. Global learning objectives (3-5, using Bloom's action verbs)
3. Prerequisites
4. Week-by-week breakdown with: topic, specific objectives, Bloom level, activities, deliverables
5. Bloom's Taxonomy progression (should escalate from Remember/Understand early to Analyze/Create later)
6. Assessment plan (weights, types, timing)
7. Recommended reading list and resources (textbooks, online, tools)
8. Teaching methodology notes

Respond ONLY with this JSON:
{{
  "course_title": "<title>",
  "course_description": "<2-3 sentence description>",
  "target_level": "{target_level}",
  "duration_weeks": {num_weeks},
  "hours_per_week": {hours_per_week},
  "total_hours": {num_weeks * hours_per_week},
  "prerequisites": ["<prereq 1>", "<prereq 2>"],
  "global_objectives": [
    {{"objective": "<text>", "bloom_level": "<level>", "verb": "<action verb>"}}
  ],
  "weekly_plan": [
    {{
      "week": 1,
      "title": "<week title>",
      "bloom_level": "<Remember|Understand|Apply|Analyze|Evaluate|Create>",
      "objectives": ["<specific objective>"],
      "topics": ["<topic 1>", "<topic 2>"],
      "activities": [
        {{"type": "<lecture|lab|workshop|discussion|project|quiz>", "description": "<description>", "duration_minutes": <int>}}
      ],
      "deliverables": ["<what students submit this week>"],
      "resources": ["<specific resource for this week>"]
    }}
  ],
  "assessment_plan": [
    {{
      "type": "<exam|project|quiz|presentation|report|participation>",
      "title": "<assessment title>",
      "weight_percent": <int>,
      "week_due": <int>,
      "bloom_level": "<level>",
      "description": "<what is evaluated>"
    }}
  ],
  "reading_list": [
    {{"title": "<book/resource>", "author": "<author>", "type": "<textbook|article|online|video>", "required": <true|false>, "url_hint": "<optional url>"}}
  ],
  "methodology_notes": ["<teaching approach note>"],
  "bloom_progression_summary": "<1-2 sentence explanation of how Bloom levels escalate across weeks>"
}}"""}
    ]

    t0 = time.time()
    result = _call_llm_json(messages, max_tokens=3500, temperature=0.5)
    result["processing_time"] = round(time.time() - t0, 2)
    result["generated_language"] = language
    return result

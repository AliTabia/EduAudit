"""
Feature 2 â€” Auto-Generate Missing Content
Feature 12 â€” Automatic Exam Generator
Feature 13 â€” Student Comprehension Simulation
All use the LLM engine. Separated here to keep llm_engine.py focused on audit.
"""

import logging
import json
import time
from typing import Dict, Any, List, Optional

from .llm_engine import _get_client, _get_model, _truncate_text, _parse_json_response, _is_ollama, _call_llm_json

logger = logging.getLogger(__name__)


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# Feature 2 â€” Missing Content Generator
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

def generate_missing_content(
    text: str,
    weaknesses: List[str],
    bloom_level: str = "Apply",
    language: str = "fr",
) -> Dict[str, Any]:
    """
    Given audit weaknesses, generate suggested content to fill the gaps:
    - Learning objectives
    - Summary section
    - Practice exercises
    - A study question
    """
    client = _get_client()
    model  = _get_model()
    snippet = _truncate_text(text, 3000 if _is_ollama() else 6000)

    weak_str = "\n".join(f"- {w}" for w in weaknesses[:5]) if weaknesses else "- No explicit weaknesses listed"

    prompt = f"""You are an expert instructional designer. A teacher's document has the following weaknesses:
{weak_str}

The target Bloom's Taxonomy level is: {bloom_level}
Document language: {language}

Based on the document excerpt below, generate concrete content to fix these weaknesses.

Document excerpt:
---
{snippet}
---

Respond ONLY with this JSON structure:
{{
  "suggested_objectives": [
    "<measurable learning objective using Bloom verbs>",
    "<measurable learning objective 2>",
    "<measurable learning objective 3>"
  ],
  "suggested_summary": "<A 3-5 sentence summary section the teacher can add at the end>",
  "suggested_exercises": [
    {{"type": "practice", "question": "<exercise question>", "hint": "<optional hint>"}},
    {{"type": "reflection", "question": "<reflection question>", "hint": ""}},
    {{"type": "application", "question": "<real-world application task>", "hint": "<hint>"}}
  ],
  "suggested_introduction": "<An improved 2-3 sentence introduction that clearly states learning goals>",
  "content_gaps": ["<gap 1>", "<gap 2>"],
  "improvement_priority": "<high|medium|low>"
}}"""

    t0 = time.time()
    create_kwargs = dict(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=1800,
    )
    if not _is_ollama() and "gpt" in model:
        create_kwargs["response_format"] = {"type": "json_object"}

    result   = _call_llm_json(create_kwargs["messages"], max_tokens=create_kwargs.get("max_tokens", 2000), temperature=create_kwargs.get("temperature", 0.3))
    result["processing_time"] = round(time.time() - t0, 2)
    return result


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# Feature 12 â€” Exam Generator
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

def generate_exam(
    text: str,
    filename: str,
    bloom_level: str = "Apply",
    num_mcq: int = 10,
    num_open: int = 3,
    num_case: int = 1,
    language: str = "fr",
) -> Dict[str, Any]:
    """Generate a full exam from document content."""
    client = _get_client()
    model  = _get_model()
    snippet = _truncate_text(text, 5000 if _is_ollama() else 10000)

    prompt = f"""You are an expert exam writer for a university course.
Document: {filename}
Bloom's Level: {bloom_level}
Language: {language}

Generate a complete exam with:
- {num_mcq} Multiple Choice Questions (MCQ) â€” each with 4 options and the correct answer
- {num_open} Open-ended questions
- {num_case} Case study / scenario question

Document content:
---
{snippet}
---

Respond ONLY with this JSON:
{{
  "exam_title": "<title>",
  "duration_minutes": <int>,
  "total_points": <int>,
  "instructions": "<exam instructions in {language}>",
  "mcq": [
    {{
      "id": 1,
      "question": "<question>",
      "options": {{"A": "<opt>", "B": "<opt>", "C": "<opt>", "D": "<opt>"}},
      "correct_answer": "A",
      "points": 2,
      "bloom_level": "<level>"
    }}
  ],
  "open_questions": [
    {{"id": 1, "question": "<question>", "expected_length": "150-200 words", "points": 10, "marking_criteria": "<criteria>"}}
  ],
  "case_study": {{
    "scenario": "<scenario text>",
    "questions": ["<q1>", "<q2>"],
    "points": 20
  }}
}}"""

    t0 = time.time()
    create_kwargs = dict(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
        max_tokens=3000,
    )
    if not _is_ollama() and "gpt" in model:
        create_kwargs["response_format"] = {"type": "json_object"}

    result   = _call_llm_json(create_kwargs["messages"], max_tokens=create_kwargs.get("max_tokens", 2000), temperature=create_kwargs.get("temperature", 0.3))
    result["generated_from"] = filename
    result["processing_time"] = round(time.time() - t0, 2)
    return result


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# Feature 13 â€” Student Comprehension Simulation
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

def simulate_student_comprehension(
    text: str,
    filename: str,
    language: str = "fr",
) -> Dict[str, Any]:
    """
    Simulate a student reading the document and measure comprehension.
    The LLM tries to answer 5 auto-generated questions about the document,
    and the score reflects how clearly the content was explained.
    """
    client = _get_client()
    model  = _get_model()
    snippet = _truncate_text(text, 4000 if _is_ollama() else 8000)

    prompt = f"""You are simulating a first-year university student reading the following educational document.
Document: {filename} | Language: {language}

Your task:
1. Generate 5 comprehension questions a student would naturally ask after reading this document
2. Answer each question based ONLY on what is explicitly in the document
3. Score how well the document allows you to answer each question (0-10)
4. Overall comprehension score = average of the 5 question scores
5. Identify which parts were clear vs confusing

Document:
---
{snippet}
---

Respond ONLY with this JSON:
{{
  "overall_comprehension_score": <float 0-10>,
  "student_persona": "<brief description of simulated student profile>",
  "questions_and_answers": [
    {{
      "question": "<question a student would ask>",
      "answer": "<answer based solely on document content, or 'Cannot be determined from document'>",
      "clarity_score": <float 0-10>,
      "was_answerable": <true|false>,
      "difficulty": "<easy|medium|hard>"
    }}
  ],
  "clear_sections": ["<section or concept that was well explained>"],
  "confusing_sections": ["<section or concept that was poorly explained>"],
  "student_feedback": "<2-3 sentence feedback as if written by the student>",
  "readability_verdict": "<beginner-friendly|intermediate|advanced|too-complex>"
}}"""

    t0 = time.time()
    create_kwargs = dict(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=2000,
    )
    if not _is_ollama() and "gpt" in model:
        create_kwargs["response_format"] = {"type": "json_object"}

    result   = _call_llm_json(create_kwargs["messages"], max_tokens=create_kwargs.get("max_tokens", 2000), temperature=create_kwargs.get("temperature", 0.3))
    result["processing_time"] = round(time.time() - t0, 2)
    return result


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# Feature 7 â€” AI Trend Detector / Freshness Scorer
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

TECH_OBSOLESCENCE_MAP = {
    # Programming / CS
    "flash": ("Adobe Flash discontinued 2020", "HTML5/WebGL"),
    "ie": ("Internet Explorer discontinued 2022", "modern browsers"),
    "python 2": ("Python 2 EOL 2020", "Python 3"),
    "java 8": ("Java 8 is aging (2014)", "Java 21 LTS"),
    "hadoop": ("Hadoop largely superseded", "Apache Spark / cloud-native"),
    "mapreduce": ("MapReduce paradigm outdated", "Spark / Flink"),
    "jquery": ("jQuery considered legacy", "vanilla JS / React / Vue"),
    "mysql 5.5": ("MySQL 5.5 EOL 2018", "MySQL 8 / PostgreSQL"),
    "svn": ("SVN largely replaced", "Git"),
    "ftp": ("FTP insecure, largely deprecated", "SFTP / HTTPS"),
    "md5": ("MD5 cryptographically broken", "SHA-256 / bcrypt"),
    "des": ("DES cryptographically broken", "AES-256"),
    "ipv4 only": ("IPv4 exhaustion ongoing", "IPv6 adoption"),
    # AI / Data
    "svm": ("SVMs superseded for many tasks", "neural networks / LLMs"),
    "naive bayes": ("NaÃ¯ve Bayes outdated for NLP", "transformers / BERT"),
    "word2vec": ("Word2Vec largely replaced", "sentence-transformers / LLMs"),
    "cnn for nlp": ("CNNs for NLP largely replaced", "transformer models"),
}


def detect_outdated_content(text: str, filename: str, language: str = "fr") -> Dict[str, Any]:
    """
    Rule-based + LLM hybrid scan for outdated technologies and stale content.
    """
    text_lower = text.lower()

    # Rule-based pass
    rule_flags = []
    for keyword, (reason, modern) in TECH_OBSOLESCENCE_MAP.items():
        if keyword in text_lower:
            idx = text_lower.find(keyword)
            excerpt = text[max(0, idx-60):idx+80].strip()
            rule_flags.append({
                "term": keyword,
                "reason": reason,
                "modern_alternative": modern,
                "excerpt": excerpt,
                "severity": "high" if any(k in keyword for k in ["flash","md5","des","ie "]) else "medium",
            })

    # LLM pass for deeper analysis
    client = _get_client()
    model  = _get_model()
    snippet = _truncate_text(text, 4000 if _is_ollama() else 8000)

    prompt = f"""You are an expert in technology trends and educational content currency.
Analyze this {language}-language educational document for outdated content.
Document: {filename}

Look for:
- Outdated technologies, frameworks, tools, or standards
- References to deprecated or superseded concepts
- Missing coverage of important recent developments (last 2-3 years)
- Stale statistics or data points

---
{snippet}
---

Respond ONLY with this JSON:
{{
  "freshness_score": <float 0-10, where 10 = fully current>,
  "overall_verdict": "<cutting-edge|up-to-date|slightly-dated|outdated|critically-outdated>",
  "outdated_items": [
    {{
      "item": "<technology or concept>",
      "issue": "<why it's outdated>",
      "suggested_replacement": "<modern alternative>",
      "severity": "<high|medium|low>",
      "excerpt": "<short quote from document>"
    }}
  ],
  "missing_topics": ["<important recent topic not covered>"],
  "currency_recommendations": ["<actionable recommendation>"],
  "estimated_content_year": "<e.g. 2019-2021>"
}}"""

    t0 = time.time()
    create_kwargs = dict(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000,
    )
    if not _is_ollama() and "gpt" in model:
        create_kwargs["response_format"] = {"type": "json_object"}

    result   = _call_llm_json(create_kwargs["messages"], max_tokens=create_kwargs.get("max_tokens", 2000), temperature=create_kwargs.get("temperature", 0.3))

    # Merge rule-based flags into LLM result
    existing_items = [i.get("item", "").lower() for i in result.get("outdated_items", [])]
    for flag in rule_flags:
        if flag["term"] not in existing_items:
            result.setdefault("outdated_items", []).append({
                "item": flag["term"],
                "issue": flag["reason"],
                "suggested_replacement": flag["modern_alternative"],
                "severity": flag["severity"],
                "excerpt": flag["excerpt"],
            })

    result["processing_time"] = round(time.time() - t0, 2)
    return result


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# Feature 14 â€” Multilingual Audit Recommendations
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

def generate_multilingual_recommendations(
    recommendations: List[str],
    source_language: str = "fr",
    target_languages: List[str] = None,
) -> Dict[str, Any]:
    """Translate audit recommendations into multiple languages."""
    if not target_languages:
        target_languages = ["ar", "en"] if source_language == "fr" else ["fr", "ar"]

    client = _get_client()
    model  = _get_model()

    recs_str = "\n".join(f"{i+1}. {r}" for i, r in enumerate(recommendations[:10]))
    targets  = ", ".join(target_languages)

    prompt = f"""Translate these educational audit recommendations from {source_language} into: {targets}.
Preserve the professional educational tone.

Recommendations:
{recs_str}

Respond ONLY with this JSON:
{{
  "source_language": "{source_language}",
  "translations": {{
    "<lang_code>": [
      "<translated recommendation 1>",
      "<translated recommendation 2>"
    ]
  }}
}}"""

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1500,
    )
    return _parse_json_response(response.choices[0].message.content)


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# Feature 3 â€” Multi-Document Module Audit
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

def audit_module(
    doc_ids: List[str],
    module_name: str,
    language: str = "fr",
) -> Dict[str, Any]:
    """
    Audit a set of documents as a coherent teaching module.
    Checks: progression, redundancy, coverage gaps, Bloom level escalation.
    """
    from .document_ingestion import load_document as _load

    docs_info = []
    for doc_id in doc_ids[:10]:
        try:
            d = _load(doc_id)
            docs_info.append({
                "doc_id": doc_id,
                "filename": d["filename"],
                "text_snippet": _truncate_text(d["text"], 1500),
                "word_count": d["word_count"],
            })
        except Exception:
            pass

    if not docs_info:
        raise ValueError("No valid documents found for module audit.")

    client = _get_client()
    model  = _get_model()

    docs_str = "\n\n".join(
        f"--- Document {i+1}: {d['filename']} ({d['word_count']} words) ---\n{d['text_snippet']}"
        for i, d in enumerate(docs_info)
    )

    prompt = f"""You are an expert in curriculum design evaluating a complete teaching module.
Module: "{module_name}" | Language: {language} | Documents: {len(docs_info)}

Analyze these {len(docs_info)} documents as a COHESIVE MODULE. Evaluate:
1. Pedagogical progression (Does complexity increase logically across documents?)
2. Bloom's Taxonomy escalation (Do cognitive levels progress from lower to higher-order?)
3. Redundancy between documents (Is content repeated unnecessarily?)
4. Coverage gaps (What important topics are missing from the module?)
5. Coherence (Do documents reference and build on each other?)

Documents:
{docs_str}

Respond ONLY with this JSON:
{{
  "module_score": <float 0-10>,
  "module_grade": "<A+|A|B|C|D|F>",
  "progression_score": <float 0-10>,
  "bloom_escalation_score": <float 0-10>,
  "coherence_score": <float 0-10>,
  "redundancy_score": <float 0-10, where 10 = no redundancy>,
  "document_order_assessment": [
    {{"doc_id": "<id>", "filename": "<name>", "suggested_position": <int>, "bloom_level": "<level>", "comment": "<comment>"}}
  ],
  "redundant_topics": ["<topic repeated across documents>"],
  "coverage_gaps": ["<important missing topic>"],
  "module_strengths": ["<strength>"],
  "module_weaknesses": ["<weakness>"],
  "module_recommendations": ["<actionable recommendation>"],
  "executive_summary": "<3-4 sentence module-level summary>"
}}"""

    t0 = time.time()
    create_kwargs = dict(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2500,
    )
    if not _is_ollama() and "gpt" in model:
        create_kwargs["response_format"] = {"type": "json_object"}

    result   = _call_llm_json(create_kwargs["messages"], max_tokens=create_kwargs.get("max_tokens", 2000), temperature=create_kwargs.get("temperature", 0.3))
    result["module_name"]    = module_name
    result["doc_ids"]        = doc_ids
    result["doc_count"]      = len(docs_info)
    result["processing_time"] = round(time.time() - t0, 2)
    return result


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# Feature 6 â€” Competency Alignment Matrix
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

def align_to_competencies(
    text: str,
    filename: str,
    competencies: List[Dict[str, str]],
    language: str = "fr",
) -> Dict[str, Any]:
    """
    Map document content against a competency framework.
    Returns a coverage matrix with Bloom level per competency.
    """
    client = _get_client()
    model  = _get_model()
    snippet = _truncate_text(text, 4000 if _is_ollama() else 8000)

    comp_str = "\n".join(
        f"- [{c.get('code','C'+str(i+1))}] {c.get('name','')} : {c.get('description','')}"
        for i, c in enumerate(competencies[:20])
    )

    prompt = f"""You are an expert in competency-based education.
Analyze this document against the given competency framework.
Document: {filename} | Language: {language}

Competency Framework:
{comp_str}

Document excerpt:
---
{snippet}
---

For each competency, determine:
- Is it covered? (full/partial/not_covered)
- At what Bloom level? (Remember/Understand/Apply/Analyze/Evaluate/Create)
- Evidence from the document

Respond ONLY with this JSON:
{{
  "overall_coverage_percent": <float 0-100>,
  "fully_covered": <int>,
  "partially_covered": <int>,
  "not_covered": <int>,
  "competency_matrix": [
    {{
      "code": "<competency code>",
      "name": "<competency name>",
      "coverage": "<full|partial|not_covered>",
      "bloom_level": "<level>",
      "evidence": "<quote or description from document>",
      "coverage_score": <float 0-10>
    }}
  ],
  "missing_competencies": ["<competency code>"],
  "recommendations": ["<recommendation>"]
}}"""

    t0 = time.time()
    create_kwargs = dict(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=2500,
    )
    if not _is_ollama() and "gpt" in model:
        create_kwargs["response_format"] = {"type": "json_object"}

    result   = _call_llm_json(create_kwargs["messages"], max_tokens=create_kwargs.get("max_tokens", 2000), temperature=create_kwargs.get("temperature", 0.3))
    result["processing_time"] = round(time.time() - t0, 2)
    return result



"""
LLM Audit Engine
Handles all interactions with the language model (OpenAI-compatible API).
Supports GPT-4, GPT-3.5, Claude (via OpenAI-compat proxy), or local models.
"""

import os
import json
import re
import time
import logging
from typing import Any, Dict, Optional

from openai import OpenAI

logger = logging.getLogger(__name__)

# ─── Client setup ─────────────────────────────────────────────────────────────

def _get_client() -> OpenAI:
    api_key  = os.getenv("OPENAI_API_KEY", "ollama")
    base_url = os.getenv("OPENAI_BASE_URL", "http://localhost:11434/v1")
    return OpenAI(api_key=api_key, base_url=base_url)


def _get_model() -> str:
    return os.getenv("LLM_MODEL", "llama3.2")


def _is_ollama() -> bool:
    """Detect if we're talking to Ollama (or any non-OpenAI provider)."""
    base = os.getenv("OPENAI_BASE_URL", "")
    model = _get_model()
    return "11434" in base or "ollama" in base or "gpt" not in model


# ─── Utility ──────────────────────────────────────────────────────────────────

def _truncate_text(text: str, max_chars: int = 12000) -> str:
    """Truncate text to stay within token limits while keeping structure."""
    if len(text) <= max_chars:
        return text
    half = max_chars // 2
    return text[:half] + "\n\n[...content truncated for analysis...]\n\n" + text[-half:]


def _parse_json_response(raw: str) -> Dict[str, Any]:
    """
    Extract and parse JSON from an LLM response.
    Handles markdown fences, extra prose before/after JSON,
    and common Ollama output quirks.
    """
    if not raw:
        raise ValueError("Empty response from LLM.")

    # 1. Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()

    # 2. Try direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 3. Find the largest {...} block (handles prose before/after JSON)
    matches = list(re.finditer(r"\{", cleaned))
    for m in matches:
        start = m.start()
        depth = 0
        for i, ch in enumerate(cleaned[start:], start):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    candidate = cleaned[start : i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        break

    # 4. Last resort — try to fix common issues (trailing commas, single quotes)
    fixed = re.sub(r",\s*([}\]])", r"\1", cleaned)
    fixed = fixed.replace("'", '"')
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    raise ValueError(f"Could not parse JSON from LLM response:\n{raw[:600]}")


def _call_llm_json(messages: list, max_tokens: int = 2000, temperature: float = 0.2) -> Dict[str, Any]:
    """
    Call the LLM and parse JSON response with retry logic for local models.
    If the first attempt returns prose, retry with a stronger JSON nudge.
    """
    client = _get_client()
    model  = _get_model()
    ollama = _is_ollama()

    create_kwargs = dict(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    if not ollama and "gpt" in model:
        create_kwargs["response_format"] = {"type": "json_object"}

    response = client.chat.completions.create(**create_kwargs)
    raw = response.choices[0].message.content

    try:
        return _parse_json_response(raw)
    except ValueError:
        if not ollama:
            raise  # GPT models should always return JSON — don't retry

        # Retry with a stronger nudge for local models
        logger.warning(f"First attempt returned prose. Retrying with JSON nudge...")
        retry_messages = messages + [
            {"role": "assistant", "content": raw},
            {"role": "user", "content": (
                "Your response above was not valid JSON. "
                "Please respond ONLY with a single JSON object. "
                "No markdown, no explanation, no text before or after the JSON. "
                "Start your response with { and end with }."
            )},
        ]
        create_kwargs["messages"] = retry_messages
        response2 = client.chat.completions.create(**create_kwargs)
        raw2 = response2.choices[0].message.content
        return _parse_json_response(raw2)


# ─── Pedagogical Coherence Analysis ──────────────────────────────────────────

PEDAGOGICAL_SYSTEM_PROMPT = """You are an expert in educational quality assessment and instructional design.
You specialize in Bloom's Taxonomy and pedagogical coherence evaluation.
You analyze educational content objectively and provide structured, actionable feedback.
CRITICAL: You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no text outside the JSON. Start your response with { and end with }."""

PEDAGOGICAL_USER_PROMPT = """Analyze the following educational document for PEDAGOGICAL COHERENCE.

Evaluate these dimensions:
1. **Bloom's Taxonomy alignment**: Identify the cognitive level (Remember, Understand, Apply, Analyze, Evaluate, Create), detect action verbs used in learning objectives, assess whether objectives match the depth of content.
2. **Learning objectives clarity**: Are objectives explicit, measurable, and well-formulated?
3. **Content-objectives alignment**: Does the document content actually address its stated objectives?
4. **Evaluation alignment**: Do any assessments/exercises align with the stated objectives and cognitive level?

Scoring: all scores are out of 10.

Document language: {language}
Document content:
---
{text}
---

Respond ONLY with this JSON structure (no text outside it):
{{
  "overall_score": <float 0-10>,
  "bloom_analysis": {{
    "detected_level": "<Remember|Understand|Apply|Analyze|Evaluate|Create|Unknown>",
    "detected_verbs": ["<verb1>", "<verb2>"],
    "objectives_found": ["<objective1>", "<objective2>"],
    "alignment_score": <float 0-10>,
    "commentary": "<brief explanation>"
  }},
  "objectives_clarity": <float 0-10>,
  "content_alignment": <float 0-10>,
  "evaluation_alignment": <float 0-10>,
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"]
}}"""


def analyze_pedagogical_coherence(text: str, language: str = "auto") -> Dict[str, Any]:
    """Run pedagogical coherence analysis via LLM."""
    client = _get_client()
    model  = _get_model()
    ollama = _is_ollama()

    # Local models have smaller context windows — truncate more aggressively
    max_chars = 6000 if ollama else 12000
    truncated = _truncate_text(text, max_chars=max_chars)
    prompt    = PEDAGOGICAL_USER_PROMPT.format(text=truncated, language=language)

    logger.info(f"Running pedagogical coherence analysis with model={model} (ollama={ollama})")
    t0 = time.time()

    messages = [
        {"role": "system", "content": PEDAGOGICAL_SYSTEM_PROMPT},
        {"role": "user",   "content": prompt},
    ]

    result = _call_llm_json(messages, max_tokens=2000, temperature=0.2)

    elapsed = round(time.time() - t0, 2)
    logger.info(f"Pedagogical analysis completed in {elapsed}s")
    result["_processing_time"] = elapsed
    result["_model"] = model
    return result


# ─── Writing Quality Analysis ─────────────────────────────────────────────────

WRITING_SYSTEM_PROMPT = """You are an expert in educational writing quality, readability, and instructional design communication.
You evaluate documents for clarity, structure, grammar, and readability.
CRITICAL: You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no text outside the JSON. Start your response with { and end with }."""

WRITING_USER_PROMPT = """Analyze the following educational document for WRITING QUALITY.

Evaluate these dimensions:
1. **Clarity**: Is the content expressed clearly? Are concepts explained at the right level?
2. **Structure**: Is the document logically organized with clear sections, headings, and flow?
3. **Readability**: Is the text easy to read? Are sentences too long or complex?
4. **Spelling & Grammar**: Are there obvious spelling, grammar, or punctuation issues?

Scoring: all scores are out of 10.

Document language: {language}
Document content:
---
{text}
---

Respond ONLY with this JSON structure (no text outside it):
{{
  "overall_score": <float 0-10>,
  "clarity_score": <float 0-10>,
  "structure_score": <float 0-10>,
  "readability_score": <float 0-10>,
  "spelling_grammar_score": <float 0-10>,
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"]
}}"""


def analyze_writing_quality(text: str, language: str = "auto") -> Dict[str, Any]:
    """Run writing quality analysis via LLM."""
    client = _get_client()
    model  = _get_model()
    ollama = _is_ollama()

    max_chars = 6000 if ollama else 12000
    truncated = _truncate_text(text, max_chars=max_chars)
    prompt    = WRITING_USER_PROMPT.format(text=truncated, language=language)

    logger.info(f"Running writing quality analysis with model={model} (ollama={ollama})")
    t0 = time.time()

    messages = [
        {"role": "system", "content": WRITING_SYSTEM_PROMPT},
        {"role": "user",   "content": prompt},
    ]

    result = _call_llm_json(messages, max_tokens=1500, temperature=0.2)

    elapsed = round(time.time() - t0, 2)
    logger.info(f"Writing quality analysis completed in {elapsed}s")
    result["_processing_time"] = elapsed
    result["_model"] = model
    return result


# ─── Executive Summary Generator ──────────────────────────────────────────────

SUMMARY_SYSTEM_PROMPT = """You are an educational quality assurance expert writing concise audit summaries for professors.
Be direct, professional, and constructive. Write in the same language as the document."""

SUMMARY_USER_PROMPT = """Based on the following audit results for an educational document, write a concise executive summary (3-5 sentences) that:
- States the overall quality level
- Highlights the 2 most important strengths
- Identifies the 2 most critical issues
- Gives a clear overall recommendation

Document: {filename}
Global Score: {global_score}/10 (Grade: {grade})
Pedagogical Coherence Score: {peda_score}/10
Writing Quality Score: {writing_score}/10

Key Pedagogical Issues: {peda_weaknesses}
Key Writing Issues: {writing_weaknesses}

Write the summary in {language}. Be concise and professional. Return plain text (no JSON, no markdown)."""


def generate_executive_summary(
    filename: str,
    global_score: float,
    grade: str,
    peda_score: float,
    peda_weaknesses: list,
    writing_score: float,
    writing_weaknesses: list,
    language: str = "en",
) -> str:
    """Generate a human-readable executive summary."""
    client = _get_client()
    model = _get_model()

    prompt = SUMMARY_USER_PROMPT.format(
        filename=filename,
        global_score=round(global_score, 1),
        grade=grade,
        peda_score=round(peda_score, 1),
        writing_score=round(writing_score, 1),
        peda_weaknesses="; ".join(peda_weaknesses[:3]) if peda_weaknesses else "None identified",
        writing_weaknesses="; ".join(writing_weaknesses[:3]) if writing_weaknesses else "None identified",
        language=language,
    )

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        max_tokens=400,
    )

    return response.choices[0].message.content.strip()

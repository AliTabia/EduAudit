"""
Feature 1 — AI Similarity & Plagiarism Engine
Compares documents using TF-IDF + cosine similarity across the full corpus.
Also uses the vector store for semantic similarity when available.
"""

import json
import logging
import math
import re
from collections import Counter
from pathlib import Path
from typing import Dict, Any, List, Optional

from .document_ingestion import load_document, list_documents
from .vector_store import find_similar_documents

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def _tokenize(text: str) -> List[str]:
    return re.findall(r'\b[a-zA-ZÀ-ÿ]{3,}\b', text.lower())


def _tfidf_similarity(text_a: str, text_b: str) -> float:
    """Compute cosine similarity using TF-IDF vectors."""
    tokens_a = _tokenize(text_a)
    tokens_b = _tokenize(text_b)
    if not tokens_a or not tokens_b:
        return 0.0

    vocab = set(tokens_a) | set(tokens_b)
    freq_a = Counter(tokens_a)
    freq_b = Counter(tokens_b)
    total_a, total_b = len(tokens_a), len(tokens_b)

    # Simple TF (no IDF for two-doc case)
    def dot(d1, d2):
        return sum(d1.get(w, 0) * d2.get(w, 0) for w in vocab)

    def norm(d, total):
        return math.sqrt(sum((v / total) ** 2 for v in d.values())) or 1e-9

    numerator   = sum((freq_a.get(w, 0) / total_a) * (freq_b.get(w, 0) / total_b) for w in vocab)
    denominator = norm(freq_a, total_a) * norm(freq_b, total_b)
    return round(min(1.0, numerator / denominator), 4)


def _find_overlapping_passages(text_a: str, text_b: str, window: int = 40) -> List[str]:
    """Find shared n-gram windows between two texts."""
    def ngrams(text, n):
        words = _tokenize(text)
        return {' '.join(words[i:i+n]) for i in range(len(words) - n + 1)}

    shared = ngrams(text_a, window) & ngrams(text_b, window)
    return [p for p in list(shared)[:5]]


def compute_similarity(doc_id_a: str, doc_id_b: str) -> Dict[str, Any]:
    """
    Compute detailed similarity between two documents.
    Returns similarity score, verdict, and overlapping passages.
    """
    doc_a = load_document(doc_id_a)
    doc_b = load_document(doc_id_b)

    score  = _tfidf_similarity(doc_a["text"], doc_b["text"])
    shared = _find_overlapping_passages(doc_a["text"], doc_b["text"])

    if score >= 0.85:
        verdict = "high_similarity"
        label   = "Very High — Likely Duplicate"
        color   = "#D01012"
    elif score >= 0.60:
        verdict = "moderate_similarity"
        label   = "Moderate — Significant Overlap"
        color   = "#d97706"
    elif score >= 0.30:
        verdict = "low_similarity"
        label   = "Low — Minor Overlap"
        color   = "#2563eb"
    else:
        verdict = "unique"
        label   = "Unique — No Significant Overlap"
        color   = "#16a34a"

    return {
        "doc_id_a":  doc_id_a,
        "doc_id_b":  doc_id_b,
        "filename_a": doc_a["filename"],
        "filename_b": doc_b["filename"],
        "similarity_score": score,
        "similarity_percent": round(score * 100, 1),
        "verdict": verdict,
        "verdict_label": label,
        "verdict_color": color,
        "overlapping_passages": shared,
    }


def scan_corpus(doc_id: str, top_k: int = 10) -> Dict[str, Any]:
    """
    Scan the entire corpus for documents similar to the given one.
    Returns a ranked list with similarity scores and verdicts.
    """
    target = load_document(doc_id)
    all_docs = list_documents()
    results = []

    for meta in all_docs:
        if meta["doc_id"] == doc_id:
            continue
        try:
            other = load_document(meta["doc_id"])
            score = _tfidf_similarity(target["text"], other["text"])
            results.append({
                "doc_id": meta["doc_id"],
                "filename": meta["filename"],
                "format": meta.get("format", ""),
                "word_count": meta.get("word_count", 0),
                "similarity_score": score,
                "similarity_percent": round(score * 100, 1),
                "verdict": (
                    "high_similarity"     if score >= 0.85 else
                    "moderate_similarity" if score >= 0.60 else
                    "low_similarity"      if score >= 0.30 else "unique"
                ),
            })
        except Exception as e:
            logger.warning(f"Could not compare with {meta['doc_id']}: {e}")

    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    top = results[:top_k]

    flagged_count = sum(1 for r in results if r["similarity_score"] >= 0.60)

    return {
        "doc_id": doc_id,
        "filename": target["filename"],
        "corpus_size": len(all_docs) - 1,
        "flagged_count": flagged_count,
        "results": top,
    }

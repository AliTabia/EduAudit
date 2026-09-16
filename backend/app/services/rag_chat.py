"""
Feature 11 — RAG Chat with Documents
Uses ChromaDB for retrieval + LLM for grounded answers.
Falls back to full-text window if ChromaDB unavailable.
"""

import logging
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

from .llm_engine import _get_client, _get_model, _truncate_text, _is_ollama
from .document_ingestion import load_document

logger = logging.getLogger(__name__)

CHAT_SYSTEM = """You are EduAudit AI, an intelligent assistant helping a university professor understand their course material.
You answer questions based ONLY on the provided document context.
If the answer is not in the context, say so clearly.
Be concise, precise, and pedagogically helpful.
Respond in the same language as the user's question."""


def _retrieve_context(doc_id: str, query: str, top_k: int = 4) -> str:
    """Retrieve relevant chunks from ChromaDB, falling back to text window."""
    try:
        from .vector_store import _get_collection
        collection = _get_collection()
        if collection and collection.count() > 0:
            results = collection.query(
                query_texts=[query],
                n_results=top_k,
                where={"doc_id": doc_id},
            )
            if results["documents"] and results["documents"][0]:
                chunks = results["documents"][0]
                return "\n\n---\n\n".join(chunks)
    except Exception as e:
        logger.debug(f"ChromaDB retrieval failed, falling back: {e}")

    # Fallback: use first 6000 chars of document
    try:
        doc  = load_document(doc_id)
        text = doc["text"]
        # Simple relevance: find paragraphs containing query words
        query_words = set(query.lower().split())
        paragraphs  = [p.strip() for p in text.split('\n\n') if p.strip()]
        scored = []
        for para in paragraphs:
            para_lower = para.lower()
            hits = sum(1 for w in query_words if w in para_lower)
            if hits > 0:
                scored.append((hits, para))
        scored.sort(reverse=True)
        top_paras = [p for _, p in scored[:4]] or paragraphs[:4]
        return "\n\n".join(top_paras)
    except Exception:
        return ""


def chat_with_document(
    doc_id: str,
    question: str,
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """
    Answer a question about a document using RAG.

    Args:
        doc_id: Document to query
        question: User's question
        history: Previous messages [{"role": "user/assistant", "content": "..."}]

    Returns:
        {"answer": str, "sources": [str], "processing_time": float}
    """
    history = history or []

    # 1. Load document metadata
    try:
        doc = load_document(doc_id)
        filename = doc["filename"]
    except FileNotFoundError:
        return {
            "answer": "Document not found.",
            "sources": [],
            "processing_time": 0,
        }

    # 2. Retrieve context
    context = _retrieve_context(doc_id, question)
    if not context:
        max_fallback = 3000 if _is_ollama() else 4000
        context = _truncate_text(doc["text"], max_fallback)

    # 3. Build messages
    client = _get_client()
    model  = _get_model()

    system_msg = f"""{CHAT_SYSTEM}

Document: {filename}

Relevant content from document:
---
{context}
---"""

    messages = [{"role": "system", "content": system_msg}]

    # Include last 6 turns of history
    for turn in history[-6:]:
        messages.append({"role": turn["role"], "content": turn["content"]})

    messages.append({"role": "user", "content": question})

    # 4. Call LLM
    t0 = time.time()
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.3,
        max_tokens=800,
    )

    answer = response.choices[0].message.content.strip()

    # Extract source excerpts (first 100 chars of each chunk)
    sources = [chunk[:100] + "…" for chunk in context.split("\n\n---\n\n")[:3] if chunk.strip()]

    return {
        "answer": answer,
        "sources": sources,
        "doc_id": doc_id,
        "filename": filename,
        "processing_time": round(time.time() - t0, 2),
    }

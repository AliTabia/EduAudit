"""
Similarity router — find similar documents using ChromaDB vector search.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..services.document_ingestion import load_document
from ..services.vector_store import find_similar_documents

router = APIRouter(prefix="/api/similarity", tags=["Similarity"])


class SimilarityRequest(BaseModel):
    doc_id: str
    top_k: Optional[int] = 5


@router.post("/search", summary="Find documents similar to a given document")
async def find_similar(request: SimilarityRequest):
    """
    Use semantic embeddings to find other documents in the corpus
    that are most similar to the specified document.
    Useful for duplicate/redundancy detection.
    """
    try:
        doc = load_document(request.doc_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Document '{request.doc_id}' not found.")

    results = find_similar_documents(
        query_text=doc["text"],
        doc_id=request.doc_id,
        top_k=request.top_k,
    )

    return {
        "doc_id": request.doc_id,
        "filename": doc["filename"],
        "similar_documents": results,
        "vector_store_available": len(results) >= 0,
    }

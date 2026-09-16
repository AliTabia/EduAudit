"""
Documents router — file upload and document management endpoints.
All endpoints require a valid JWT.
"""

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from ..models.schemas import UploadResponse
from ..models.database import get_db
from ..models.user import User
from ..services.document_ingestion import ingest_document, load_document, list_documents
from ..services.vector_store import index_document
from ..services.predictive_scorer import predict_quality
from .auth import get_current_user

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".pptx", ".docx"}

router = APIRouter(prefix="/api/documents", tags=["Documents"])


def _validate_extension(filename: str):
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Accepted: PDF, PPTX, DOCX.",
        )
    return ext


@router.post("/upload", response_model=UploadResponse, summary="Upload a document")
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _validate_extension(file.filename)

    tmp_filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = UPLOAD_DIR / tmp_filename
    filepath.parent.mkdir(parents=True, exist_ok=True)

    try:
        with filepath.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    try:
        doc = ingest_document(filepath, file.filename)
    except ValueError as e:
        filepath.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        filepath.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")

    if background_tasks:
        background_tasks.add_task(
            index_document,
            doc_id=doc["doc_id"],
            text=doc["text"],
            metadata={"filename": doc["filename"], "format": doc["format"]},
        )

    # Run instant predictive quality score (no LLM needed)
    prediction = predict_quality(doc["text"], doc["filename"])

    return {
        "doc_id":     doc["doc_id"],
        "filename":   doc["filename"],
        "format":     doc["format"],
        "word_count": doc["word_count"],
        "page_count": doc["page_count"],
        "message":    f"Uploaded successfully. {doc['word_count']} words extracted.",
        "prediction": prediction,
    }

@router.get("/{doc_id}", summary="Get document metadata")
async def get_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        doc = load_document(doc_id)
        doc.pop("text", None)
        return doc
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")


@router.get("/", summary="List all uploaded documents")
async def get_documents(current_user: User = Depends(get_current_user)):
    docs = list_documents()
    return {"total": len(docs), "documents": docs}

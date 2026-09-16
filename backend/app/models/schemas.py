"""
Pydantic schemas for request/response models.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class DocumentFormat(str, Enum):
    PDF = "pdf"
    PPTX = "pptx"
    DOCX = "docx"


class AuditStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class BloomLevel(str, Enum):
    REMEMBER = "Remember"
    UNDERSTAND = "Understand"
    APPLY = "Apply"
    ANALYZE = "Analyze"
    EVALUATE = "Evaluate"
    CREATE = "Create"
    UNKNOWN = "Unknown"


# ─── Document ────────────────────────────────────────────────────────────────

class DocumentMetadata(BaseModel):
    doc_id: str
    filename: str
    format: DocumentFormat
    page_count: int
    word_count: int
    uploaded_at: datetime
    file_size_kb: float


# ─── Audit Criteria ──────────────────────────────────────────────────────────

class BloomAnalysis(BaseModel):
    detected_level: BloomLevel
    detected_verbs: List[str] = []
    objectives_found: List[str] = []
    alignment_score: float = Field(ge=0.0, le=10.0)
    commentary: str


class PedagogicalCoherenceResult(BaseModel):
    overall_score: float = Field(ge=0.0, le=10.0)
    bloom_analysis: BloomAnalysis
    objectives_clarity: float = Field(ge=0.0, le=10.0)
    content_alignment: float = Field(ge=0.0, le=10.0)
    evaluation_alignment: float = Field(ge=0.0, le=10.0)
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []


class WritingQualityResult(BaseModel):
    overall_score: float = Field(ge=0.0, le=10.0)
    clarity_score: float = Field(ge=0.0, le=10.0)
    structure_score: float = Field(ge=0.0, le=10.0)
    readability_score: float = Field(ge=0.0, le=10.0)
    spelling_grammar_score: float = Field(ge=0.0, le=10.0)
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []


class AuditScoreSummary(BaseModel):
    global_score: float = Field(ge=0.0, le=10.0)
    pedagogical_coherence: float = Field(ge=0.0, le=10.0)
    writing_quality: float = Field(ge=0.0, le=10.0)
    grade: str  # A, B, C, D, F


# ─── Audit Report ────────────────────────────────────────────────────────────

class AuditReport(BaseModel):
    audit_id: str
    doc_id: str
    document: DocumentMetadata
    status: AuditStatus
    scores: AuditScoreSummary
    pedagogical_coherence: PedagogicalCoherenceResult
    writing_quality: WritingQualityResult
    executive_summary: str
    priority_recommendations: List[str] = []
    processing_time_seconds: float
    created_at: datetime
    llm_model_used: str


# ─── API Request/Response ─────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    format: str
    word_count: int
    page_count: int
    message: str


class AuditRequest(BaseModel):
    doc_id: str
    criteria: List[str] = Field(
        default=["pedagogical_coherence", "writing_quality"],
        description="Audit criteria to apply"
    )
    language: str = Field(default="auto", description="Document language (auto/fr/en)")


class AuditStatusResponse(BaseModel):
    audit_id: str
    doc_id: str
    status: AuditStatus
    progress_message: str
    created_at: datetime


class HistoryItem(BaseModel):
    audit_id: str
    doc_id: str
    filename: str
    global_score: float
    grade: str
    status: AuditStatus
    created_at: datetime
    processing_time_seconds: float


class HistoryResponse(BaseModel):
    total: int
    items: List[HistoryItem]


class ErrorResponse(BaseModel):
    error: str
    detail: str
    status_code: int

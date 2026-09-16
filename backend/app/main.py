"""
EduAudit AI — FastAPI Application Entry Point
POC Platform for AI-Powered Pedagogical Content Auditing
ESPRIT — 2026
"""

import logging
import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .routers import (
    documents_router, audit_router, similarity_router,
    auth_router, news_router, advanced_router, admin_router,
    websocket_router, insights_router,
)
from .utils.config import settings
from .models.database import init_db

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ─── App init ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="EduAudit AI",
    description=(
        "AI-powered platform for automated auditing of pedagogical content. "
        "Analyzes educational documents for pedagogical coherence and writing quality "
        "using large language models (LLM)."
    ),
    version="1.0.0-POC",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(audit_router)
app.include_router(similarity_router)
app.include_router(news_router)
app.include_router(advanced_router)
app.include_router(admin_router)
app.include_router(websocket_router)
app.include_router(insights_router)


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "service": "EduAudit AI",
        "version": "1.0.0-POC",
        "llm_model": settings.LLM_MODEL,
        "api_key_configured": bool(settings.OPENAI_API_KEY),
    }


# ─── Global error handler ────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    # Ensure storage directories exist
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
    (settings.DATA_DIR / "audits").mkdir(parents=True, exist_ok=True)

    # Create database tables
    init_db()
    logger.info("✅ Database initialised.")

    if not settings.OPENAI_API_KEY:
        logger.warning(
            "⚠️  OPENAI_API_KEY is not set. "
            "LLM features will fail. Set it in backend/.env"
        )
    else:
        logger.info(f"✅ LLM configured: model={settings.LLM_MODEL}")

    logger.info("🚀 EduAudit AI backend started.")

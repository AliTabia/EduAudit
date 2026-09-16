# EduAudit AI — Complete Project Report

### AI-Powered Pedagogical Content Auditing Platform
**ESPRIT — Honoris United Universities | 2026**

---

> **EduAudit AI** is a full-stack web platform that allows university teachers at ESPRIT
> to upload course materials (PDF, PPTX, DOCX) and receive automated AI-powered quality audits
> covering pedagogical coherence, writing quality, Bloom's Taxonomy alignment, content freshness,
> exam generation, RAG chat, and much more — all powered by a local LLM (Ollama llama3.2)
> with zero cloud API costs.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Installation & Setup](#4-installation--setup)
5. [User Journey — Complete Walkthrough](#5-user-journey--complete-walkthrough)
6. [Backend — Routers & Services](#6-backend--routers--services)
7. [Frontend — Pages & Components](#7-frontend--pages--components)
8. [AI Features Deep Dive](#8-ai-features-deep-dive)
9. [Database & Data Model](#9-database--data-model)
10. [API Reference](#10-api-reference)
11. [Configuration Reference](#11-configuration-reference)
12. [Full Project Structure](#12-full-project-structure)

---

## 1. Project Overview

### Context
ESPRIT (École Supérieure Privée d'Ingénierie et de Technologies), part of the Honoris United
Universities network, continuously produces and updates a large volume of pedagogical content
(course slides, exercises, exam subjects, case studies) across multiple departments and programs.

Quality control of this content traditionally relied on manual peer reviews — time-consuming,
inconsistent, and difficult to scale. EduAudit AI automates this process using large language
models and NLP, while keeping full human control over final decisions.

### Problem Statement
> *How can we design an AI platform capable of automatically analyzing pedagogical content
> to evaluate its coherence, quality, currency, and alignment with learning objectives —
> while remaining reliable and explainable enough to support teacher decisions?*

### Solution
A full-stack POC (Proof of Concept) platform that:
- Accepts PDF, PPTX, and DOCX uploads from authenticated teachers
- Extracts and analyzes text using a local LLM (Ollama / llama3.2)
- Produces structured audit reports with scores, grades, and recommendations
- Offers 15+ advanced AI features beyond basic auditing
- Runs 100% locally — no internet required for AI processing, no API costs

### Key Metrics
| Metric | Value |
|--------|-------|
| Backend API routes | 49 endpoints |
| Frontend pages | 15 pages |
| AI services | 11 service modules |
| Supported formats | PDF, PPTX, DOCX |
| LLM | Ollama llama3.2 (local, free) |
| Database | SQLite (file-based, zero config) |
| Languages | French 🇫🇷 / English 🇬🇧 |

---

## 2. Technology Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.11+ | Core backend language |
| **FastAPI** | 0.111.0 | REST API framework — high performance, async, auto-docs |
| **Uvicorn** | 0.29.0 | ASGI server for running FastAPI |
| **SQLAlchemy** | 2.0.30 | ORM for SQLite database access |
| **SQLite** | built-in | Lightweight file-based database — stores users, rubrics |
| **Pydantic** | 2.7.1 | Data validation and serialization for all API schemas |
| **OpenAI SDK** | ≥1.52.0 | OpenAI-compatible HTTP client — used to talk to Ollama |
| **Ollama** | local | Runs LLMs locally (llama3.2, mistral, etc.) |
| **pdfplumber** | 0.11.0 | Extracts text from PDF files with layout awareness |
| **python-pptx** | 0.6.23 | Extracts text from PowerPoint (PPTX) files slide-by-slide |
| **python-docx** | 1.1.2 | Extracts text from Word (DOCX) documents |
| **ChromaDB** | ≥0.4.24 | Vector database for semantic document similarity search |
| **reportlab** | 4.2.0 | Generates branded PDF audit reports with ESPRIT styling |
| **passlib + bcrypt** | 1.7.4 / 4.1.3 | Secure password hashing using bcrypt algorithm |
| **python-jose** | 3.3.0 | JWT (JSON Web Token) generation and verification |
| **langdetect** | 1.0.9 | Detects document language (FR/EN/AR) automatically |
| **scikit-learn** | 1.4.2 | TF-IDF vectorization for document similarity scoring |
| **APScheduler** | 3.10.4 | Background job scheduling (recurring audits) |
| **python-dotenv** | 1.0.1 | Loads environment variables from `.env` file |
| **python-multipart** | 0.0.9 | Handles file uploads in FastAPI |
| **email-validator** | 2.1.1 | Validates email format during registration |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3.1 | UI component framework |
| **Vite** | 5.2.13 | Build tool and dev server — fast HMR |
| **React Router DOM** | 6.23.1 | Client-side routing and navigation |
| **JavaScript (ES2020)** | — | All frontend logic in modern JS/JSX |
| **CSS Variables** | — | Design tokens for ESPRIT brand palette |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Ollama** | Local LLM runtime — runs llama3.2, mistral, etc. |
| **Docker + Docker Compose** | Optional containerized deployment |
| **SQLite** | Zero-config embedded database |
| **File system** | Document storage in `backend/data/` |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                   │
│              React 18 + Vite  (localhost:5173)                   │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │Auth     │ │Dashboard │ │Audit     │ │Advanced AI Pages   │  │
│  │Login    │ │News Feed │ │Upload    │ │Chat·Exam·Similarity│  │
│  │Register │ │Stats     │ │Report    │ │Outline·Evolution   │  │
│  └─────────┘ └──────────┘ └──────────┘ └────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│               FastAPI Backend  (localhost:8002)                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    9 API Routers                          │   │
│  │  auth · documents · audit · advanced · insights          │   │
│  │  admin · news · similarity · websocket                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   11 Service Modules                      │   │
│  │  llm_engine · audit_service · document_ingestion         │   │
│  │  content_generator · insights_service · rag_chat         │   │
│  │  similarity_service · vector_store · predictive_scorer   │   │
│  │  pdf_export · auth_service                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────┐  │
│  │  SQLite DB    │  │  File System  │  │    ChromaDB         │  │
│  │  users table  │  │  /data/docs   │  │  vector embeddings  │  │
│  │  JWT sessions │  │  /data/audits │  │  semantic search    │  │
│  └───────────────┘  │  /data/evol.  │  └─────────────────────┘  │
│                     └───────────────┘                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ OpenAI-compatible API
┌──────────────────────────▼──────────────────────────────────────┐
│               Ollama  (localhost:11434)                          │
│               Model: llama3.2 (3B, ~2GB, local, free)           │
│               Alternatives: mistral, llama3.1, qwen2.5          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow — Document Audit
```
Teacher uploads PDF
      ↓
document_ingestion.py → extracts text (pdfplumber/pptx/docx)
      ↓
predictive_scorer.py → instant heuristic score (no LLM needed)
      ↓
llm_engine.py → sends text to Ollama with structured prompts
      ↓
  ┌───────────────────────────┐
  │ analyze_pedagogical_coherence()  → Bloom's analysis, objectives
  │ analyze_writing_quality()        → clarity, structure, grammar
  │ generate_executive_summary()     → narrative summary
  └───────────────────────────┘
      ↓
audit_service.py → computes weighted score, assigns grade A+→F
      ↓
insights_service.py → records score in evolution history
      ↓
JSON report saved to /data/audits/{audit_id}.json
      ↓
Frontend renders tabbed report with charts and recommendations
```

---

## 4. Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.com) installed and running
- 3GB free disk space (for the LLM model)

### Step 1 — Clone & Install Backend

```powershell
cd backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
copy .env.example .env
# Edit .env — see Configuration section
```

### Step 2 — Install & Configure Ollama

```powershell
# Download Ollama from https://ollama.com and install it
# Then pull the recommended model (2GB download, one-time):
ollama pull llama3.2

# Verify Ollama is running:
curl http://localhost:11434/api/tags
```

### Step 3 — Configure .env

```env
# ── LLM (Ollama — Free & Local) ────────────────────────────────
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2

# ── Authentication ──────────────────────────────────────────────
JWT_SECRET_KEY=your-random-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# ── App ─────────────────────────────────────────────────────────
APP_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_UPLOAD_SIZE_MB=50
```

### Step 4 — Start Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8002
# API available at http://localhost:8002
# Swagger docs at http://localhost:8002/api/docs
```

### Step 5 — Install & Start Frontend

```powershell
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

### Step 6 — First Use
1. Open **http://localhost:5173**
2. Click **"Créer un compte"** to register your teacher account
3. Fill in your name, email, password, subject, and department
4. You are automatically logged in and redirected to the Dashboard

---

## 5. User Journey — Complete Walkthrough

### 5.1 Registration (`/register`)
The registration page is split into **two steps**:

**Step 1 — Account Details**
- First name and last name (required)
- Email address (validated format, must be unique)
- Password (minimum 6 characters)
- Password confirmation

**Step 2 — Teaching Profile**
- Subject(s) taught (dropdown: Mathematics, Computer Science, AI, etc.)
- Department / Option (Computer Science, Business, Engineering, etc.)
- Grade level(s) (1st year, Master 1, etc.)
- Profile colour (avatar colour picker, 9 options)

On successful registration, a JWT token is generated and stored in `localStorage`.
The user is redirected to the Dashboard immediately.

---

### 5.2 Login (`/login`)
- Email and password form with password visibility toggle
- Uses **OAuth2 Password Flow** — sends credentials as form data
- On success: JWT token stored in `localStorage`, user redirected to Dashboard
- On failure: error message shown inline

The JWT token expires after **7 days** (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).
All subsequent API calls include the token in the `Authorization: Bearer <token>` header.

---

### 5.3 Dashboard (`/`)
The main home screen after login. Contains:

**Welcome Banner**
- Personalized greeting based on time of day (Bonjour / Bon après-midi / Bonsoir)
- Teacher's name, subject badge, department badge
- Quick "New Audit" button

**Statistics Cards** (4 cards)
- Total Audits run by this teacher
- Average global score
- Highest score achieved
- Lowest score recorded

**Live News Ticker**
- A scrolling banner at the top showing AI research headlines, EdTech news,
  and university updates — fetched from RSS feeds (arXiv, Times Higher Education,
  EdSurge, VentureBeat). Falls back to curated static articles if offline.

**Recent Audits Panel**
- Last 6 audits with filename, score circle, grade badge, and timestamp
- Click any row to open the full report

**Grade Distribution Chart**
- Horizontal bar chart showing how your audits distribute across A+, A, B, C, D, F

**Full News Feed**
- Tabbed article cards: All / AI Research / AI News / EdTech / Universities
- Each card shows title, source, description, category badge, and a "Read more" link

---

### 5.4 New Audit (`/audit`)
The core feature. A 4-step flow:

**Step 1 — Upload**
- Drag-and-drop zone or file browser
- Accepts: `.pdf`, `.pptx`, `.docx` (max 50 MB)
- On upload: text is extracted, word count and page count computed
- **Predictive Score** is shown instantly (heuristic, no LLM) — gives a preview
  of expected quality before the full audit

**Step 2 — Configure**
- Select audit criteria:
  - ✅ **Pedagogical Coherence** — Bloom's Taxonomy, objectives alignment
  - ✅ **Writing Quality** — clarity, structure, readability, grammar
- Select document language: Auto-detect / French / English / Arabic
- Document metadata shown: filename, word count, pages, format

**Step 3 — Analyzing** (loading state)
- Visual animated progress indicators
- LLM calls happen sequentially (coherence → writing → summary)
- Takes 15–90 seconds depending on document length and model

**Step 4 — Results**
The full audit report with 4 tabs:

- **Overview**: Global score, grade badge, document metadata, executive summary,
  top 5 priority recommendations
- **Pedagogical Coherence**: Bloom's pyramid visualization, objectives clarity,
  content alignment, evaluation alignment scores, strengths/weaknesses/recommendations
- **Writing Quality**: Clarity, structure, readability, spelling/grammar scores,
  animated score bars, strengths/weaknesses/recommendations
- **Recommendations**: All recommendations consolidated with tabbed
  strengths / weaknesses / recommendations per criterion

---

### 5.5 Audit History (`/history`)
A sortable, searchable table of all past audits for the logged-in teacher.

Columns: Document name · Score · Grade · Status · Processing time · Date · Actions

Features:
- Search by filename (live filter)
- Sort by any column (click header)
- Click **View** to open the full report for any past audit
- PDF download button on each report (branded ESPRIT PDF)
- Reports are scoped per teacher — each teacher only sees their own audits

---

### 5.6 My Profile (`/profile`)
Three sections:

**Profile Preview Banner**
- Live preview of the teacher card (updates as you type)
- Shows name, subject, department, grade level, email

**Edit Profile Form**
- First/last name, subject dropdown, department dropdown
- Grade level (free text), bio (textarea)
- Avatar colour picker (9 ESPRIT-palette colours)
- Changes are saved with `PUT /api/auth/profile`

**Change Password**
- Current password, new password (6+ chars), confirmation
- Validated before sending to backend

---

### 5.7 Advanced AI Features

#### 💬 Chat with Document (`/chat`)
A full RAG (Retrieval-Augmented Generation) chat interface.

1. Select a previously uploaded document
2. Type any question about the document's content
3. The system retrieves the most relevant passages using ChromaDB vector search
4. Those passages are injected as context into the LLM prompt
5. The LLM answers based **only** on what is in the document
6. Sources (excerpts from document) are shown below each answer
7. Suggested questions are displayed when no conversation exists yet
8. Conversation history is maintained for multi-turn dialogue

---

#### 📝 Exam Generator (`/exam`)
Automatically generates a complete exam from any uploaded document.

Configuration options:
- Document selection
- Bloom's Taxonomy level (Remember → Create)
- Number of MCQ (1–20), Open questions (0–10), Case studies (0–3)
- Language: Auto / French / English / Arabic

Output tabs:
- **MCQ**: Each question with 4 options, correct answer highlighted in green,
  point value, Bloom level
- **Open Questions**: Question text, expected response length, point value, marking criteria
- **Case Study**: Scenario text, 2+ questions with total points
- **Download**: Export full exam as `.txt` file

---

#### 🌍 Courseware Comparison (`/courseware`)
Benchmarks your document against world-class university courses.

The LLM uses its training knowledge of MIT OpenCourseWare, Stanford Online,
Coursera, edX, and major international programs to:
- Identify what subject/topic the document covers
- Find equivalent courses from top universities
- Calculate percentage coverage match per course
- Show matching topics (green) and missing topics (red)
- Assign a global ranking: `top_tier | competitive | average | below_average`
- Suggest specific resources and improvements to reach international level

---

#### 📈 Quality Evolution Timeline (`/evolution`)
Tracks how document quality improves over multiple audits.

Every time a document is audited, the score is automatically recorded in
`/data/evolution/{doc_id}.json`. The timeline shows:
- Sparkline chart (SVG, custom-drawn) with color coding (green = improving)
- Trend badge: Improving 📈 / Declining 📉 / Stable ➡️
- Per-audit data table with score, grade, timestamp, and delta arrows
- Aggregate stats: first score, latest score, best score, total improvement

---

#### 🔁 Similarity & Plagiarism Engine (`/similarity`)
Detects duplicate or overlapping content across the document corpus.

**Two modes:**

*Corpus Scan*: Scans all uploaded documents and ranks them by similarity
to the selected document. Uses TF-IDF (Term Frequency–Inverse Document Frequency)
cosine similarity implemented in `similarity_service.py`.

*Pairwise Compare*: Compares exactly two documents and shows:
- Similarity percentage
- Verdict label: Very High (≥85%) / Moderate (≥60%) / Low (≥30%) / Unique
- Overlapping text passages (40-word n-gram matching)

---

#### ⚡ Trend & Freshness Detector (`/freshness`)
Scans documents for outdated content using a hybrid approach:

**Rule-based pass**: Checks for known obsolete terms (Flash, MD5, IE, Python 2,
jQuery, Word2Vec, etc.) with hardcoded reason and modern alternative.

**LLM pass**: Deeper analysis for:
- Outdated technologies or frameworks
- Deprecated concepts
- Missing coverage of recent developments (last 2-3 years)
- Stale statistics or data points

Output:
- Freshness score (0–10) with verdict (cutting-edge → critically-outdated)
- Per-item flagging with severity (high/medium/low), excerpt, and modern alternative
- Missing topics list and update recommendations

---

#### 📚 Multi-Document Module Audit (`/module`)
Audits a set of documents as a **cohesive teaching module** (not individually).

Select 2–10 documents in the correct order. The LLM evaluates:
- **Progression**: Does complexity increase logically across documents?
- **Bloom Escalation**: Do cognitive levels progress from lower to higher-order?
- **Redundancy**: Is content repeated unnecessarily between documents?
- **Coverage Gaps**: What important topics are missing from the module?
- **Coherence**: Do documents reference and build on each other?

Output: Module-level score, per-document position assessment with Bloom level,
redundant topics list, coverage gap list, and recommendations.

---

#### 🧠 AI Course Outline Generator (`/outline`)
Generates a complete structured syllabus from scratch given:
- Course topic (free text)
- Target level (Bachelor 1st year → PhD)
- Number of weeks (2–30)
- Hours per week
- Additional instructions (optional)

Output tabs:
- **Weekly Plan**: Card per week with title, Bloom level, specific objectives,
  activities (type + duration), and deliverables
- **Objectives**: All global learning objectives with Bloom level and action verb
- **Assessments**: Full assessment plan with type, weight %, week due, Bloom level
- **Resources**: Recommended reading list (textbooks, online, tools, papers)
- **Bloom Map**: Visual bar chart showing Bloom level progression week by week

---

#### 🛡️ Admin Dashboard (`/admin`) — Admin accounts only
Platform-wide analytics for department heads.

Three tabs:
- **Overview**: Total audits, total teachers, average score, grade distribution
  chart, per-department statistics
- **Teachers**: Table of all teachers with audit count, average score, best score,
  last audit date
- **Rankings**: Ranked list of teachers by average score with trend indicators (📈📉➡️)

An admin user is created by calling `POST /api/admin/users/{user_id}/promote`.

---

## 6. Backend — Routers & Services

### 6.1 Routers (`backend/app/routers/`)

| File | Prefix | Description |
|------|--------|-------------|
| `auth.py` | `/api/auth` | Registration, login, JWT, profile CRUD, password change |
| `documents.py` | `/api/documents` | File upload (PDF/PPTX/DOCX), document listing, metadata |
| `audit.py` | `/api/audit` | Run audit, retrieve reports, history, statistics |
| `advanced.py` | `/api/advanced` | 10 advanced AI endpoints (exam, chat, freshness, etc.) |
| `insights.py` | `/api/insights` | Courseware comparison, evolution, resources, collaboration, outline generator |
| `admin.py` | `/api/admin` | Platform-wide stats, teacher list, rankings (admin only) |
| `news.py` | `/api/news` | RSS news proxy with 30-minute cache |
| `similarity.py` | `/api/similarity` | Legacy similarity endpoint |
| `websocket.py` | `/api/collab` | WebSocket real-time collaborative audit review |

### 6.2 Services (`backend/app/services/`)

#### `llm_engine.py` — Core LLM Interface
The central AI engine. All LLM calls pass through this module.

Key functions:
- `_get_client()` — Creates OpenAI-compatible client pointing to Ollama
- `_get_model()` — Returns model name from `.env` (default: `llama3.2`)
- `_is_ollama()` — Detects if we're using a local Ollama model
- `_truncate_text()` — Truncates documents to fit context window (6000 chars for Ollama, 12000 for GPT)
- `_parse_json_response()` — Robust JSON parser with 4-level fallback strategy (direct parse → fence strip → brace search → fix common errors)
- `_call_llm_json()` — Primary call function with **automatic retry** for local models that return prose instead of JSON
- `analyze_pedagogical_coherence()` — Bloom's analysis via LLM
- `analyze_writing_quality()` — Writing quality analysis via LLM
- `generate_executive_summary()` — Plain-text narrative summary

#### `audit_service.py` — Audit Pipeline Orchestrator
Coordinates the full audit workflow:
1. Loads document text from disk
2. Detects language (French/English heuristic marker counting)
3. Calls `analyze_pedagogical_coherence()` and `analyze_writing_quality()`
4. Computes weighted global score: `peda × 0.6 + writing × 0.4`
5. Assigns letter grade (A+ ≥9.0, A ≥8.0, B ≥7.0, C ≥6.0, D ≥5.0, F <5.0)
6. Generates executive summary
7. Saves JSON report to `/data/audits/{audit_id}.json`
8. Records score in evolution tracker

#### `document_ingestion.py` — Document Parser
Handles all file format parsing:
- **PDF**: Uses `pdfplumber` — extracts text page by page, joins with double newlines
- **PPTX**: Uses `python-pptx` — iterates slides and shapes, prefixes with `[Slide N]`
- **DOCX**: Uses `python-docx` — extracts all paragraphs, estimates page count (300 words/page)
- Saves extracted text to `/data/{doc_id}/text.txt`
- Saves metadata to `/data/{doc_id}/metadata.json`

#### `content_generator.py` — Multi-Purpose AI Generator
Houses 6 LLM-powered generation functions:
- `generate_missing_content()` — Suggests objectives, exercises, and introduction to fill audit gaps
- `generate_exam()` — Creates MCQ + open questions + case study
- `simulate_student_comprehension()` — Simulates a student reading the document and answering questions
- `detect_outdated_content()` — Hybrid rule-based + LLM freshness scan
- `audit_module()` — Multi-document module-level analysis
- `align_to_competencies()` — Maps content to a competency framework

#### `insights_service.py` — 5 Advanced Insight Functions
- `compare_with_courseware()` — MIT/Stanford benchmark comparison
- `record_score()` / `get_evolution()` / `get_all_evolutions()` — Evolution timeline management
- `find_related_resources()` — Open educational resource discovery
- `find_collaboration_opportunities()` — Cross-teacher similarity matching
- `generate_course_outline()` — Complete structured syllabus generation

#### `similarity_service.py` — Plagiarism Detection
- `_tfidf_similarity()` — Pure Python cosine similarity using term frequency
- `_find_overlapping_passages()` — 40-word n-gram matching to find shared passages
- `scan_corpus()` — Compares one document against all others, ranks by similarity
- `compute_similarity()` — Detailed pairwise comparison with verdict and passages

#### `predictive_scorer.py` — Instant Quality Predictor
Estimates document quality **without LLM** using:
- Bloom's taxonomy verb detection (6 levels)
- Structure markers (objectives, introduction, conclusion, figures, etc.)
- Quality signals (examples, citations, figures)
- Flesch-Kincaid readability estimate
- Content length adequacy
- Vocabulary richness (type-token ratio)
- Noise penalty (excessive ellipsis, ALL CAPS, placeholder text)

Returns: predicted score (0–10), grade, confidence level, feature breakdown, risk flags.
Called automatically on every document upload for instant feedback.

#### `rag_chat.py` — RAG Chat Engine
- Retrieves relevant document chunks from ChromaDB using the user's question
- Falls back to keyword-based paragraph selection if ChromaDB unavailable
- Injects retrieved context into LLM system prompt
- Maintains conversation history (last 6 turns) for multi-turn dialogue
- Returns answer + source excerpts

#### `vector_store.py` — ChromaDB Integration
- Custom `HashEmbeddingFn` — 128-dimensional character n-gram hash embeddings (no model download required)
- `index_document()` — Chunks document into 500-word overlapping windows and stores in ChromaDB
- `find_similar_documents()` — Semantic similarity search across corpus

#### `pdf_export.py` — PDF Report Generator
Generates a professional branded PDF using ReportLab:
- ESPRIT red banner header with document name and grade
- Score summary table
- Executive summary
- Pedagogical coherence section with Bloom analysis table
- Writing quality section with score breakdown
- Priority recommendations
- Footer with ESPRIT / Honoris branding

#### `auth_service.py` — Authentication Logic
- `hash_password()` / `verify_password()` — bcrypt via passlib
- `create_access_token()` — Generates JWT with 7-day expiry
- `decode_token()` — Verifies and decodes JWT, returns user_id
- `create_user()` / `get_user_by_email()` / `get_user_by_id()` — SQLAlchemy CRUD
- `update_profile()` / `change_password()` — Profile management

---

## 7. Frontend — Pages & Components

### 7.1 Pages (`frontend/src/pages/`)

| File | Route | Description |
|------|-------|-------------|
| `Login.jsx` | `/login` | Split-panel auth form with ESPRIT branding, eye toggle |
| `Register.jsx` | `/register` | 2-step registration with profile setup and colour picker |
| `Dashboard.jsx` | `/` | Stats overview, news ticker, recent audits, grade chart |
| `NewAudit.jsx` | `/audit` | Upload → configure → analyze → results 4-step flow |
| `History.jsx` | `/history` | Sortable/searchable audit history table |
| `Profile.jsx` | `/profile` | Edit profile form, password change, live preview |
| `ChatPage.jsx` | `/chat` | RAG chat interface with suggested questions |
| `ExamPage.jsx` | `/exam` | Exam generator with MCQ/open/case study tabs |
| `SimilarityPage.jsx` | `/similarity` | Corpus scan + pairwise compare with similarity meter |
| `CoursewarePage.jsx` | `/courseware` | MIT/Stanford benchmark with coverage cards |
| `EvolutionPage.jsx` | `/evolution` | Sparkline charts + audit history per document |
| `FreshnessPage.jsx` | `/freshness` | Outdated content detector with severity badges |
| `ModuleAuditPage.jsx` | `/module` | Multi-document module audit with Bloom progression |
| `OutlinePage.jsx` | `/outline` | AI course outline generator with 5-tab report |
| `AdminPage.jsx` | `/admin` | Department dashboard (admin accounts only) |

### 7.2 Components (`frontend/src/components/`)

| File | Purpose |
|------|---------|
| `Layout.jsx` | App shell — collapsible sidebar, topbar, user dropdown, FR/EN toggle |
| `AuditReport.jsx` | Full tabbed audit report viewer (Overview/Pedagogical/Writing/Recommendations) |
| `ScoreCard.jsx` | Radial SVG gauge showing a score 0–10 with colour coding |
| `GradeBadge.jsx` | Colour-coded grade label (A+/A/B/C/D/F) |
| `BloomBadge.jsx` | Bloom's Taxonomy pyramid visualization with detected level highlighted |
| `RecommendationsList.jsx` | Tabbed panel showing strengths, weaknesses, recommendations |
| `HistoryTable.jsx` | Sortable, searchable table for audit history |
| `UploadZone.jsx` | Drag-and-drop file upload area with format validation |
| `NewsFeed.jsx` | Live news ticker (marquee) + tabbed article card grid |
| `EspritLogo.jsx` | SVG ESPRIT wordmark with play arrow, tagline, and Honoris text |

### 7.3 Context & Hooks

| File | Purpose |
|------|---------|
| `context/AuthContext.jsx` | Global auth state — JWT token, user object, login/logout/register |
| `context/LangContext.jsx` | Global language state — FR/EN toggle, `t(key)` translation function with 100+ keys |
| `hooks/useAudit.js` | Upload + audit lifecycle state management with step tracking |

### 7.4 Utilities

| File | Purpose |
|------|---------|
| `utils/api.js` | All HTTP calls to the backend — wraps fetch with auth headers and error handling |
| `utils/helpers.js` | `scoreColor()`, `gradeBadgeColor()`, `formatDate()`, `formatFileSize()`, `bloomLevelColor()` |

### 7.5 Routing & Protection

```
/login, /register  → GuestRoute  (redirects to / if already logged in)
/, /audit, ...     → ProtectedRoute (redirects to /login if not authenticated)
/admin             → ProtectedRoute + admin check in backend
```

All advanced pages (Chat, Exam, Similarity, etc.) are **lazy-loaded** using
`React.lazy()` — they are only downloaded when the user navigates to them,
keeping the initial bundle small.

---

## 8. AI Features Deep Dive

### 8.1 Ollama Integration
The backend uses the **OpenAI Python SDK** (`openai>=1.52.0`) configured to point
at Ollama's OpenAI-compatible API (`http://localhost:11434/v1`). This means
switching between Ollama and any OpenAI-compatible provider requires only
two `.env` changes — no code changes.

```python
# llm_engine.py
client = OpenAI(api_key="ollama", base_url="http://localhost:11434/v1")
```

### 8.2 JSON Reliability for Local Models
Local models (llama3.2) sometimes return markdown prose instead of JSON.
A 4-level parsing strategy with automatic retry is implemented:

```
1. Direct json.loads() on cleaned response
2. Strip markdown fences (```json ... ```)
3. Find largest {…} block by matching braces
4. Fix common issues (trailing commas, single quotes)
   └── If all fail → retry with stronger "give me ONLY JSON" nudge
```

### 8.3 Bloom's Taxonomy Detection
The system detects which of the 6 Bloom levels a document targets by:
1. Scanning for action verbs associated with each level:
   - **Remember**: define, list, recall, identify, name
   - **Understand**: explain, describe, summarize, interpret, compare
   - **Apply**: calculate, solve, demonstrate, implement, execute
   - **Analyze**: analyze, differentiate, examine, distinguish, break down
   - **Evaluate**: evaluate, judge, justify, critique, assess, defend
   - **Create**: design, create, develop, compose, construct, plan
2. Passing detected verbs and document excerpt to LLM for confirmation
3. Computing an alignment score between detected level and content depth

### 8.4 Scoring System
```
Global Score = Pedagogical Coherence × 0.6 + Writing Quality × 0.4

Grades:
  A+  ≥ 9.0
  A   ≥ 8.0
  B   ≥ 7.0
  C   ≥ 6.0
  D   ≥ 5.0
  F   < 5.0
```

### 8.5 Predictive Scoring (No LLM)
Available instantly on upload. Weighted composite of:
```
Bloom verb coverage      × 0.25
Document structure       × 0.25
Quality signals          × 0.15
Readability (FK score)   × 0.15
Content length           × 0.10
Vocabulary richness      × 0.10
  − Noise penalty
```
Confidence: high (≥500 words), medium (≥200), low (<200).

### 8.6 Language Detection
Heuristic-based detection comparing French vs English marker word frequencies
in the first 3000 characters:
```python
fr_markers = ["le ", "la ", "les ", "de ", "du ", "est ", "que "]
en_markers = ["the ", "is ", "are ", "and ", "for ", "this ", "from "]
```
Returns `"fr"` or `"en"` and is passed to all LLM prompts to ensure
responses are in the document's own language.

---

## 9. Database & Data Model

### 9.1 SQLite Database (`backend/data/eduaudit.db`)
Used for persistent user accounts. A single table:

**`users` table**

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (UUID) | Primary key — generated with `uuid.uuid4()` |
| `email` | VARCHAR UNIQUE | Login email — stored lowercase |
| `hashed_password` | VARCHAR | bcrypt hash — never stored in plain text |
| `is_active` | BOOLEAN | Soft delete flag |
| `first_name` | VARCHAR(80) | Teacher's first name |
| `last_name` | VARCHAR(80) | Teacher's last name |
| `subject` | VARCHAR(200) | Subject(s) taught (e.g. "Computer Science, AI") |
| `department` | VARCHAR(200) | Department or option |
| `grade_level` | VARCHAR(200) | Grade level(s) taught |
| `bio` | TEXT | Short biography |
| `avatar_color` | VARCHAR(7) | Hex colour for initials avatar |
| `is_admin` | BOOLEAN | Admin privileges flag |
| `created_at` | DATETIME | Auto-set on insert |
| `updated_at` | DATETIME | Auto-set on update |

**Automatic migrations** run on startup via `_migrate()` — safely adds new columns
to an existing database without data loss using `ALTER TABLE ... ADD COLUMN`.

### 9.2 File-Based Storage (`backend/data/`)

```
data/
├── eduaudit.db              ← SQLite database (users)
├── {doc_id}/
│   ├── text.txt             ← Extracted document text
│   └── metadata.json        ← doc_id, filename, format, page_count, word_count
├── audits/
│   └── {audit_id}.json      ← Full audit report (scores, analysis, summary)
├── evolution/
│   └── {doc_id}.json        ← Score history array for evolution timeline
├── rubrics/
│   └── {rubric_id}.json     ← Custom rubric definitions
└── chroma_db/
    └── chroma.sqlite3       ← ChromaDB vector store
```

### 9.3 Authentication Flow
```
Register:
  POST /api/auth/register
  → bcrypt.hash(password) → store User → create JWT → return token + user

Login:
  POST /api/auth/login (OAuth2 form)
  → lookup user by email → bcrypt.verify(password) → create JWT → return token + user

Protected Request:
  Any request with Authorization: Bearer <token>
  → decode_token(token) → get user_id → load User from DB → inject as dependency
```

---

## 10. API Reference

All endpoints require `Authorization: Bearer <token>` except `/api/auth/register`,
`/api/auth/login`, and `/api/health`.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create teacher account, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile fields |
| PUT | `/api/auth/password` | Change password |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload PDF/PPTX/DOCX, returns doc_id + predictive score |
| GET | `/api/documents/` | List all uploaded documents |
| GET | `/api/documents/{doc_id}` | Get document metadata |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audit/run` | Run full LLM audit on a document |
| GET | `/api/audit/report/{audit_id}` | Retrieve a saved audit report |
| GET | `/api/audit/history` | List all audits for current teacher |
| GET | `/api/audit/stats` | Aggregate statistics for current teacher |

### Advanced Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/advanced/similarity/scan` | Scan corpus for similar documents |
| POST | `/api/advanced/similarity/compare` | Pairwise document comparison |
| POST | `/api/advanced/generate/missing-content` | Generate content to fill gaps |
| POST | `/api/advanced/generate/module-audit` | Multi-document module audit |
| POST | `/api/advanced/generate/exam` | Auto-generate exam |
| POST | `/api/advanced/generate/comprehension` | Student comprehension simulation |
| POST | `/api/advanced/analyze/competencies` | Competency alignment matrix |
| POST | `/api/advanced/analyze/freshness` | Outdated content detection |
| GET | `/api/advanced/report/{audit_id}/pdf` | Download branded PDF report |
| POST | `/api/advanced/chat` | RAG chat with document |
| POST | `/api/advanced/translate/recommendations` | Translate recommendations |
| GET | `/api/advanced/predict/{doc_id}` | Instant predictive quality score |

### Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/insights/courseware-comparison` | MIT/Stanford benchmark |
| GET | `/api/insights/evolution` | All document evolution summaries |
| GET | `/api/insights/evolution/{doc_id}` | Evolution for one document |
| POST | `/api/insights/related-resources` | Find open educational resources |
| POST | `/api/insights/collaboration` | Find collaboration opportunities |
| POST | `/api/insights/generate-outline` | Generate course syllabus |

### Admin (admin accounts only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform-wide statistics |
| GET | `/api/admin/teachers` | All teachers with audit stats |
| GET | `/api/admin/audits` | All audits across all teachers |
| GET | `/api/admin/rankings` | Teacher ranking by avg score |
| POST | `/api/admin/users/{id}/promote` | Promote user to admin |

### Real-Time
| Method | Endpoint | Description |
|--------|----------|-------------|
| WS | `/api/collab/ws/{audit_id}` | WebSocket collaborative review |
| GET | `/api/collab/comments/{audit_id}` | Get comments (REST fallback) |

### News & Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news/feed` | Aggregated news feed (RSS proxy, 30-min cache) |
| GET | `/api/news/feed/{category}` | News by category |
| GET | `/api/health` | Health check — returns status + model info |

---

## 11. Configuration Reference

All settings live in `backend/.env`:

```env
# ── LLM — Ollama (local, free) ────────────────────────────────────────────────
OPENAI_API_KEY=ollama          # Dummy key for Ollama compatibility
OPENAI_BASE_URL=http://localhost:11434/v1  # Ollama API endpoint
LLM_MODEL=llama3.2             # Model name — must be pulled with: ollama pull llama3.2
                               # Alternatives: mistral, llama3.1, qwen2.5:7b

# ── LLM — OpenAI (cloud, paid) ───────────────────────────────────────────────
# OPENAI_API_KEY=sk-proj-...
# OPENAI_BASE_URL=https://api.openai.com/v1
# LLM_MODEL=gpt-4o-mini

# ── Authentication ─────────────────────────────────────────────────────────────
JWT_SECRET_KEY=your-32-char-random-secret   # Generate: python -c "import secrets; print(secrets.token_hex(32))"
ACCESS_TOKEN_EXPIRE_MINUTES=10080           # 7 days

# ── Application ────────────────────────────────────────────────────────────────
APP_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_UPLOAD_SIZE_MB=50
```

### Switching LLM Providers

| Provider | OPENAI_API_KEY | OPENAI_BASE_URL | LLM_MODEL |
|----------|---------------|-----------------|-----------|
| Ollama (local) | `ollama` | `http://localhost:11434/v1` | `llama3.2` |
| OpenAI | `sk-proj-...` | `https://api.openai.com/v1` | `gpt-4o-mini` |
| LM Studio | `lmstudio` | `http://localhost:1234/v1` | your-model-name |
| Mistral (Ollama) | `ollama` | `http://localhost:11434/v1` | `mistral` |

---

## 12. Full Project Structure

```
Audit/
├── .gitignore
├── docker-compose.yml               ← Docker deployment config
├── README.md                        ← This file
│
├── backend/
│   ├── .env                         ← Environment variables (not in git)
│   ├── .env.example                 ← Template for .env
│   ├── requirements.txt             ← All Python dependencies
│   ├── Dockerfile                   ← Docker image for backend
│   │
│   ├── app/
│   │   ├── main.py                  ← FastAPI app, CORS, startup, health check
│   │   ├── __init__.py
│   │   │
│   │   ├── models/
│   │   │   ├── database.py          ← SQLAlchemy engine, session, init_db(), migrations
│   │   │   ├── user.py              ← User SQLAlchemy model (teachers table)
│   │   │   ├── schemas.py           ← Pydantic schemas for all request/response types
│   │   │   └── __init__.py
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py              ← Register, login, profile, password
│   │   │   ├── audit.py             ← Run audit, reports, history, stats
│   │   │   ├── documents.py         ← Upload, list, metadata
│   │   │   ├── advanced.py          ← 12 advanced AI endpoints
│   │   │   ├── insights.py          ← Courseware, evolution, resources, outline
│   │   │   ├── admin.py             ← Admin-only platform analytics
│   │   │   ├── news.py              ← RSS news proxy
│   │   │   ├── similarity.py        ← Semantic similarity search
│   │   │   ├── websocket.py         ← Real-time collaborative review
│   │   │   └── __init__.py
│   │   │
│   │   ├── services/
│   │   │   ├── llm_engine.py        ← All LLM interactions, JSON parsing, retry logic
│   │   │   ├── audit_service.py     ← Full audit pipeline orchestration
│   │   │   ├── document_ingestion.py← PDF/PPTX/DOCX text extraction + storage
│   │   │   ├── auth_service.py      ← bcrypt, JWT, user CRUD
│   │   │   ├── content_generator.py ← Exam, comprehension, freshness, module audit
│   │   │   ├── insights_service.py  ← Courseware, evolution, resources, outline
│   │   │   ├── similarity_service.py← TF-IDF cosine similarity, n-gram overlap
│   │   │   ├── vector_store.py      ← ChromaDB with custom hash embeddings
│   │   │   ├── predictive_scorer.py ← Heuristic quality prediction (no LLM)
│   │   │   ├── rag_chat.py          ← RAG retrieval + LLM chat
│   │   │   ├── pdf_export.py        ← ReportLab branded PDF generation
│   │   │   └── __init__.py
│   │   │
│   │   └── utils/
│   │       ├── config.py            ← Settings class loaded from .env
│   │       └── __init__.py
│   │
│   ├── data/                        ← Runtime data (not in git)
│   │   ├── eduaudit.db              ← SQLite database
│   │   ├── {doc_id}/text.txt        ← Extracted document text
│   │   ├── {doc_id}/metadata.json   ← Document metadata
│   │   ├── audits/{audit_id}.json   ← Audit reports
│   │   ├── evolution/{doc_id}.json  ← Score history
│   │   └── chroma_db/               ← ChromaDB vector store
│   │
│   └── uploads/                     ← Uploaded files (not in git)
│
└── frontend/
    ├── index.html                   ← Root HTML shell
    ├── package.json                 ← npm dependencies
    ├── vite.config.js               ← Vite config + /api proxy to backend
    ├── .env.example                 ← Frontend env template
    ├── .eslintrc.cjs                ← ESLint config
    ├── Dockerfile                   ← Docker image for frontend
    │
    └── src/
        ├── main.jsx                 ← React app entry point
        ├── App.jsx                  ← Router + ProtectedRoute + GuestRoute
        ├── index.css                ← Global styles, CSS variables, animations
        │
        ├── context/
        │   ├── AuthContext.jsx      ← JWT auth state, login/logout/register hooks
        │   └── LangContext.jsx      ← FR/EN language switch, t() translation function
        │
        ├── hooks/
        │   └── useAudit.js          ← Upload + audit lifecycle state management
        │
        ├── components/
        │   ├── Layout.jsx           ← Sidebar + topbar + user dropdown + FR/EN toggle
        │   ├── AuditReport.jsx      ← Full tabbed audit report component
        │   ├── ScoreCard.jsx        ← Radial SVG score gauge
        │   ├── GradeBadge.jsx       ← Grade label badge (A+/A/B/C/D/F)
        │   ├── BloomBadge.jsx       ← Bloom's taxonomy pyramid visualizer
        │   ├── RecommendationsList.jsx ← Tabbed strengths/weaknesses/recommendations
        │   ├── HistoryTable.jsx     ← Sortable searchable audit table
        │   ├── UploadZone.jsx       ← Drag-and-drop file upload zone
        │   ├── NewsFeed.jsx         ← Live news ticker + article cards
        │   └── EspritLogo.jsx       ← ESPRIT SVG wordmark component
        │
        ├── pages/
        │   ├── Login.jsx            ← Split-panel login form
        │   ├── Register.jsx         ← 2-step registration with profile setup
        │   ├── Dashboard.jsx        ← Home: stats, news, recent audits
        │   ├── NewAudit.jsx         ← Upload → configure → audit → results
        │   ├── History.jsx          ← Audit history table + report viewer
        │   ├── Profile.jsx          ← Edit profile, change password
        │   ├── ChatPage.jsx         ← RAG chat interface
        │   ├── ExamPage.jsx         ← Exam generator
        │   ├── SimilarityPage.jsx   ← Plagiarism detection
        │   ├── CoursewarePage.jsx   ← MIT/Stanford benchmark
        │   ├── EvolutionPage.jsx    ← Score evolution sparklines
        │   ├── FreshnessPage.jsx    ← Outdated content detector
        │   ├── ModuleAuditPage.jsx  ← Multi-document module audit
        │   ├── OutlinePage.jsx      ← AI course outline generator
        │   └── AdminPage.jsx        ← Admin dashboard (admin only)
        │
        └── utils/
            ├── api.js               ← All backend HTTP calls with auth headers
            └── helpers.js           ← Color helpers, date formatting, score utils
```

---

## Quick Start Summary

```powershell
# Terminal 1 — Backend
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8002

# Terminal 2 — Frontend
cd frontend
npm run dev

# Open browser
start http://localhost:5173
```

**API Documentation**: http://localhost:8002/api/docs

---

*EduAudit AI — ESPRIT · Honoris United Universities · 2026*
*Built with FastAPI · React · Ollama · SQLite · ChromaDB · ReportLab*

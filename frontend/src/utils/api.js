/**
 * API client — all backend calls for EduAudit AI.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002'
const WS_URL   = BASE_URL.replace(/^http/, 'ws')

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const b = await res.json(); msg = b.detail || b.error || msg } catch (_) {}
    throw new Error(msg)
  }
  return res.json()
}

async function requestBlob(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    headers: { 'Accept': 'application/pdf', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.blob()
}

function authHeader(token) {
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// ── Auth ───────────────────────────────────────────────────────────────────
export function login(email, password) {
  const form = new URLSearchParams()
  form.append('username', email); form.append('password', password)
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
}
export function register(fields) {
  return request('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
}
export const getMe           = (token)           => request('/api/auth/me', { headers: authHeader(token) })
export const updateProfile   = (token, fields)   => request('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader(token) }, body: JSON.stringify(fields) })
export const changePassword  = (token, op, np)   => request('/api/auth/password', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader(token) }, body: JSON.stringify({ old_password: op, new_password: np }) })

// ── Documents ──────────────────────────────────────────────────────────────
export function uploadDocument(file, token) {
  const form = new FormData(); form.append('file', file)
  return request('/api/documents/upload', { method: 'POST', body: form, headers: authHeader(token) })
}
export const getDocuments  = (token)      => request('/api/documents/',       { headers: authHeader(token) })
export const getDocument   = (id, token)  => request(`/api/documents/${id}`,  { headers: authHeader(token) })

// ── Audit ──────────────────────────────────────────────────────────────────
export const runAudit       = (docId, criteria, language, token) =>
  request('/api/audit/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader(token) }, body: JSON.stringify({ doc_id: docId, criteria, language }) })
export const getAuditReport = (id, token)   => request(`/api/audit/report/${id}`,  { headers: authHeader(token) })
export const getAuditHistory= (token)        => request('/api/audit/history',        { headers: authHeader(token) })
export const getAuditStats  = (token)        => request('/api/audit/stats',          { headers: authHeader(token) })

// ── News ───────────────────────────────────────────────────────────────────
export const getNewsFeed = () => request('/api/news/feed')

// ── Health ─────────────────────────────────────────────────────────────────
export const getHealth = () => request('/api/health')

// ═══════════════════════════════════════════════════════════════════════════
// ── Advanced Features ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const adv = (path, body, token, method='POST') =>
  request(`/api/advanced${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: body ? JSON.stringify(body) : undefined,
  })

// F1 – Similarity
export const scanSimilarity    = (docId, topK=10, token)        => adv('/similarity/scan', { doc_id: docId, top_k: topK }, token)
export const compareDocs       = (docIdA, docIdB, token)         => adv('/similarity/compare', { doc_id_a: docIdA, doc_id_b: docIdB }, token)

// F2 – Generate missing content
export const generateContent   = (docId, weaknesses, bloomLevel, language, token) =>
  adv('/generate/missing-content', { doc_id: docId, weaknesses, bloom_level: bloomLevel, language }, token)

// F3 – Module audit
export const auditModule       = (docIds, moduleName, language, token) =>
  adv('/generate/module-audit', { doc_ids: docIds, module_name: moduleName, language }, token)

// F6 – Competency alignment
export const alignCompetencies = (docId, competencies, language, token) =>
  adv('/analyze/competencies', { doc_id: docId, competencies, language }, token)

// F7 – Freshness / trend detection
export const analyzeFreshness  = (docId, language, token) =>
  adv('/analyze/freshness', { doc_id: docId, language }, token)

// F9 – PDF Export
export function downloadReportPDF(auditId, token) {
  return requestBlob(`/api/advanced/report/${auditId}/pdf`, { headers: authHeader(token) })
}

// F11 – RAG Chat
export const ragChat           = (docId, question, history, token) =>
  adv('/chat', { doc_id: docId, question, history }, token)

// F12 – Exam generator
export const generateExam      = (docId, opts, token) =>
  adv('/generate/exam', { doc_id: docId, ...opts }, token)

// F13 – Comprehension simulation
export const simulateComprehension = (docId, language, token) =>
  adv('/generate/comprehension', { doc_id: docId, language }, token)

// F14 – Multilingual recommendations
export const translateRecommendations = (recs, sourceLang, targetLangs, token) =>
  adv('/translate/recommendations', { recommendations: recs, source_language: sourceLang, target_languages: targetLangs }, token)

// F15 – Predictive score
export const predictScore      = (docId, token) =>
  request(`/api/advanced/predict/${docId}`, { headers: authHeader(token) })

// ── Admin ──────────────────────────────────────────────────────────────────
export const adminStats    = (token) => request('/api/admin/stats',    { headers: authHeader(token) })
export const adminTeachers = (token) => request('/api/admin/teachers', { headers: authHeader(token) })
export const adminRankings = (token) => request('/api/admin/rankings', { headers: authHeader(token) })
export const adminAllAudits= (token) => request('/api/admin/audits',   { headers: authHeader(token) })

// ── WebSocket helper ───────────────────────────────────────────────────────
export function createCollabWS(auditId) {
  return new WebSocket(`${WS_URL}/api/collab/ws/${auditId}`)
}
export const getCollabComments = (auditId, token) =>
  request(`/api/collab/comments/${auditId}`, { headers: authHeader(token) })


// ═══════════════════════════════════════════════════════════════════════════
// ── Insights (5 new features) ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const ins = (path, body, token, method='POST') =>
  request(`/api/insights${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: body ? JSON.stringify(body) : undefined,
  })

// F1 – Courseware comparison
export const compareCourseware = (docId, language, token) =>
  ins('/courseware-comparison', { doc_id: docId, language }, token)

// F2 – Evolution timeline
export const getEvolution      = (docId, token) =>
  request(`/api/insights/evolution/${docId}`, { headers: authHeader(token) })
export const getAllEvolutions   = (token) =>
  request('/api/insights/evolution', { headers: authHeader(token) })

// F3 – Related resources
export const getRelatedResources = (docId, language, token) =>
  ins('/related-resources', { doc_id: docId, language }, token)

// F4 – Collaboration suggestions
export const getCollabSuggestions = (docId, token) =>
  ins('/collaboration', { doc_id: docId }, token)

// F5 – Custom rubrics
export const createRubric  = (data, token) => ins('/rubrics', data, token)
export const listRubrics   = (token) => request('/api/insights/rubrics', { headers: authHeader(token) })
export const getRubric     = (id, token) => request(`/api/insights/rubrics/${id}`, { headers: authHeader(token) })
export const deleteRubric  = (id, token) => request(`/api/insights/rubrics/${id}`, { method: 'DELETE', headers: authHeader(token) })
export const auditWithRubric = (docId, rubricId, language, token) =>
  ins('/rubrics/audit', { doc_id: docId, rubric_id: rubricId, language }, token)


// FB – Course Outline Generator
export const generateCourseOutline = (data, token) =>
  ins('/generate-outline', data, token)

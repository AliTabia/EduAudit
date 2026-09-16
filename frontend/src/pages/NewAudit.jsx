import React, { useState } from 'react'
import UploadZone from '../components/UploadZone'
import AuditReport from '../components/AuditReport'
import { useAudit } from '../hooks/useAudit'

const CRITERIA_OPTIONS = [
  {
    id: 'pedagogical_coherence',
    label: 'Pedagogical Coherence',
    desc: 'Analyzes alignment between learning objectives, content, and assessments using Bloom\'s Taxonomy.',
    icon: '📚',
  },
  {
    id: 'writing_quality',
    label: 'Writing Quality',
    desc: 'Evaluates clarity, structure, readability, spelling, and grammar of the document.',
    icon: '✍️',
  },
]

const LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'fr',   label: 'French' },
  { value: 'en',   label: 'English' },
]

function StepIndicator({ step }) {
  const steps = [
    { id: 'idle',      label: 'Upload',   icon: '1' },
    { id: 'uploaded',  label: 'Configure',icon: '2' },
    { id: 'auditing',  label: 'Analyzing',icon: '3' },
    { id: 'done',      label: 'Results',  icon: '4' },
  ]
  const currentIdx = steps.findIndex(s =>
    step === 'idle' ? s.id === 'idle' :
    step === 'uploading' ? s.id === 'idle' :
    step === 'uploaded' ? s.id === 'uploaded' :
    step === 'auditing' ? s.id === 'auditing' :
    s.id === 'done'
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => {
        const done    = i < currentIdx
        const active  = i === currentIdx
        const pending = i > currentIdx
        return (
          <React.Fragment key={s.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
                background: done ? '#16a34a' : active ? 'var(--color-primary)' : 'var(--color-border)',
                color: done || active ? '#fff' : 'var(--color-text-muted)',
                transition: 'all var(--transition)',
              }}>
                {done ? '✓' : s.icon}
              </div>
              <span style={{
                fontSize: 11, fontWeight: active ? 600 : 400,
                color: active ? 'var(--color-primary)' : done ? '#16a34a' : 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginTop: -16,
                background: i < currentIdx ? '#16a34a' : 'var(--color-border)',
                transition: 'background var(--transition)',
                minWidth: 32,
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default function NewAudit() {
  const { uploading, auditing, uploadedDoc, auditReport, error, step, upload, audit, reset } = useAudit()
  const [selectedCriteria, setSelectedCriteria] = useState(['pedagogical_coherence', 'writing_quality'])
  const [language, setLanguage] = useState('auto')

  const toggleCriterion = (id) => {
    setSelectedCriteria(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleFile = async (file) => {
    await upload(file)
  }

  const handleRunAudit = async () => {
    if (!uploadedDoc || selectedCriteria.length === 0) return
    await audit(uploadedDoc.doc_id, selectedCriteria, language)
  }

  if (auditReport) {
    return (
      <div>
        <StepIndicator step="done" />
        <AuditReport report={auditReport} onNewAudit={reset} />
      </div>
    )
  }

  return (
    <div>
      <StepIndicator step={step} />

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 10, padding: '14px 18px', marginBottom: 20,
          fontSize: 14, color: '#b91c1c', display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Error</div>
            <div>{error}</div>
            <button onClick={reset} style={{
              marginTop: 8, background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: 13,
            }}>← Start over</button>
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      {(step === 'idle' || step === 'uploading' || step === 'error') && (
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Upload Document</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}>
            Upload a PDF, PPTX, or DOCX educational document to audit.
          </p>
          <UploadZone onFile={handleFile} disabled={uploading} />
          {uploading && (
            <div style={{ textAlign: 'center', marginTop: 16, color: 'var(--color-text-muted)', fontSize: 14 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>⏳</div>
              Extracting text from your document...
            </div>
          )}
        </div>
      )}

      {/* Step 2: Configure & run */}
      {step === 'uploaded' && uploadedDoc && (
        <div>
          {/* Document info */}
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 10, padding: '14px 18px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#15803d' }}>Document uploaded successfully</div>
              <div style={{ fontSize: 13, color: '#166534', marginTop: 2 }}>
                <strong>{uploadedDoc.filename}</strong> · {uploadedDoc.word_count?.toLocaleString()} words · {uploadedDoc.page_count} pages · {uploadedDoc.format?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Audit criteria */}
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Select Audit Criteria</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16 }}>
            Choose which dimensions to analyze. At least one must be selected.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {CRITERIA_OPTIONS.map(opt => {
              const checked = selectedCriteria.includes(opt.id)
              return (
                <div
                  key={opt.id}
                  onClick={() => toggleCriterion(opt.id)}
                  style={{
                    border: `2px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    cursor: 'pointer',
                    background: checked ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    transition: 'all var(--transition)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 22 }}>{opt.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</span>
                    <span style={{
                      marginLeft: 'auto', width: 20, height: 20, borderRadius: 4,
                      border: `2px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: checked ? 'var(--color-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                    }}>
                      {checked && '✓'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
              )
            })}
          </div>

          {/* Language */}
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Document Language</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {LANGUAGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value)}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  border: `2px solid ${language === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: language === opt.value ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  color: language === opt.value ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: language === opt.value ? 600 : 400,
                  fontSize: 13, cursor: 'pointer', transition: 'all var(--transition)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Run button */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={reset}
              style={{
                padding: '12px 24px', borderRadius: 10,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-muted)',
                fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              ← Upload Different File
            </button>
            <button
              onClick={handleRunAudit}
              disabled={selectedCriteria.length === 0}
              style={{
                flex: 1, padding: '12px 24px', borderRadius: 10,
                background: selectedCriteria.length > 0 ? 'var(--color-primary)' : '#ccc',
                color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 600, cursor: selectedCriteria.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)',
              }}
              onMouseEnter={e => { if (selectedCriteria.length > 0) e.currentTarget.style.background = 'var(--color-primary-dark)' }}
              onMouseLeave={e => { if (selectedCriteria.length > 0) e.currentTarget.style.background = 'var(--color-primary)' }}
            >
              🔍 Run Audit
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Analyzing */}
      {step === 'auditing' && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🤖</div>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Analyzing Your Document</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto 24px' }}>
            The AI is performing a deep pedagogical and writing quality analysis. This typically takes 15–45 seconds.
          </p>
          <div style={{
            display: 'flex', gap: 8, justifyContent: 'center',
            animation: 'pulse 1.5s infinite',
          }}>
            {['Extracting content...', 'Analyzing pedagogy...', 'Evaluating writing...', 'Generating report...'].map((msg, i) => (
              <div key={i} style={{
                padding: '6px 14px',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                borderRadius: 20, fontSize: 12, fontWeight: 500,
                opacity: 0.7 + i * 0.1,
                animation: `fadeIn 0.5s ease ${i * 0.3}s both`,
              }}>
                {msg}
              </div>
            ))}
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
          `}</style>
        </div>
      )}
    </div>
  )
}

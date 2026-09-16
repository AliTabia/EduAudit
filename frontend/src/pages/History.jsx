import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import HistoryTable from '../components/HistoryTable'
import AuditReport from '../components/AuditReport'
import { useHistory, useAudit } from '../hooks/useAudit'

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { history, stats, loading, error, refresh } = useHistory()
  const { auditReport, loadReport } = useAudit()
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportError, setReportError] = useState(null)

  const auditId = searchParams.get('audit')

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (auditId) {
      setLoadingReport(true)
      setReportError(null)
      loadReport(auditId)
        .catch(e => setReportError(e.message))
        .finally(() => setLoadingReport(false))
    }
  }, [auditId])

  const handleViewReport = (id) => {
    setSearchParams({ audit: id })
  }

  const handleBackToHistory = () => {
    setSearchParams({})
  }

  // Show individual report
  if (auditId) {
    return (
      <div>
        <button
          onClick={handleBackToHistory}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--color-text-muted)', fontSize: 14,
            marginBottom: 24, padding: 0,
          }}
        >
          ← Back to History
        </button>

        {loadingReport && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            Loading report...
          </div>
        )}
        {reportError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 10, padding: '14px 18px', color: '#b91c1c', fontSize: 14,
          }}>
            Error loading report: {reportError}
          </div>
        )}
        {auditReport && !loadingReport && (
          <AuditReport report={auditReport} onNewAudit={() => navigate('/audit')} />
        )}
      </div>
    )
  }

  // Show history table
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)' }}>Audit History</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            {stats?.total_audits ?? 0} audit{stats?.total_audits !== 1 ? 's' : ''} · Average score:{' '}
            <strong>{stats?.average_global_score != null ? `${stats.average_global_score}/10` : '—'}</strong>
          </p>
        </div>
        <button
          onClick={() => navigate('/audit')}
          style={{
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 10,
            padding: '10px 22px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-dark)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
        >
          ＋ New Audit
        </button>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#b91c1c',
        }}>
          {error}
        </div>
      )}

      <HistoryTable history={history} onViewReport={handleViewReport} loading={loading} />
    </div>
  )
}

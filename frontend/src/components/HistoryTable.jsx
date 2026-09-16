import React, { useState } from 'react'
import GradeBadge from './GradeBadge'
import { scoreColor, formatDate } from '../utils/helpers'

function ScorePill({ score }) {
  const color = scoreColor(score)
  return (
    <span style={{
      fontWeight: 700, fontSize: 13,
      color,
      background: `${color}18`,
      padding: '3px 10px',
      borderRadius: 6,
    }}>
      {score?.toFixed(1)}
    </span>
  )
}

export default function HistoryTable({ history = [], onViewReport, loading }) {
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [search, setSearch]   = useState('')

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = history
    .filter(a => a.filename?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey]
      if (typeof va === 'string') va = va.toLowerCase(), vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const SortBtn = ({ col, label }) => (
    <button onClick={() => toggleSort(col)} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontWeight: 600, fontSize: 12,
      color: sortKey === col ? 'var(--color-primary)' : 'var(--color-text-muted)',
      display: 'flex', alignItems: 'center', gap: 4,
      padding: 0,
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      {label}
      <span style={{ opacity: sortKey === col ? 1 : 0.3 }}>
        {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  )

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Toolbar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <input
          type="text"
          placeholder="Search by filename..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 8, fontSize: 13,
            outline: 'none', color: 'var(--color-text)',
            background: 'var(--color-bg)',
          }}
        />
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} audit{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading history...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No audits found</div>
          <div style={{ fontSize: 13 }}>Run your first audit to see results here.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                {[
                  { col: 'filename',              label: 'Document' },
                  { col: 'global_score',          label: 'Score' },
                  { col: 'grade',                 label: 'Grade' },
                  { col: 'status',                label: 'Status' },
                  { col: 'processing_time_seconds', label: 'Time' },
                  { col: 'created_at',            label: 'Date' },
                  { col: null,                    label: 'Actions' },
                ].map(({ col, label }) => (
                  <th key={label} style={{
                    padding: '12px 16px', textAlign: 'left',
                    borderBottom: '1px solid var(--color-border)',
                  }}>
                    {col ? <SortBtn col={col} label={label} /> : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {label}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.audit_id} style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)',
                  transition: 'background var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-light)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--color-text)', maxWidth: 260 }}>
                      <span title={item.filename}>
                        {item.filename?.length > 40 ? item.filename.slice(0, 37) + '...' : item.filename}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 2 }}>
                      {item.audit_id?.slice(0, 8)}…
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <ScorePill score={item.global_score} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <GradeBadge grade={item.grade} size="sm" />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: item.status === 'completed' ? '#16a34a' : '#d97706',
                      background: item.status === 'completed' ? '#f0fdf4' : '#fffbeb',
                      padding: '2px 8px', borderRadius: 4,
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {item.processing_time_seconds?.toFixed(1)}s
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(item.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => onViewReport(item.audit_id)}
                      style={{
                        background: 'var(--color-primary)',
                        color: '#fff', border: 'none',
                        borderRadius: 6, padding: '5px 12px',
                        fontSize: 12, fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-dark)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import React, { useState } from 'react'

const PRIORITY_COLORS = [
  { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', label: 'High' },
  { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', label: 'High' },
  { bg: '#fffbeb', border: '#fde68a', text: '#b45309', label: 'Medium' },
  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', label: 'Medium' },
  { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', label: 'Low' },
]

function RecommendationItem({ text, index, type = 'recommendation' }) {
  const style = PRIORITY_COLORS[Math.min(index, PRIORITY_COLORS.length - 1)]
  const icon = type === 'strength' ? '✓' : type === 'weakness' ? '⚠' : '→'
  const itemStyle = type === 'strength'
    ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' }
    : type === 'weakness'
    ? { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' }
    : style

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      padding: '10px 14px',
      background: itemStyle.bg,
      border: `1px solid ${itemStyle.border}`,
      borderRadius: 8,
      marginBottom: 6,
    }}>
      <span style={{
        fontSize: 13, fontWeight: 700,
        color: itemStyle.text,
        flexShrink: 0, marginTop: 1,
      }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

export default function RecommendationsList({ recommendations = [], strengths = [], weaknesses = [], title }) {
  const [tab, setTab] = useState('recs')

  const tabs = [
    { id: 'recs',      label: `Recommendations (${recommendations.length})` },
    { id: 'strengths', label: `Strengths (${strengths.length})` },
    { id: 'weaknesses',label: `Weaknesses (${weaknesses.length})` },
  ]

  const activeItems = tab === 'recs' ? recommendations : tab === 'strengths' ? strengths : weaknesses
  const itemType    = tab === 'recs' ? 'recommendation' : tab === 'strengths' ? 'strength' : 'weakness'

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {title && (
        <div style={{
          padding: '16px 20px 0',
          fontWeight: 700, fontSize: 15,
          color: 'var(--color-text)',
        }}>{title}</div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 0,
        padding: '12px 20px 0',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 14px 10px',
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: 'var(--transition)',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px' }}>
        {activeItems.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
            No items in this category.
          </div>
        ) : (
          activeItems.map((item, i) => (
            <RecommendationItem key={i} text={item} index={i} type={itemType} />
          ))
        )}
      </div>
    </div>
  )
}

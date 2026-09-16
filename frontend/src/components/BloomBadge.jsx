import React from 'react'
import { bloomLevelColor } from '../utils/helpers'

const BLOOM_ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']

export default function BloomBadge({ analysis }) {
  if (!analysis) return null
  const { detected_level, detected_verbs = [], objectives_found = [], alignment_score, commentary } = analysis

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
        🧠 Bloom's Taxonomy Analysis
      </div>

      {/* Pyramid levels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        {[...BLOOM_ORDER].reverse().map((level, i) => {
          const active = level === detected_level
          const color = bloomLevelColor(level)
          const width = 40 + (BLOOM_ORDER.indexOf(level) / (BLOOM_ORDER.length - 1)) * 60

          return (
            <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: `${width}%`,
                padding: '5px 12px',
                borderRadius: 6,
                background: active ? color : `${color}22`,
                border: active ? `2px solid ${color}` : `1px solid ${color}44`,
                fontSize: 12,
                fontWeight: active ? 700 : 400,
                color: active ? '#fff' : color,
                transition: 'all var(--transition)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>{level}</span>
                {active && <span>◀ detected</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Detected Verbs
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {detected_verbs.length > 0 ? detected_verbs.map(v => (
              <span key={v} style={{
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                borderRadius: 4, padding: '2px 8px', fontSize: 12,
              }}>{v}</span>
            )) : <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>None detected</span>}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Alignment Score
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#2563eb' }}>
            {typeof alignment_score === 'number' ? alignment_score.toFixed(1) : '—'}/10
          </div>
        </div>
      </div>

      {/* Learning objectives */}
      {objectives_found.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Learning Objectives Found
          </div>
          {objectives_found.map((obj, i) => (
            <div key={i} style={{
              fontSize: 12, color: 'var(--color-text)',
              padding: '5px 10px', borderLeft: '3px solid #7c3aed',
              background: '#faf5ff', borderRadius: '0 4px 4px 0',
              marginBottom: 4,
            }}>
              {obj}
            </div>
          ))}
        </div>
      )}

      {/* Commentary */}
      {commentary && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: 'var(--color-bg)', borderRadius: 8,
          fontSize: 13, color: 'var(--color-text-muted)',
          lineHeight: 1.5,
          borderLeft: '3px solid var(--color-border)',
        }}>
          {commentary}
        </div>
      )}
    </div>
  )
}

import React from 'react'
import { scoreColor, scoreBg, scoreToPercent } from '../utils/helpers'

/**
 * ScoreCard — displays a single metric score with a radial progress indicator.
 */
export default function ScoreCard({ label, score, max = 10, icon, subtitle, size = 'md' }) {
  const pct = scoreToPercent(score, max)
  const color = scoreColor(score)
  const bg = scoreBg(score)

  const radius = size === 'lg' ? 44 : 34
  const stroke = size === 'lg' ? 6 : 5
  const circ = 2 * Math.PI * radius
  const dash = (pct / 100) * circ

  const svgSize = (radius + stroke) * 2 + 4
  const center = svgSize / 2

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: size === 'lg' ? '28px 24px' : '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow var(--transition)',
      minWidth: size === 'lg' ? 180 : 140,
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* Radial gauge */}
      <div style={{ position: 'relative', width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={bg} strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        {/* Center content */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 1,
        }}>
          {icon && <span style={{ fontSize: size === 'lg' ? 18 : 14 }}>{icon}</span>}
          <span style={{
            fontWeight: 700,
            fontSize: size === 'lg' ? 22 : 17,
            color,
            lineHeight: 1,
          }}>
            {typeof score === 'number' ? score.toFixed(1) : '—'}
          </span>
        </div>
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 600, fontSize: size === 'lg' ? 14 : 12, color: 'var(--color-text)' }}>
          {label}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Score bar */}
      <div style={{
        width: '100%', height: 4,
        background: 'var(--color-border)',
        borderRadius: 99, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color,
          borderRadius: 99,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-light)' }}>
        {typeof score === 'number' ? score.toFixed(1) : '—'} / {max}
      </div>
    </div>
  )
}

import React from 'react'
import { gradeBadgeColor } from '../utils/helpers'

export default function GradeBadge({ grade, size = 'md' }) {
  const { bg, text, border } = gradeBadgeColor(grade)
  const fontSize = size === 'lg' ? 28 : size === 'sm' ? 12 : 16
  const padding  = size === 'lg' ? '12px 20px' : size === 'sm' ? '2px 8px' : '6px 14px'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: bg, color: text,
      border: `1.5px solid ${border}`,
      borderRadius: 8,
      fontWeight: 700,
      fontSize,
      padding,
      letterSpacing: '0.5px',
      lineHeight: 1,
    }}>
      {grade}
    </span>
  )
}

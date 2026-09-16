/**
 * Shared helper utilities.
 */

export function scoreColor(score) {
  if (score >= 8)  return '#16a34a'
  if (score >= 6)  return '#2563eb'
  if (score >= 4)  return '#d97706'
  return '#D01012'
}

export function scoreBg(score) {
  if (score >= 8)  return '#f0fdf4'
  if (score >= 6)  return '#eff6ff'
  if (score >= 4)  return '#fffbeb'
  return '#fdf1f1'
}

export function gradeBadgeColor(grade) {
  if (grade?.startsWith('A')) return { bg:'#f0fdf4', text:'#15803d', border:'#bbf7d0' }
  if (grade?.startsWith('B')) return { bg:'#eff6ff', text:'#1d4ed8', border:'#bfdbfe' }
  if (grade?.startsWith('C')) return { bg:'#fffbeb', text:'#b45309', border:'#fde68a' }
  if (grade?.startsWith('D')) return { bg:'#fff7ed', text:'#c2410c', border:'#fed7aa' }
  return { bg:'#fdf1f1', text:'#D01012', border:'#fecaca' }
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatFileSize(kb) {
  if (!kb) return '—'
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function bloomLevelColor(level) {
  const map = {
    Remember:   '#94a3b8',
    Understand: '#60a5fa',
    Apply:      '#34d399',
    Analyze:    '#a78bfa',
    Evaluate:   '#fb923c',
    Create:     '#f472b6',
    Unknown:    '#cbd5e1',
  }
  return map[level] || '#cbd5e1'
}

export function scoreToPercent(score, max = 10) {
  return Math.min(100, Math.max(0, (score / max) * 100))
}

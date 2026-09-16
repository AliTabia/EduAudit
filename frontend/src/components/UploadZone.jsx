import React, { useCallback, useState } from 'react'

const ACCEPTED = ['.pdf', '.pptx', '.docx']
const ACCEPT_STR = ACCEPTED.join(',')

export default function UploadZone({ onFile, disabled }) {
  const [drag, setDrag] = useState(false)

  const handleFile = useCallback((file) => {
    if (!file) return
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ACCEPTED.includes(ext)) {
      alert(`Unsupported format. Please upload a PDF, PPTX, or DOCX file.`)
      return
    }
    onFile(file)
  }, [onFile])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDrag(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }, [handleFile, disabled])

  const onInputChange = (e) => handleFile(e.target.files?.[0])

  return (
    <div
      onDragOver={e => { e.preventDefault(); if (!disabled) setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${drag ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '48px 32px',
        textAlign: 'center',
        background: drag ? 'var(--color-primary-light)' : 'var(--color-surface)',
        transition: 'all var(--transition)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
      onClick={() => !disabled && document.getElementById('file-input').click()}
    >
      <input
        id="file-input"
        type="file"
        accept={ACCEPT_STR}
        style={{ display: 'none' }}
        onChange={onInputChange}
        disabled={disabled}
      />

      <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-text)', marginBottom: 6 }}>
        {drag ? 'Drop your file here' : 'Drag & drop your document'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        or click to browse
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {ACCEPTED.map(ext => (
          <span key={ext} style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            padding: '3px 10px',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
          }}>
            {ext.replace('.', '')}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 10 }}>
        Maximum file size: 50 MB
      </div>
    </div>
  )
}

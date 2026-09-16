import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments, analyzeFreshness } from '../utils/api'

const SEV_MAP = { high:{bg:'#fef2f2',border:'#fecaca',text:'#b91c1c',label:'High'}, medium:{bg:'#fffbeb',border:'#fde68a',text:'#b45309',label:'Medium'}, low:{bg:'#eff6ff',border:'#bfdbfe',text:'#1d4ed8',label:'Low'} }

export default function FreshnessPage() {
  const { token } = useAuth()
  const [docs, setDocs]     = useState([])
  const [docId, setDocId]   = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => { getDocuments(token).then(d => setDocs(d.documents || [])).catch(() => {}) }, [token])

  const run = async () => {
    if (!docId) return
    setLoading(true); setError(''); setResult(null)
    try { setResult(await analyzeFreshness(docId, 'auto', token)) }
    catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const verdictColor = result?.overall_verdict === 'cutting-edge' ? '#059669' : result?.overall_verdict === 'up-to-date' ? '#2563eb' : result?.overall_verdict === 'slightly-dated' ? '#d97706' : '#D01012'

  return (
    <div className="fade-in-up">
      <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 }}>🔍 AI Trend & Freshness Detector</h1>
      <p style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>Identify outdated technologies, deprecated concepts, and missing recent developments in your course content.</p>

      <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px', marginBottom:24, display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block', marginBottom:6 }}>Select Document</label>
          <select value={docId} onChange={e=>setDocId(e.target.value)} style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid #e4e8ef', fontSize:13, fontFamily:'inherit', background:'#fafbfc', width:'100%' }}>
            <option value="">— Choose a document —</option>
            {docs.map(d=><option key={d.doc_id} value={d.doc_id}>{d.filename}</option>)}
          </select>
        </div>
        <button onClick={run} disabled={!docId||loading} style={{ padding:'11px 24px', background:'linear-gradient(135deg,#D01012,#a80d0f)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:(!docId||loading)?'not-allowed':'pointer', opacity:(!docId||loading)?.6:1, boxShadow:'0 4px 14px rgba(208,16,18,.25)' }}>
          {loading ? '⏳ Analyzing…' : '⚡ Analyze Freshness'}
        </button>
      </div>

      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', color:'#b91c1c', fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}

      {result && (
        <div className="fade-in-up">
          {/* Score card */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
            {[
              { label:'Freshness Score', value:`${result.freshness_score}/10`, icon:'📅', accent:verdictColor },
              { label:'Content Vintage', value:result.estimated_content_year||'Unknown', icon:'🗓️', accent:'#7c3aed' },
              { label:'Issues Found',   value:result.outdated_items?.length||0, icon:'⚠️', accent:'#d97706' },
              { label:'Missing Topics', value:result.missing_topics?.length||0, icon:'📋', accent:'#0891b2' },
            ].map(s => (
              <div key={s.label} style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'18px 22px', display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                <span style={{ fontSize:26 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, color:s.accent }}>{s.value}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Verdict */}
          <div style={{ background:`${verdictColor}12`, border:`1.5px solid ${verdictColor}30`, borderRadius:14, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:28 }}>{result.freshness_score>=8?'✅':result.freshness_score>=6?'🟡':'🔴'}</span>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:verdictColor, textTransform:'capitalize' }}>{result.overall_verdict?.replace(/-/g,' ')}</div>
              <div style={{ fontSize:13, color:'#374151' }}>Estimated content era: {result.estimated_content_year}</div>
            </div>
          </div>

          {/* Outdated items */}
          {result.outdated_items?.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, overflow:'hidden', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f2f7', fontWeight:700, fontSize:15 }}>⚠️ Outdated Content ({result.outdated_items.length})</div>
              {result.outdated_items.map((item, i) => {
                const sev = SEV_MAP[item.severity] || SEV_MAP.medium
                return (
                  <div key={i} style={{ padding:'14px 20px', borderBottom:'1px solid #f4f6f9', display:'flex', gap:14, flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>{item.item}</span>
                        <span style={{ fontSize:10, fontWeight:700, background:sev.bg, color:sev.text, border:`1px solid ${sev.border}`, borderRadius:4, padding:'1px 7px' }}>{sev.label}</span>
                      </div>
                      <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>{item.issue}</div>
                      {item.excerpt && <div style={{ fontSize:11, color:'#9aa3b5', fontStyle:'italic', background:'#f8fafc', padding:'4px 8px', borderRadius:6 }}>"{item.excerpt}"</div>}
                    </div>
                    {item.suggested_replacement && (
                      <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 12px', minWidth:140 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'#15803d', marginBottom:2 }}>MODERN ALTERNATIVE</div>
                        <div style={{ fontSize:12, color:'#15803d' }}>{item.suggested_replacement}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Missing topics + recommendations */}
          {(result.missing_topics?.length > 0 || result.currency_recommendations?.length > 0) && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {result.missing_topics?.length > 0 && (
                <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>📋 Missing Recent Topics</div>
                  {result.missing_topics.map((t,i) => (
                    <div key={i} style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid #f4f6f9', fontSize:13, color:'#374151' }}>
                      <span style={{ color:'#d97706' }}>→</span> {t}
                    </div>
                  ))}
                </div>
              )}
              {result.currency_recommendations?.length > 0 && (
                <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>💡 Update Recommendations</div>
                  {result.currency_recommendations.map((r,i) => (
                    <div key={i} style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid #f4f6f9', fontSize:13, color:'#374151' }}>
                      <span style={{ color:'#D01012' }}>✓</span> {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments, auditModule } from '../utils/api'
import ScoreCard from '../components/ScoreCard'
import { scoreColor } from '../utils/helpers'

export default function ModuleAuditPage() {
  const { token } = useAuth()
  const [docs, setDocs]       = useState([])
  const [selected, setSelected] = useState([])
  const [moduleName, setModuleName] = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => { getDocuments(token).then(d => setDocs(d.documents || [])).catch(() => {}) }, [token])

  const toggle = (docId) => setSelected(s => s.includes(docId) ? s.filter(id=>id!==docId) : [...s, docId])

  const run = async () => {
    if (selected.length < 2 || !moduleName.trim()) return
    setLoading(true); setError(''); setResult(null)
    try { setResult(await auditModule(selected, moduleName, 'auto', token)) }
    catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const bloomColors = { Remember:'#94a3b8', Understand:'#60a5fa', Apply:'#34d399', Analyze:'#a78bfa', Evaluate:'#fb923c', Create:'#f472b6', Unknown:'#cbd5e1' }

  return (
    <div className="fade-in-up">
      <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 }}>📚 Multi-Document Module Audit</h1>
      <p style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>Audit a full course module — check progression, Bloom escalation, redundancy, and coverage gaps across multiple documents.</p>

      <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px', marginBottom:24, boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block', marginBottom:6 }}>Module Name</label>
          <input value={moduleName} onChange={e=>setModuleName(e.target.value)} placeholder="e.g. Introduction to Machine Learning — S3"
            style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid #e4e8ef', fontSize:13, fontFamily:'inherit', width:'100%', maxWidth:400 }} />
        </div>

        <div style={{ fontWeight:600, fontSize:13, color:'#374151', marginBottom:10 }}>
          Select Documents for Module ({selected.length} selected — min. 2)
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8, marginBottom:16 }}>
          {docs.map((d,i) => {
            const sel = selected.includes(d.doc_id)
            const pos = selected.indexOf(d.doc_id)
            return (
              <div key={d.doc_id} onClick={()=>toggle(d.doc_id)} style={{
                padding:'12px 14px', borderRadius:10, cursor:'pointer',
                border:`2px solid ${sel?'#D01012':'#e4e8ef'}`,
                background:sel?'#fdf1f1':'#fafbfc',
                transition:'all .15s', display:'flex', alignItems:'center', gap:10,
              }}>
                <div style={{ width:26, height:26, borderRadius:6, background:sel?'#D01012':'#e4e8ef', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:sel?'#fff':'#9aa3b5', flexShrink:0 }}>
                  {sel ? pos+1 : i+1}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:12, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.filename}</div>
                  <div style={{ fontSize:10, color:'#9aa3b5', marginTop:2 }}>{d.word_count?.toLocaleString()} words · {d.format?.toUpperCase()}</div>
                </div>
                {sel && <span style={{ color:'#D01012', fontSize:16 }}>✓</span>}
              </div>
            )
          })}
          {docs.length === 0 && <div style={{ color:'#9aa3b5', fontSize:13, gridColumn:'1/-1' }}>No documents uploaded yet.</div>}
        </div>

        <button onClick={run} disabled={selected.length<2||!moduleName.trim()||loading} style={{
          padding:'11px 28px', background:'linear-gradient(135deg,#D01012,#a80d0f)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700,
          cursor:(selected.length<2||!moduleName.trim()||loading)?'not-allowed':'pointer',
          opacity:(selected.length<2||!moduleName.trim()||loading)?.55:1,
          boxShadow:'0 4px 14px rgba(208,16,18,.25)',
        }}>
          {loading ? '⏳ Auditing Module…' : `📚 Audit Module (${selected.length} docs)`}
        </button>
        {selected.length < 2 && <span style={{ fontSize:12, color:'#9aa3b5', marginLeft:12 }}>Select at least 2 documents</span>}
      </div>

      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', color:'#b91c1c', fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}

      {result && (
        <div className="fade-in-up">
          {/* Header */}
          <div style={{ background:'linear-gradient(120deg,#D01012,#870a0c)', borderRadius:16, padding:'22px 28px', marginBottom:20, color:'#fff' }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:'1px' }}>Module Audit Report</div>
            <div style={{ fontSize:20, fontWeight:800 }}>{result.module_name}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', marginTop:4 }}>{result.doc_count} documents · Processed in {result.processing_time}s</div>
          </div>

          {/* Scores */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:20 }}>
            <ScoreCard label="Module Score"  score={result.module_score}  icon="📚" size="lg" />
            <ScoreCard label="Progression"   score={result.progression_score}   icon="📈" />
            <ScoreCard label="Bloom Escalation" score={result.bloom_escalation_score} icon="🧠" />
            <ScoreCard label="Coherence"     score={result.coherence_score}     icon="🔗" />
            <ScoreCard label="No Redundancy" score={result.redundancy_score}    icon="♻️" />
          </div>

          {/* Summary */}
          {result.executive_summary && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'20px 24px', marginBottom:20, borderLeft:'4px solid #D01012', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>Executive Summary</div>
              <div style={{ fontSize:13, color:'#374151', lineHeight:1.7 }}>{result.executive_summary}</div>
            </div>
          )}

          {/* Document order assessment */}
          {result.document_order_assessment?.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, overflow:'hidden', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid #f0f2f7', fontWeight:700, fontSize:14 }}>Document Progression Assessment</div>
              {result.document_order_assessment.map((d, i) => (
                <div key={i} style={{ padding:'12px 20px', borderBottom:'1px solid #f4f6f9', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'#f4f6f9', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13 }}>
                    {d.suggested_position || i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{d.filename}</div>
                    {d.comment && <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{d.comment}</div>}
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, background:`${bloomColors[d.bloom_level]||'#e2e8f0'}22`, color:bloomColors[d.bloom_level]||'#64748b', borderRadius:6, padding:'3px 9px' }}>
                    {d.bloom_level}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Issues & recommendations */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {result.coverage_gaps?.length > 0 && (
              <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>📋 Coverage Gaps</div>
                {result.coverage_gaps.map((g,i)=>(<div key={i} style={{ fontSize:13, color:'#374151', padding:'5px 0', borderBottom:'1px solid #f4f6f9', display:'flex', gap:8 }}><span style={{ color:'#d97706' }}>⚠</span>{g}</div>))}
              </div>
            )}
            {result.module_recommendations?.length > 0 && (
              <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>💡 Recommendations</div>
                {result.module_recommendations.map((r,i)=>(<div key={i} style={{ fontSize:13, color:'#374151', padding:'5px 0', borderBottom:'1px solid #f4f6f9', display:'flex', gap:8 }}><span style={{ color:'#D01012' }}>→</span>{r}</div>))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

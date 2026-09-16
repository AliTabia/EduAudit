import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments, scanSimilarity, compareDocs } from '../utils/api'

function SimilarityMeter({ pct, color }) {
  return (
    <div style={{ position:'relative', height:8, background:'#f0f2f7', borderRadius:99, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:99, transition:'width .6s ease' }}/>
    </div>
  )
}

function VerdictBadge({ verdict, label, color }) {
  return (
    <span style={{
      fontSize:11, fontWeight:700, letterSpacing:'0.4px',
      background:`${color}18`, color, borderRadius:6, padding:'3px 10px',
    }}>{label}</span>
  )
}

export default function SimilarityPage() {
  const { token } = useAuth()
  const [docs, setDocs]       = useState([])
  const [selectedDoc, setSelected] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [mode, setMode]       = useState('scan') // scan | compare
  const [docB, setDocB]       = useState('')
  const [compareResult, setCompareResult] = useState(null)

  useEffect(() => {
    getDocuments(token).then(d => setDocs(d.documents || [])).catch(() => {})
  }, [token])

  const runScan = async () => {
    if (!selectedDoc) return
    setLoading(true); setError(''); setResults(null)
    try {
      const r = await scanSimilarity(selectedDoc, 10, token)
      setResults(r)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const runCompare = async () => {
    if (!selectedDoc || !docB) return
    setLoading(true); setError(''); setCompareResult(null)
    try {
      const r = await compareDocs(selectedDoc, docB, token)
      setCompareResult(r)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const sel = { padding:'10px 14px', borderRadius:10, border:'1.5px solid #e4e8ef', fontSize:13, fontFamily:'inherit', background:'#fafbfc', width:'100%' }
  const btn = { padding:'10px 24px', background:'linear-gradient(135deg,#D01012,#a80d0f)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(208,16,18,.25)' }

  return (
    <div className="fade-in-up">
      <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:6 }}>AI Similarity & Plagiarism Engine</h1>
      <p style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>Detect duplicate or overlapping content across your document corpus using TF-IDF analysis.</p>

      {/* Mode tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, background:'#f4f6f9', borderRadius:12, padding:6, width:'fit-content' }}>
        {[{id:'scan',label:'📡 Corpus Scan'},{id:'compare',label:'⚖️ Compare Two'}].map(m => (
          <button key={m.id} onClick={()=>setMode(m.id)} style={{
            background:mode===m.id?'#fff':'transparent', border:'none', cursor:'pointer',
            padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:mode===m.id?700:500,
            color:mode===m.id?'#D01012':'#5a6478', boxShadow:mode===m.id?'0 1px 4px rgba(0,0,0,.08)':'none',
            transition:'all .15s',
          }}>{m.label}</button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px', marginBottom:24, boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
        {docs.length === 0 ? (
          <div style={{ color:'#9aa3b5', fontSize:14 }}>No documents uploaded yet. Upload a document first.</div>
        ) : mode === 'scan' ? (
          <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200 }}>
              <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block', marginBottom:6 }}>Select Document to Scan</label>
              <select value={selectedDoc} onChange={e=>setSelected(e.target.value)} style={sel}>
                <option value="">— Choose a document —</option>
                {docs.map(d=><option key={d.doc_id} value={d.doc_id}>{d.filename}</option>)}
              </select>
            </div>
            <button onClick={runScan} disabled={!selectedDoc||loading} style={{...btn, opacity:!selectedDoc||loading?.6:1}}>
              {loading ? '🔍 Scanning…' : '🔍 Scan Corpus'}
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:180 }}>
              <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block', marginBottom:6 }}>Document A</label>
              <select value={selectedDoc} onChange={e=>setSelected(e.target.value)} style={sel}>
                <option value="">— Choose —</option>
                {docs.map(d=><option key={d.doc_id} value={d.doc_id}>{d.filename.slice(0,40)}</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:180 }}>
              <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block', marginBottom:6 }}>Document B</label>
              <select value={docB} onChange={e=>setDocB(e.target.value)} style={sel}>
                <option value="">— Choose —</option>
                {docs.filter(d=>d.doc_id!==selectedDoc).map(d=><option key={d.doc_id} value={d.doc_id}>{d.filename.slice(0,40)}</option>)}
              </select>
            </div>
            <button onClick={runCompare} disabled={!selectedDoc||!docB||loading} style={{...btn, opacity:(!selectedDoc||!docB||loading)?.6:1}}>
              {loading ? '⚖️ Comparing…' : '⚖️ Compare'}
            </button>
          </div>
        )}
      </div>

      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', color:'#b91c1c', fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}

      {/* Corpus scan results */}
      {results && mode==='scan' && (
        <div className="fade-in-up">
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {[
              { label:'Documents Scanned', value:results.corpus_size, icon:'📄' },
              { label:'Flagged',           value:results.flagged_count, icon:'🚩', accent:'#D01012' },
            ].map(s => (
              <div key={s.label} style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'16px 24px', display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                <span style={{ fontSize:28 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize:26, fontWeight:800, color:s.accent||'#0f172a' }}>{s.value}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f2f7', fontWeight:700, fontSize:15 }}>
              Similarity Results for: <em style={{ color:'#D01012' }}>{results.filename?.slice(0,50)}</em>
            </div>
            {results.results.length === 0 ? (
              <div style={{ padding:'40px', textAlign:'center', color:'#9aa3b5', fontSize:14 }}>✅ No similar documents found in corpus.</div>
            ) : (
              results.results.map((r, i) => {
                const color = r.similarity_score >= 0.85 ? '#D01012' : r.similarity_score >= 0.60 ? '#d97706' : r.similarity_score >= 0.30 ? '#2563eb' : '#16a34a'
                return (
                  <div key={r.doc_id} style={{ padding:'14px 20px', borderBottom:'1px solid #f4f6f9', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, color, flexShrink:0 }}>{i+1}</div>
                    <div style={{ flex:1, minWidth:160 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:'#0f172a' }}>{r.filename}</div>
                      <div style={{ fontSize:11, color:'#9aa3b5', marginTop:2 }}>
                        {r.word_count?.toLocaleString()} words · {r.format?.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ flex:1, minWidth:140 }}>
                      <SimilarityMeter pct={r.similarity_percent} color={color} />
                      <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{r.similarity_percent}% similar</div>
                    </div>
                    <VerdictBadge verdict={r.verdict} label={r.verdict.replace(/_/g,' ')} color={color} />
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Pairwise compare result */}
      {compareResult && mode==='compare' && (
        <div className="fade-in-up" style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
          <h3 style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>Comparison Result</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:16, alignItems:'center', marginBottom:20 }}>
            <div style={{ background:'#f4f6f9', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontSize:11, color:'#9aa3b5', fontWeight:600, marginBottom:4 }}>DOCUMENT A</div>
              <div style={{ fontWeight:600, fontSize:13 }}>{compareResult.filename_a}</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:32, fontWeight:800, color:compareResult.verdict_color || '#D01012' }}>
                {compareResult.similarity_percent}%
              </div>
              <div style={{ fontSize:11, color:'#9aa3b5' }}>similarity</div>
            </div>
            <div style={{ background:'#f4f6f9', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontSize:11, color:'#9aa3b5', fontWeight:600, marginBottom:4 }}>DOCUMENT B</div>
              <div style={{ fontWeight:600, fontSize:13 }}>{compareResult.filename_b}</div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <span style={{ background:`${compareResult.verdict_color}18`, color:compareResult.verdict_color, fontWeight:700, fontSize:13, borderRadius:8, padding:'6px 18px' }}>
              {compareResult.verdict_label}
            </span>
          </div>
          {compareResult.overlapping_passages?.length > 0 && (
            <div>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>Overlapping Passages Detected</div>
              {compareResult.overlapping_passages.map((p, i) => (
                <div key={i} style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#92400e', marginBottom:6, fontFamily:'monospace' }}>
                  "{p}"
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

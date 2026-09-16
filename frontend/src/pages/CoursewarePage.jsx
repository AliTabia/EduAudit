import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { getDocuments, compareCourseware } from '../utils/api'

function BenchmarkCard({ course, index }) {
  const pct = course.coverage_match_percent || 0
  const color = pct >= 75 ? '#16a34a' : pct >= 50 ? '#2563eb' : pct >= 30 ? '#d97706' : '#D01012'
  return (
    <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'18px 20px', animation:`fadeInUp .35s ease ${index*0.08}s both` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>{course.course_name}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{course.university} {course.course_code ? `· ${course.course_code}` : ''}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:24, fontWeight:800, color }}>{pct}%</div>
          <div style={{ fontSize:10, color:'#9aa3b5' }}>coverage</div>
        </div>
      </div>
      <div style={{ height:6, background:'#f0f2f7', borderRadius:99, overflow:'hidden', marginBottom:12 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:99, transition:'width .6s' }}/>
      </div>
      {course.matching_topics?.length > 0 && (
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#16a34a', marginBottom:4 }}>✓ Matching Topics</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {course.matching_topics.map((t,i) => <span key={i} style={{ fontSize:11, background:'#f0fdf4', color:'#15803d', borderRadius:4, padding:'2px 8px' }}>{t}</span>)}
          </div>
        </div>
      )}
      {course.missing_from_document?.length > 0 && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#D01012', marginBottom:4 }}>✗ Missing from your document</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {course.missing_from_document.map((t,i) => <span key={i} style={{ fontSize:11, background:'#fdf1f1', color:'#D01012', borderRadius:4, padding:'2px 8px' }}>{t}</span>)}
          </div>
        </div>
      )}
      {course.url_hint && (
        <div style={{ marginTop:10, fontSize:11, color:'#2563eb' }}>
          <a href={course.url_hint.startsWith('http') ? course.url_hint : `https://www.google.com/search?q=${encodeURIComponent(course.course_name + ' ' + course.university)}`} target="_blank" rel="noopener noreferrer" style={{ color:'#2563eb' }}>🔗 Find this course →</a>
        </div>
      )}
    </div>
  )
}

export default function CoursewarePage() {
  const { token } = useAuth()
  const { t } = useLang()
  const [docs, setDocs] = useState([])
  const [docId, setDocId] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { getDocuments(token).then(d => setDocs(d.documents||[])).catch(()=>{}) }, [token])

  const run = async () => {
    if (!docId) return
    setLoading(true); setError(''); setResult(null)
    try { setResult(await compareCourseware(docId, 'auto', token)) }
    catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const rankColor = { top_tier:'#16a34a', competitive:'#2563eb', average:'#d97706', below_average:'#D01012' }

  return (
    <div className="fade-in-up">
      <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 }}>🌍 Open Courseware Comparison</h1>
      <p style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>Benchmark your document against MIT, Stanford, Coursera and other top university courses worldwide.</p>

      <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px', marginBottom:24, display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block', marginBottom:6 }}>Select Document</label>
          <select value={docId} onChange={e=>setDocId(e.target.value)} style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid #e4e8ef', fontSize:13, fontFamily:'inherit', background:'#fafbfc', width:'100%' }}>
            <option value="">— Choose a document —</option>
            {docs.map(d=><option key={d.doc_id} value={d.doc_id}>{d.filename}</option>)}
          </select>
        </div>
        <button onClick={run} disabled={!docId||loading} style={{ padding:'11px 24px', background:'linear-gradient(135deg,#D01012,#a80d0f)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:(!docId||loading)?'not-allowed':'pointer', opacity:(!docId||loading)?.6:1, boxShadow:'0 4px 14px rgba(208,16,18,.25)' }}>
          {loading ? '🌍 Comparing…' : '🌍 Compare with World Standards'}
        </button>
      </div>

      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', color:'#b91c1c', fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}

      {result && (
        <div className="fade-in-up">
          {/* Score header */}
          <div style={{ background:'linear-gradient(120deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'24px 28px', marginBottom:20, color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:6 }}>International Benchmark</div>
              <div style={{ fontSize:20, fontWeight:800 }}>{result.detected_subject}</div>
              <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                {result.detected_topics?.slice(0,5).map((t,i) => <span key={i} style={{ fontSize:11, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.8)', borderRadius:5, padding:'2px 8px' }}>{t}</span>)}
              </div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:38, fontWeight:800 }}>{result.overall_coverage_score}/10</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.6)' }}>Global Coverage</div>
              <span style={{ marginTop:6, display:'inline-block', fontSize:11, fontWeight:700, padding:'3px 12px', borderRadius:6, background:`${rankColor[result.global_ranking_estimate]||'#9aa3b5'}33`, color:rankColor[result.global_ranking_estimate]||'#fff' }}>
                {result.global_ranking_estimate?.replace(/_/g,' ')}
              </span>
            </div>
          </div>

          {/* Benchmark courses grid */}
          <h3 style={{ fontWeight:700, fontSize:16, marginBottom:14, color:'#0f172a' }}>📚 Benchmark Courses ({result.benchmark_courses?.length || 0})</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14, marginBottom:24 }}>
            {result.benchmark_courses?.map((c,i) => <BenchmarkCard key={i} course={c} index={i} />)}
          </div>

          {/* Strengths vs gaps */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
            {result.strengths_vs_international?.length > 0 && (
              <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'20px' }}>
                <h4 style={{ fontWeight:700, fontSize:14, marginBottom:12, color:'#16a34a' }}>✓ Your Strengths vs International</h4>
                {result.strengths_vs_international.map((s,i) => <div key={i} style={{ fontSize:13, color:'#374151', padding:'5px 0', borderBottom:'1px solid #f4f6f9' }}>• {s}</div>)}
              </div>
            )}
            {result.gaps_vs_international?.length > 0 && (
              <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'20px' }}>
                <h4 style={{ fontWeight:700, fontSize:14, marginBottom:12, color:'#D01012' }}>✗ Gaps vs International</h4>
                {result.gaps_vs_international.map((g,i) => <div key={i} style={{ fontSize:13, color:'#374151', padding:'5px 0', borderBottom:'1px solid #f4f6f9' }}>⚠ {g}</div>)}
              </div>
            )}
          </div>

          {/* Improvement suggestions */}
          {result.improvement_suggestions?.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'20px', marginBottom:20 }}>
              <h4 style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>💡 How to Reach International Standards</h4>
              {result.improvement_suggestions.map((s,i) => <div key={i} style={{ fontSize:13, color:'#374151', padding:'6px 0', borderBottom:'1px solid #f4f6f9', display:'flex', gap:8 }}><span style={{ color:'#D01012', fontWeight:700 }}>→</span>{s}</div>)}
            </div>
          )}

          {/* Recommended resources */}
          {result.recommended_resources?.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'20px' }}>
              <h4 style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>📖 Recommended Open Resources</h4>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
                {result.recommended_resources.map((r,i) => (
                  <div key={i} style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #f0f2f7' }}>
                    <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{r.title}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{r.source} · {r.relevance}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments, generateExam } from '../utils/api'

const btn = { padding:'11px 24px', background:'linear-gradient(135deg,#D01012,#a80d0f)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(208,16,18,.25)' }

export default function ExamPage() {
  const { token } = useAuth()
  const [docs, setDocs]     = useState([])
  const [docId, setDocId]   = useState('')
  const [opts, setOpts]     = useState({ bloom_level:'Apply', num_mcq:10, num_open:3, num_case:1, language:'auto' })
  const [exam, setExam]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [activeTab, setTab] = useState('mcq')

  useEffect(() => {
    getDocuments(token).then(d => setDocs(d.documents || [])).catch(() => {})
  }, [token])

  const generate = async () => {
    if (!docId) return
    setLoading(true); setError(''); setExam(null)
    try { setExam(await generateExam(docId, opts, token)); setTab('mcq') }
    catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const downloadTxt = () => {
    if (!exam) return
    let txt = `${exam.exam_title}\nDuration: ${exam.duration_minutes} min | Total: ${exam.total_points} pts\n\nInstructions: ${exam.instructions}\n\n`
    txt += '═══ MCQ ═══\n'
    exam.mcq?.forEach(q => { txt += `\nQ${q.id}. ${q.question} (${q.points} pts)\n`; Object.entries(q.options||{}).forEach(([k,v]) => { txt += `  ${k}) ${v}\n` }) })
    txt += '\n═══ OPEN QUESTIONS ═══\n'
    exam.open_questions?.forEach(q => { txt += `\nQ${q.id}. ${q.question}\n[${q.points} pts — ${q.expected_length}]\n` })
    if (exam.case_study) { txt += `\n═══ CASE STUDY ═══\n${exam.case_study.scenario}\n`; exam.case_study.questions?.forEach((q,i) => { txt += `${i+1}. ${q}\n` }) }
    const blob = new Blob([txt], { type:'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `exam_${docId.slice(0,8)}.txt`; a.click()
  }

  const sel = { padding:'9px 12px', borderRadius:10, border:'1.5px solid #e4e8ef', fontSize:13, fontFamily:'inherit', background:'#fafbfc', width:'100%' }
  const numInput = (key, min, max) => (
    <input type="number" min={min} max={max} value={opts[key]} onChange={e => setOpts(o=>({...o,[key]:+e.target.value}))} style={{ ...sel, width:80 }} />
  )

  return (
    <div className="fade-in-up">
      <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 }}>📝 Automatic Exam Generator</h1>
      <p style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>Generate MCQs, open questions, and case studies calibrated to your document's Bloom level.</p>

      <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px', marginBottom:24, boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div>
            <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block', marginBottom:6 }}>Document</label>
            <select value={docId} onChange={e=>setDocId(e.target.value)} style={sel}>
              <option value="">— Select document —</option>
              {docs.map(d=><option key={d.doc_id} value={d.doc_id}>{d.filename}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block', marginBottom:6 }}>Bloom's Level</label>
            <select value={opts.bloom_level} onChange={e=>setOpts(o=>({...o,bloom_level:e.target.value}))} style={sel}>
              {['Remember','Understand','Apply','Analyze','Evaluate','Create'].map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap' }}>
          <div><label style={{ fontWeight:600, fontSize:12, color:'#374151', display:'block', marginBottom:4 }}>MCQ (#)</label>{numInput('num_mcq',1,20)}</div>
          <div><label style={{ fontWeight:600, fontSize:12, color:'#374151', display:'block', marginBottom:4 }}>Open Q (#)</label>{numInput('num_open',0,10)}</div>
          <div><label style={{ fontWeight:600, fontSize:12, color:'#374151', display:'block', marginBottom:4 }}>Case Studies (#)</label>{numInput('num_case',0,3)}</div>
          <div>
            <label style={{ fontWeight:600, fontSize:12, color:'#374151', display:'block', marginBottom:4 }}>Language</label>
            <select value={opts.language} onChange={e=>setOpts(o=>({...o,language:e.target.value}))} style={{...sel,width:120}}>
              {['auto','fr','en','ar'].map(l=><option key={l} value={l}>{l==='auto'?'Auto-detect':l.toUpperCase()}</option>)}
            </select>
          </div>
          <button onClick={generate} disabled={!docId||loading} style={{...btn,opacity:(!docId||loading)?.6:1,marginTop:20}}>
            {loading ? '⚙️ Generating…' : '⚙️ Generate Exam'}
          </button>
        </div>
      </div>

      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', color:'#b91c1c', fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}

      {exam && (
        <div className="fade-in-up">
          {/* Exam header */}
          <div style={{ background:'linear-gradient(120deg,#0f172a,#1e3a5f)', borderRadius:16, padding:'24px 28px', marginBottom:20, color:'#fff' }}>
            <div style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>{exam.exam_title}</div>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:13, color:'rgba(255,255,255,.7)' }}>
              <span>⏱ {exam.duration_minutes} minutes</span>
              <span>📊 {exam.total_points} points total</span>
              <span>📝 {exam.mcq?.length||0} MCQ · {exam.open_questions?.length||0} Open · {exam.case_study?1:0} Case</span>
            </div>
            {exam.instructions && <div style={{ marginTop:10, fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.6 }}>{exam.instructions}</div>}
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button onClick={downloadTxt} style={{ background:'#0f172a', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              ⬇ Download .txt
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:0, borderBottom:'2px solid #e4e8ef', marginBottom:20 }}>
            {[{id:'mcq',label:`MCQ (${exam.mcq?.length||0})`},{id:'open',label:`Open (${exam.open_questions?.length||0})`},{id:'case',label:'Case Study'}].map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:'9px 20px', fontSize:13, fontWeight:activeTab===t.id?700:400, color:activeTab===t.id?'#D01012':'#5a6478', borderBottom:activeTab===t.id?'2px solid #D01012':'2px solid transparent', marginBottom:-2 }}>{t.label}</button>
            ))}
          </div>

          {/* MCQ */}
          {activeTab==='mcq' && exam.mcq?.map(q => (
            <div key={q.id} style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'18px 20px', marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
              <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                <span style={{ fontWeight:800, fontSize:13, color:'#D01012', flexShrink:0 }}>Q{q.id}.</span>
                <span style={{ fontWeight:600, fontSize:13, color:'#0f172a', flex:1 }}>{q.question}</span>
                <span style={{ fontSize:11, color:'#9aa3b5', whiteSpace:'nowrap' }}>{q.points} pts · {q.bloom_level}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {Object.entries(q.options||{}).map(([k,v]) => (
                  <div key={k} style={{ padding:'7px 12px', borderRadius:8, border:`1px solid ${k===q.correct_answer?'#bbf7d0':'#e4e8ef'}`, background:k===q.correct_answer?'#f0fdf4':'#fafbfc', fontSize:12, display:'flex', gap:8 }}>
                    <strong style={{ color:k===q.correct_answer?'#15803d':'#374151' }}>{k})</strong> {v}
                    {k===q.correct_answer && <span style={{ marginLeft:'auto', color:'#15803d', fontSize:11, fontWeight:700 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Open */}
          {activeTab==='open' && exam.open_questions?.map(q => (
            <div key={q.id} style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'18px 20px', marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
              <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                <span style={{ fontWeight:800, color:'#7c3aed', flexShrink:0, fontSize:13 }}>Q{q.id}.</span>
                <span style={{ fontWeight:600, fontSize:13, flex:1 }}>{q.question}</span>
                <span style={{ fontSize:11, color:'#9aa3b5', whiteSpace:'nowrap' }}>{q.points} pts</span>
              </div>
              <div style={{ fontSize:12, color:'#64748b' }}>Expected: {q.expected_length}</div>
              {q.marking_criteria && <div style={{ fontSize:12, color:'#64748b', marginTop:4, fontStyle:'italic' }}>Criteria: {q.marking_criteria}</div>}
            </div>
          ))}

          {/* Case */}
          {activeTab==='case' && exam.case_study && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'20px 22px', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginBottom:10 }}>Case Study Scenario</div>
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'14px 16px', fontSize:13, lineHeight:1.7, color:'#374151', marginBottom:14, borderLeft:'3px solid #D01012' }}>
                {exam.case_study.scenario}
              </div>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Questions ({exam.case_study.points} pts)</div>
              {exam.case_study.questions?.map((q,i) => (
                <div key={i} style={{ padding:'8px 12px', fontSize:13, color:'#374151', background:'#f4f6f9', borderRadius:8, marginBottom:6 }}>
                  <strong>{i+1}.</strong> {q}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

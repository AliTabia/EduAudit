import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { generateCourseOutline } from '../utils/api'

const bloomColors = { Remember:'#94a3b8', Understand:'#60a5fa', Apply:'#34d399', Analyze:'#a78bfa', Evaluate:'#fb923c', Create:'#f472b6' }
const input = { padding:'10px 14px', borderRadius:10, border:'1.5px solid #e4e8ef', fontSize:13, fontFamily:'inherit', background:'#fafbfc', width:'100%' }
const btn = { padding:'12px 28px', background:'linear-gradient(135deg,#D01012,#a80d0f)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(208,16,18,.25)' }

const LEVELS = ['Bachelor 1st year','Bachelor 2nd year','Bachelor 3rd year','Master 1','Master 2','PhD','Professional Training']

function WeekCard({ week }) {
  const color = bloomColors[week.bloom_level] || '#94a3b8'
  return (
    <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, width:4, height:'100%', background:color }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <span style={{ fontSize:11, fontWeight:700, color:'#9aa3b5' }}>WEEK {week.week}</span>
          <h4 style={{ fontWeight:700, fontSize:14, color:'#0f172a', marginTop:2 }}>{week.title}</h4>
        </div>
        <span style={{ fontSize:10, fontWeight:700, background:`${color}22`, color, borderRadius:5, padding:'3px 9px' }}>{week.bloom_level}</span>
      </div>
      {week.objectives?.length > 0 && (
        <div style={{ marginBottom:8 }}>
          {week.objectives.map((o,i) => <div key={i} style={{ fontSize:12, color:'#374151', padding:'2px 0', display:'flex', gap:6 }}><span style={{ color }}>◆</span>{o}</div>)}
        </div>
      )}
      {week.activities?.length > 0 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
          {week.activities.map((a,i) => (
            <span key={i} style={{ fontSize:10, background:'#f4f6f9', borderRadius:5, padding:'3px 8px', color:'#374151' }}>
              {a.type} · {a.duration_minutes}min
            </span>
          ))}
        </div>
      )}
      {week.deliverables?.length > 0 && (
        <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>📋 {week.deliverables.join(', ')}</div>
      )}
    </div>
  )
}

export default function OutlinePage() {
  const { token } = useAuth()
  const { t, lang } = useLang()
  const [form, setForm] = useState({ topic:'', target_level:'Bachelor 1st year', num_weeks:12, hours_per_week:3, language:lang, additional_instructions:'' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setTab] = useState('weekly')

  const set = k => e => setForm(f=>({...f,[k]:e.target.value}))

  const generate = async () => {
    if (!form.topic.trim()) { setError('Please enter a topic.'); return }
    setLoading(true); setError(''); setResult(null)
    try { setResult(await generateCourseOutline(form, token)) }
    catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fade-in-up">
      <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 }}>🧠 AI Course Outline Generator</h1>
      <p style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>
        {lang==='fr' ? 'Générez un programme de cours complet à partir d\'un sujet — objectifs, progression Bloom, activités, évaluations.' : 'Generate a complete course syllabus from a topic — objectives, Bloom progression, activities, assessments.'}
      </p>

      {/* Input form */}
      <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px', marginBottom:24, boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block', marginBottom:6 }}>{lang==='fr'?'Sujet du cours':'Course Topic'} *</label>
            <input value={form.topic} onChange={set('topic')} placeholder={lang==='fr'?"ex: Introduction à l'Intelligence Artificielle":"e.g. Introduction to Machine Learning"} style={input} />
          </div>
          <div>
            <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block', marginBottom:6 }}>{lang==='fr'?'Niveau cible':'Target Level'}</label>
            <select value={form.target_level} onChange={set('target_level')} style={input}>
              {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontWeight:600, fontSize:12, color:'#374151', display:'block', marginBottom:4 }}>{lang==='fr'?'Semaines':'Weeks'}</label>
              <input type="number" min={2} max={30} value={form.num_weeks} onChange={e=>setForm(f=>({...f,num_weeks:+e.target.value}))} style={input}/>
            </div>
            <div>
              <label style={{ fontWeight:600, fontSize:12, color:'#374151', display:'block', marginBottom:4 }}>{lang==='fr'?'Heures/sem':'Hours/week'}</label>
              <input type="number" min={1} max={10} step={0.5} value={form.hours_per_week} onChange={e=>setForm(f=>({...f,hours_per_week:+e.target.value}))} style={input}/>
            </div>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontWeight:600, fontSize:13, color:'#374151', display:'block', marginBottom:6 }}>{lang==='fr'?'Instructions supplémentaires (optionnel)':'Additional instructions (optional)'}</label>
          <input value={form.additional_instructions} onChange={set('additional_instructions')} placeholder={lang==='fr'?"ex: Inclure un projet en groupe, focus sur Python":"e.g. Include a group project, focus on Python"} style={input}/>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <button onClick={generate} disabled={loading||!form.topic.trim()} style={{...btn, opacity:(loading||!form.topic.trim())?.6:1}}>
            {loading ? '🧠 Génération en cours…' : '🧠 Générer le Programme'}
          </button>
          {loading && <span style={{ fontSize:13, color:'#64748b' }}>{lang==='fr'?'Cela peut prendre 30-90 secondes…':'This may take 30-90 seconds…'}</span>}
        </div>
      </div>

      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', color:'#b91c1c', fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}

      {/* Results */}
      {result && (
        <div className="fade-in-up">
          {/* Header */}
          <div style={{ background:'linear-gradient(120deg,#D01012,#870a0c)', borderRadius:16, padding:'24px 28px', marginBottom:20, color:'#fff' }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:6 }}>Generated Course Outline</div>
            <div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>{result.course_title}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.75)', lineHeight:1.6, marginBottom:10 }}>{result.course_description}</div>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:12, color:'rgba(255,255,255,.6)' }}>
              <span>🎓 {result.target_level}</span>
              <span>📅 {result.duration_weeks} weeks</span>
              <span>⏱ {result.hours_per_week}h/week</span>
              <span>📊 {result.total_hours}h total</span>
              <span>⚡ {result.processing_time}s</span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:0, borderBottom:'2px solid #e4e8ef', marginBottom:20, overflowX:'auto' }}>
            {[{id:'weekly',label:'📅 Weekly Plan'},{id:'objectives',label:'🎯 Objectives'},{id:'assessments',label:'📝 Assessments'},{id:'resources',label:'📖 Resources'},{id:'bloom',label:'🧠 Bloom Map'}].map(tab=>(
              <button key={tab.id} onClick={()=>setTab(tab.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:'10px 18px', fontSize:13, fontWeight:activeTab===tab.id?700:400, color:activeTab===tab.id?'#D01012':'#5a6478', borderBottom:activeTab===tab.id?'2px solid #D01012':'2px solid transparent', marginBottom:-2, whiteSpace:'nowrap' }}>{tab.label}</button>
            ))}
          </div>

          {/* Weekly Plan */}
          {activeTab==='weekly' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:12 }}>
              {result.weekly_plan?.map(w => <WeekCard key={w.week} week={w} />)}
            </div>
          )}

          {/* Objectives */}
          {activeTab==='objectives' && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px' }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>Global Learning Objectives</h3>
              {result.global_objectives?.map((o,i) => (
                <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 0', borderBottom:'1px solid #f4f6f9' }}>
                  <span style={{ fontSize:10, fontWeight:700, background:`${bloomColors[o.bloom_level]||'#94a3b8'}22`, color:bloomColors[o.bloom_level]||'#94a3b8', borderRadius:5, padding:'3px 9px', flexShrink:0 }}>{o.bloom_level}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{o.objective}</div>
                    <div style={{ fontSize:11, color:'#9aa3b5', marginTop:2 }}>Verb: <em>{o.verb}</em></div>
                  </div>
                </div>
              ))}
              {result.prerequisites?.length > 0 && (
                <div style={{ marginTop:20 }}>
                  <h4 style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>Prerequisites</h4>
                  {result.prerequisites.map((p,i) => <div key={i} style={{ fontSize:13, color:'#374151', padding:'4px 0' }}>• {p}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Assessments */}
          {activeTab==='assessments' && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px' }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>Assessment Plan</h3>
              {result.assessment_plan?.map((a,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:'1px solid #f4f6f9' }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:'#fdf1f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {a.type==='exam'?'📝':a.type==='project'?'🏗️':a.type==='quiz'?'❓':a.type==='presentation'?'🎤':'📄'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:'#0f172a' }}>{a.title}</div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{a.description}</div>
                    <div style={{ fontSize:11, color:'#9aa3b5', marginTop:3 }}>Week {a.week_due} · {a.bloom_level}</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:22, fontWeight:800, color:'#D01012' }}>{a.weight_percent}%</div>
                    <div style={{ fontSize:10, color:'#9aa3b5' }}>weight</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resources */}
          {activeTab==='resources' && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px' }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>Reading List & Resources</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
                {result.reading_list?.map((r,i) => (
                  <div key={i} style={{ background:'#f8fafc', border:'1px solid #f0f2f7', borderRadius:10, padding:'14px 16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontWeight:600, fontSize:13 }}>{r.title}</span>
                      {r.required && <span style={{ fontSize:9, fontWeight:700, background:'#fdf1f1', color:'#D01012', borderRadius:4, padding:'2px 6px' }}>Required</span>}
                    </div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{r.author} · {r.type}</div>
                    {r.url_hint && <a href={r.url_hint.startsWith('http')?r.url_hint:`https://www.google.com/search?q=${encodeURIComponent(r.title)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:'#2563eb', marginTop:4, display:'inline-block' }}>🔗 Find resource</a>}
                  </div>
                ))}
              </div>
              {result.methodology_notes?.length > 0 && (
                <div style={{ marginTop:20 }}>
                  <h4 style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>Teaching Methodology</h4>
                  {result.methodology_notes.map((n,i) => <div key={i} style={{ fontSize:13, color:'#374151', padding:'5px 0', borderBottom:'1px solid #f4f6f9' }}>💡 {n}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Bloom progression */}
          {activeTab==='bloom' && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px' }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>Bloom's Taxonomy Progression</h3>
              {result.bloom_progression_summary && <p style={{ fontSize:13, color:'#64748b', marginBottom:20, lineHeight:1.6 }}>{result.bloom_progression_summary}</p>}
              <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:120, padding:'0 10px' }}>
                {result.weekly_plan?.map(w => {
                  const levels = ['Remember','Understand','Apply','Analyze','Evaluate','Create']
                  const idx = levels.indexOf(w.bloom_level)
                  const h = Math.max(20, ((idx+1)/6)*100)
                  const color = bloomColors[w.bloom_level] || '#94a3b8'
                  return (
                    <div key={w.week} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ width:'100%', height:`${h}%`, background:color, borderRadius:'4px 4px 0 0', minHeight:16, transition:'height .4s ease', position:'relative' }}>
                        <div style={{ position:'absolute', top:-16, left:'50%', transform:'translateX(-50%)', fontSize:9, fontWeight:700, color, whiteSpace:'nowrap' }}>{w.bloom_level?.slice(0,3)}</div>
                      </div>
                      <span style={{ fontSize:9, color:'#9aa3b5' }}>W{w.week}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ display:'flex', justifyContent:'center', gap:12, marginTop:16, flexWrap:'wrap' }}>
                {Object.entries(bloomColors).map(([level, color]) => (
                  <span key={level} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#64748b' }}>
                    <span style={{ width:8, height:8, borderRadius:2, background:color, display:'inline-block' }}/> {level}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

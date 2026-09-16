import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { getAllEvolutions, getEvolution } from '../utils/api'
import { scoreColor, formatDate } from '../utils/helpers'

function Sparkline({ points, width = 120, height = 32 }) {
  if (!points || points.length < 2) return <span style={{ fontSize:11, color:'#9aa3b5' }}>—</span>
  const scores = points.map(p => p.score)
  const min = Math.min(...scores) - 0.5
  const max = Math.max(...scores) + 0.5
  const range = max - min || 1
  const step = width / (scores.length - 1)
  const pts = scores.map((s, i) => `${i * step},${height - ((s - min) / range) * height}`)
  const color = scores[scores.length-1] >= scores[0] ? '#16a34a' : '#D01012'
  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(scores.length-1)*step} cy={height-((scores[scores.length-1]-min)/range)*height} r="3" fill={color} />
    </svg>
  )
}

function TrendBadge({ trend, improvement }) {
  const config = {
    improving: { icon:'📈', color:'#16a34a', bg:'#f0fdf4', label:'Improving' },
    declining: { icon:'📉', color:'#D01012', bg:'#fdf1f1', label:'Declining' },
    stable:    { icon:'➡️', color:'#2563eb', bg:'#eff6ff', label:'Stable' },
    none:      { icon:'—', color:'#9aa3b5', bg:'#f4f6f9', label:'No data' },
    insufficient_data: { icon:'📊', color:'#9aa3b5', bg:'#f4f6f9', label:'1 audit' },
  }
  const c = config[trend] || config.none
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, background:c.bg, color:c.color, borderRadius:6, padding:'3px 10px' }}>
      {c.icon} {c.label} {improvement ? `(${improvement > 0 ? '+' : ''}${improvement})` : ''}
    </span>
  )
}

export default function EvolutionPage() {
  const { token } = useAuth()
  const { t } = useLang()
  const [evolutions, setEvolutions] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllEvolutions(token).then(d => setEvolutions(d.evolutions || [])).catch(()=>{}).finally(()=>setLoading(false))
  }, [token])

  const loadDetail = async (docId) => {
    setSelected(docId)
    try { setDetail(await getEvolution(docId, token)) }
    catch(e) { setDetail(null) }
  }

  return (
    <div className="fade-in-up">
      <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 }}>📈 Quality Evolution Timeline</h1>
      <p style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>Track how your documents improve over successive audits. Re-audit after changes to see your progress.</p>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#9aa3b5' }}>Loading evolution data…</div>
      ) : evolutions.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1px solid #e4e8ef' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
          <h3 style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>No Evolution Data Yet</h3>
          <p style={{ color:'#64748b', fontSize:14 }}>Run audits on your documents multiple times to track quality improvement over time.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: detail ? '1fr 1fr' : '1fr', gap:20 }}>
          {/* Left: list */}
          <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f2f7', fontWeight:700, fontSize:15 }}>
              Documents ({evolutions.length})
            </div>
            {evolutions.map((ev, i) => (
              <div key={ev.doc_id} onClick={() => loadDetail(ev.doc_id)} style={{
                padding:'14px 20px', borderBottom:'1px solid #f4f6f9', cursor:'pointer',
                background: selected === ev.doc_id ? '#fdf1f1' : 'transparent',
                transition:'background .12s', display:'flex', alignItems:'center', gap:14,
              }}
              onMouseEnter={e => { if (selected !== ev.doc_id) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (selected !== ev.doc_id) e.currentTarget.style.background = 'transparent' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.filename}</div>
                  <div style={{ fontSize:11, color:'#9aa3b5', marginTop:3 }}>
                    {ev.total_audits} audit{ev.total_audits !== 1 ? 's' : ''} · {ev.first_score?.toFixed(1)} → {ev.latest_score?.toFixed(1)}
                  </div>
                </div>
                <TrendBadge trend={ev.trend} improvement={ev.improvement} />
              </div>
            ))}
          </div>

          {/* Right: detail */}
          {detail && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }} className="slide-right">
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>{detail.filename}</h3>
              <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:28, fontWeight:800, color:scoreColor(detail.latest_score) }}>{detail.latest_score?.toFixed(1)}</div>
                  <div style={{ fontSize:11, color:'#9aa3b5' }}>Latest</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:28, fontWeight:800, color:'#9aa3b5' }}>{detail.first_score?.toFixed(1)}</div>
                  <div style={{ fontSize:11, color:'#9aa3b5' }}>First</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:28, fontWeight:800, color:detail.improvement >= 0 ? '#16a34a' : '#D01012' }}>
                    {detail.improvement >= 0 ? '+' : ''}{detail.improvement?.toFixed(1)}
                  </div>
                  <div style={{ fontSize:11, color:'#9aa3b5' }}>Change</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:28, fontWeight:800, color:'#7c3aed' }}>{detail.best_score?.toFixed(1)}</div>
                  <div style={{ fontSize:11, color:'#9aa3b5' }}>Best</div>
                </div>
              </div>

              {/* Sparkline */}
              <div style={{ marginBottom:20, padding:'16px', background:'#f8fafc', borderRadius:12 }}>
                <Sparkline points={detail.data_points} width={280} height={48} />
              </div>

              {/* History table */}
              <h4 style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>Audit History</h4>
              {detail.data_points?.map((p, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid #f4f6f9' }}>
                  <div style={{ width:28, height:28, borderRadius:6, background:`${scoreColor(p.score)}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:scoreColor(p.score) }}>
                    {i + 1}
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:scoreColor(p.score) }}>{p.score.toFixed(1)}</span>
                    <span style={{ fontSize:12, color:'#9aa3b5', marginLeft:8 }}>({p.grade})</span>
                  </div>
                  <span style={{ fontSize:11, color:'#9aa3b5' }}>{formatDate(p.timestamp)}</span>
                  {i > 0 && (
                    <span style={{ fontSize:11, fontWeight:700, color: p.score > detail.data_points[i-1].score ? '#16a34a' : p.score < detail.data_points[i-1].score ? '#D01012' : '#9aa3b5' }}>
                      {p.score > detail.data_points[i-1].score ? '↑' : p.score < detail.data_points[i-1].score ? '↓' : '='}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

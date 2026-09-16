import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { adminStats, adminTeachers, adminRankings } from '../utils/api'
import GradeBadge from '../components/GradeBadge'
import { scoreColor, formatDate } from '../utils/helpers'

function StatCard({ icon, label, value, accent = '#D01012' }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'18px 22px', display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
      <div style={{ width:44, height:44, borderRadius:12, background:`${accent}14`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:26, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{value ?? '—'}</div>
        <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>{label}</div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { user, token } = useAuth()
  const [stats, setStats]           = useState(null)
  const [teachers, setTeachers]     = useState([])
  const [rankings, setRankings]     = useState([])
  const [activeTab, setActiveTab]   = useState('overview')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (!user?.is_admin) return
    setLoading(true)
    Promise.all([adminStats(token), adminTeachers(token), adminRankings(token)])
      .then(([s, t, r]) => {
        setStats(s); setTeachers(t.teachers || []); setRankings(r.rankings || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, user])

  if (!user?.is_admin) {
    return (
      <div style={{ textAlign:'center', padding:'80px 20px' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <h2 style={{ fontWeight:800, fontSize:22, color:'#0f172a', marginBottom:8 }}>Admin Access Required</h2>
        <p style={{ color:'#64748b', fontSize:14 }}>You need admin privileges to access this page.</p>
      </div>
    )
  }

  const tabs = [
    { id:'overview',  label:'📊 Overview'  },
    { id:'teachers',  label:'👥 Teachers'  },
    { id:'rankings',  label:'🏆 Rankings'  },
  ]

  const grades = ['A+','A','B','C','D','F']
  const gradeColors = { 'A+':'#15803d', A:'#16a34a', B:'#2563eb', C:'#b45309', D:'#c2410c', F:'#D01012' }
  const totalGrades = Object.values(stats?.grade_distribution||{}).reduce((a,b)=>a+b,0)

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div style={{ background:'linear-gradient(120deg,#0f172a,#1e3a5f)', borderRadius:20, padding:'24px 32px', marginBottom:24, color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:6 }}>Admin Dashboard</div>
          <h1 style={{ fontSize:24, fontWeight:800, margin:0 }}>Department Overview</h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.6)', marginTop:4 }}>Platform-wide audit analytics for ESPRIT</p>
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.5)' }}>
          Logged in as: <strong style={{ color:'#fff' }}>{user?.first_name} {user?.last_name}</strong> (Admin)
        </div>
      </div>

      {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', color:'#b91c1c', fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}
      {loading && <div style={{ textAlign:'center', padding:40, color:'#9aa3b5' }}>Loading admin data…</div>}

      {!loading && (
        <>
          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 }}>
            <StatCard icon="📊" label="Total Audits"    value={stats?.total_audits ?? 0} />
            <StatCard icon="👥" label="Teachers"        value={stats?.total_teachers ?? 0} accent="#7c3aed" />
            <StatCard icon="⭐" label="Avg Score"       value={stats?.average_score != null ? `${stats.average_score}/10` : '—'} accent="#059669" />
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:0, borderBottom:'2px solid #e4e8ef', marginBottom:20 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:'10px 20px', fontSize:13, fontWeight:activeTab===t.id?700:400, color:activeTab===t.id?'#D01012':'#5a6478', borderBottom:activeTab===t.id?'2px solid #D01012':'2px solid transparent', marginBottom:-2, whiteSpace:'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'22px 24px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                <h3 style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>Grade Distribution</h3>
                {grades.map(g => {
                  const count = stats?.grade_distribution?.[g] || 0
                  const pct   = totalGrades ? (count/totalGrades)*100 : 0
                  return (
                    <div key={g} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <span style={{ fontWeight:700, width:24, fontSize:13, color:gradeColors[g] }}>{g}</span>
                      <div style={{ flex:1, height:8, background:'#f0f2f7', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:gradeColors[g], borderRadius:99, transition:'width .6s' }}/>
                      </div>
                      <span style={{ fontSize:12, color:'#9aa3b5', width:20 }}>{count}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, padding:'22px 24px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                <h3 style={{ fontWeight:700, fontSize:15, marginBottom:18 }}>By Department</h3>
                {Object.entries(stats?.department_stats || {}).length === 0 ? (
                  <div style={{ color:'#9aa3b5', fontSize:13 }}>No department data yet.</div>
                ) : Object.entries(stats?.department_stats || {}).map(([dept, d]) => (
                  <div key={dept} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, padding:'8px 12px', background:'#f8fafc', borderRadius:8 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{dept}</div>
                      <div style={{ fontSize:11, color:'#9aa3b5' }}>{d.count} audit{d.count!==1?'s':''}</div>
                    </div>
                    <div style={{ fontWeight:800, color:scoreColor(d.avg), fontSize:16 }}>{d.avg}/10</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teachers */}
          {activeTab === 'teachers' && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#0f172a' }}>
                    {['Teacher','Subject','Department','Audits','Avg Score','Last Audit'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'rgba(255,255,255,.7)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t, i) => (
                    <tr key={t.user_id} style={{ borderBottom:'1px solid #f0f2f7', background:i%2===0?'#fff':'#fafbfc' }}>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{t.name}</div>
                        <div style={{ fontSize:11, color:'#9aa3b5' }}>{t.email}</div>
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'#374151' }}>{t.subject || '—'}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'#374151' }}>{t.department || '—'}</td>
                      <td style={{ padding:'12px 16px', fontSize:14, fontWeight:700 }}>{t.total_audits}</td>
                      <td style={{ padding:'12px 16px' }}>
                        {t.avg_score != null
                          ? <span style={{ fontWeight:700, color:scoreColor(t.avg_score) }}>{t.avg_score}/10</span>
                          : <span style={{ color:'#9aa3b5', fontSize:12 }}>No audits</span>}
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:11, color:'#9aa3b5' }}>
                        {t.last_audit ? formatDate(t.last_audit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {teachers.length === 0 && <div style={{ padding:40, textAlign:'center', color:'#9aa3b5' }}>No teachers found.</div>}
            </div>
          )}

          {/* Rankings */}
          {activeTab === 'rankings' && (
            <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
              {rankings.map((r, i) => (
                <div key={r.user_id} style={{ padding:'14px 20px', borderBottom:'1px solid #f0f2f7', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:i===0?'#fef08a':i===1?'#e2e8f0':i===2?'#fed7aa':'#f4f6f9', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:i===0?'#92400e':i===1?'#475569':i===2?'#9a3412':'#374151', flexShrink:0 }}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':r.rank}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>{r.name}</div>
                    <div style={{ fontSize:12, color:'#9aa3b5' }}>{r.subject} · {r.department} · {r.total_audits} audits</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:22, fontWeight:800, color:scoreColor(r.avg_score) }}>{r.avg_score}</div>
                    <div style={{ fontSize:10, color:'#9aa3b5' }}>avg score</div>
                  </div>
                  <div style={{ fontSize:16 }}>{r.trend==='up'?'📈':r.trend==='down'?'📉':'➡️'}</div>
                </div>
              ))}
              {rankings.length === 0 && <div style={{ padding:40, textAlign:'center', color:'#9aa3b5' }}>No ranking data available yet.</div>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

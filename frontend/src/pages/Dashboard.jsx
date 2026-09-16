import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHistory } from '../hooks/useAudit'
import GradeBadge from '../components/GradeBadge'
import NewsFeed, { NewsTicker } from '../components/NewsFeed'
import { scoreColor, formatDate } from '../utils/helpers'

/* ── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, accent = '#D01012', delay = 0 }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--color-border)',
      borderRadius: 16, padding: '22px 24px',
      display: 'flex', alignItems: 'center', gap: 18,
      boxShadow: 'var(--shadow-sm)',
      animation: `fadeInUp .4s ease ${delay}s both`,
      transition: 'box-shadow .18s, transform .18s',
      overflow: 'hidden', position: 'relative',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-md)'
      e.currentTarget.style.transform = 'translateY(-2px)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      e.currentTarget.style.transform = 'none'
    }}>
      {/* Accent bar */}
      <div style={{ position:'absolute', left:0, top:0, bottom:0,
        width:4, background:accent, borderRadius:'16px 0 0 16px' }} />
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: `${accent}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#9aa3b5', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

/* ── Grade distribution bar ─────────────────────────────────────────────── */
function GradeBar({ distribution }) {
  if (!distribution) return null
  const grades = ['A+','A','B','C','D','F']
  const colors = { 'A+':'#15803d', A:'#16a34a', B:'#2563eb', C:'#b45309', D:'#c2410c', F:'#D01012' }
  const total  = Object.values(distribution).reduce((a,b)=>a+b,0)
  return (
    <div style={{ background:'#fff', border:'1px solid var(--color-border)',
      borderRadius:16, padding:'22px 24px', boxShadow:'var(--shadow-sm)' }}>
      <h3 style={{ fontWeight:700, fontSize:15, marginBottom:18, color:'#0f172a' }}>
        Grade Distribution
      </h3>
      {grades.map(g => {
        const count = distribution[g] || 0
        const pct   = total ? (count/total)*100 : 0
        return (
          <div key={g} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{ fontWeight:700, width:26, fontSize:13, color:colors[g]||'#666' }}>{g}</span>
            <div style={{ flex:1, height:8, background:'#f0f2f7', borderRadius:99, overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', background:colors[g]||'#ccc',
                borderRadius:99, transition:'width .7s ease' }} />
            </div>
            <span style={{ fontSize:12, color:'#9aa3b5', width:20, textAlign:'right' }}>{count}</span>
          </div>
        )
      })}
      {total === 0 && <div style={{ fontSize:13, color:'#9aa3b5', textAlign:'center', padding:'8px 0' }}>No data yet</div>}
    </div>
  )
}

/* ── Recent audit row ───────────────────────────────────────────────────── */
function RecentAuditRow({ item, onClick, index }) {
  return (
    <div onClick={() => onClick(item.audit_id)} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px', cursor: 'pointer',
      borderBottom: '1px solid #f4f6f9',
      transition: 'background .12s',
      animation: `fadeInUp .35s ease ${index * 0.05}s both`,
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#fdf1f1'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {/* Score circle */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${scoreColor(item.global_score)}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 13, color: scoreColor(item.global_score),
      }}>{item.global_score?.toFixed(1)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.filename}
        </div>
        <div style={{ fontSize: 11, color: '#9aa3b5', marginTop: 2 }}>
          {formatDate(item.created_at)}
        </div>
      </div>
      <GradeBadge grade={item.grade} size="sm" />
    </div>
  )
}

/* ── Main Dashboard ─────────────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const { history, stats, loading, error, refresh } = useHistory()

  useEffect(() => { refresh() }, [refresh])

  const recent = history.slice(0, 6)
  const hour   = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      {/* ── Welcome banner ── */}
      <div style={{
        background: 'linear-gradient(120deg,#D01012 0%,#870a0c 60%,#5a0809 100%)',
        borderRadius: 20, padding: '28px 36px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 20,
        boxShadow: 'var(--shadow-red)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', right:-40, top:-40, width:200, height:200,
          borderRadius:'50%', background:'rgba(255,255,255,.06)' }} />
        <div style={{ position:'absolute', right:60, bottom:-60, width:160, height:160,
          borderRadius:'50%', background:'rgba(255,255,255,.04)' }} />
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', fontWeight:600,
            letterSpacing:'1px', textTransform:'uppercase', marginBottom:6 }}>
            {greeting}
          </div>
          <h1 style={{ fontSize:26, fontWeight:800, color:'#fff', margin:0, lineHeight:1.2 }}>
            {user?.first_name} {user?.last_name}
          </h1>
          <div style={{ marginTop:6, display:'flex', gap:8, flexWrap:'wrap' }}>
            {user?.subject && (
              <span style={{ fontSize:12, background:'rgba(255,255,255,.15)',
                color:'#fff', borderRadius:6, padding:'3px 10px', fontWeight:600 }}>
                {user.subject}
              </span>
            )}
            {user?.department && (
              <span style={{ fontSize:12, background:'rgba(255,255,255,.1)',
                color:'rgba(255,255,255,.85)', borderRadius:6, padding:'3px 10px' }}>
                {user.department}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => navigate('/audit')} style={{
          position:'relative',
          background:'#fff', color:'#D01012',
          border:'none', borderRadius:12,
          padding:'12px 28px', fontSize:14, fontWeight:800,
          cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,.2)',
          transition:'transform .15s',
          whiteSpace:'nowrap',
        }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
          ＋ New Audit
        </button>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
        <StatCard label="Total Audits"    value={stats?.total_audits ?? 0}  icon="📊" delay={0}/>
        <StatCard label="Average Score"   value={stats?.average_global_score != null ? `${stats.average_global_score}/10` : '—'} icon="⭐" accent="#7c3aed" delay={0.05}/>
        <StatCard label="Highest Score"   value={stats?.max_score != null ? `${stats.max_score}/10` : '—'} icon="🏆" accent="#059669" delay={0.1}/>
        <StatCard label="Lowest Score"    value={stats?.min_score != null ? `${stats.min_score}/10` : '—'} icon="📉" accent="#d97706" delay={0.15}/>
      </div>

      {/* ── News ticker ── */}
      <div style={{ marginBottom: 24 }}>
        <NewsTicker articles={[]} />
        <NewsFeed compact />
      </div>

      {/* ── Bottom grid: recent audits + grade bar ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
        {/* Recent audits */}
        <div style={{ background:'#fff', border:'1px solid var(--color-border)',
          borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f2f7',
            display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>Recent Audits</div>
            <button onClick={() => navigate('/history')} style={{
              background:'none', border:'none', cursor:'pointer',
              fontSize:12, color:'#D01012', fontWeight:600,
            }}>View all →</button>
          </div>
          {loading ? (
            <div style={{ padding:32, textAlign:'center', color:'#9aa3b5' }}>Loading…</div>
          ) : recent.length === 0 ? (
            <div style={{ padding:'40px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
              <div style={{ fontWeight:600, fontSize:14, color:'#0f172a', marginBottom:4 }}>
                No audits yet
              </div>
              <div style={{ fontSize:12, color:'#9aa3b5', marginBottom:16 }}>
                Upload a document to get your first AI-powered audit
              </div>
              <button onClick={() => navigate('/audit')} style={{
                background:'#D01012', color:'#fff', border:'none',
                borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:700, cursor:'pointer',
              }}>Start First Audit</button>
            </div>
          ) : (
            recent.map((item, i) => (
              <RecentAuditRow key={item.audit_id} item={item} index={i}
                onClick={id => navigate(`/history?audit=${id}`)} />
            ))
          )}
        </div>

        {/* Grade bar */}
        <GradeBar distribution={stats?.grade_distribution} />
      </div>

      {/* ── Full news feed ── */}
      <NewsFeed />
    </div>
  )
}

import React, { useEffect, useState, useRef } from 'react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CAT_LABELS = {
  ai_research:    { label: 'AI Research',   color: '#7c3aed', bg: '#f5f3ff' },
  ai_news:        { label: 'AI News',       color: '#0891b2', bg: '#ecfeff' },
  edtech:         { label: 'EdTech',        color: '#059669', bg: '#f0fdf4' },
  university_news:{ label: 'Universities',  color: '#D01012', bg: '#fdf1f1' },
}

function SkeletonCard() {
  return (
    <div style={{ background:'#fff', borderRadius:12, padding:'16px 18px',
      border:'1px solid #e4e8ef', flexShrink:0, width:300 }}>
      <div className="skeleton" style={{ height:10, width:'40%', marginBottom:10 }}/>
      <div className="skeleton" style={{ height:14, width:'90%', marginBottom:6 }}/>
      <div className="skeleton" style={{ height:14, width:'75%', marginBottom:12 }}/>
      <div className="skeleton" style={{ height:10, width:'60%' }}/>
    </div>
  )
}

/* ── Horizontal scrolling ticker ──────────────────────────────────────────── */
function NewsTicker({ articles }) {
  if (!articles?.length) return null
  const items = [...articles, ...articles] // duplicate for seamless loop
  return (
    <div style={{
      background: '#0f172a', overflow: 'hidden',
      borderRadius: 10, padding: '0', height: 38,
      display: 'flex', alignItems: 'center',
      position: 'relative',
    }}>
      <div style={{
        background: '#D01012', color: '#fff', padding: '0 16px',
        height: '100%', display: 'flex', alignItems: 'center',
        fontSize: 11, fontWeight: 700, letterSpacing: '1px',
        flexShrink: 0, zIndex: 2, whiteSpace: 'nowrap',
      }}>
        LIVE FEED
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          display: 'flex', gap: 60,
          animation: 'ticker 40s linear infinite',
          width: 'max-content',
        }}>
          {items.map((a, i) => (
            <a key={i} href={a.url !== '#' ? a.url : undefined}
              target="_blank" rel="noopener noreferrer"
              style={{
                color: '#e2e8f0', fontSize: 12, fontWeight: 500,
                whiteSpace: 'nowrap', textDecoration: 'none',
                transition: 'color .15s',
              }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = '#e2e8f0'}
            >
              <span style={{ color: '#94a3b8', marginRight: 6 }}>▸</span>
              {a.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Card grid ────────────────────────────────────────────────────────────── */
function NewsCard({ article, index }) {
  const cat = CAT_LABELS[article.category] || { label: article.category, color: '#64748b', bg: '#f8fafc' }
  return (
    <a href={article.url !== '#' ? article.url : undefined}
      target="_blank" rel="noopener noreferrer"
      style={{
        display: 'block', textDecoration: 'none',
        background: '#fff', border: '1px solid #e4e8ef',
        borderRadius: 14, padding: '18px 20px',
        transition: 'box-shadow .18s, transform .18s',
        animation: `fadeInUp .4s ease ${index * 0.06}s both`,
        cursor: article.url !== '#' ? 'pointer' : 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,.1)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
          color: cat.color, background: cat.bg,
          padding: '3px 9px', borderRadius: 5,
        }}>{cat.label}</span>
        <span style={{ fontSize: 10, color: '#9aa3b5', marginLeft: 'auto' }}>
          {article.source}
        </span>
      </div>
      <h4 style={{
        fontSize: 13, fontWeight: 700, color: '#0f172a',
        lineHeight: 1.45, marginBottom: 8,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{article.title}</h4>
      {article.description && (
        <p style={{
          fontSize: 12, color: '#5a6478', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 10,
        }}>{article.description}</p>
      )}
      {article.url !== '#' && (
        <span style={{ fontSize: 11, color: '#D01012', fontWeight: 600 }}>
          Read more →
        </span>
      )}
    </a>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function NewsFeed({ compact = false }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActive]  = useState('all')
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    fetch(`${BASE}/api/news/feed`)
      .then(r => r.json())
      .then(d => {
        setArticles(d.articles || [])
        setFetchedAt(d.fetched_at)
      })
      .catch(() => {}) // silently fail — fallback articles shown
      .finally(() => setLoading(false))
  }, [])

  const TABS = [
    { id: 'all',            label: 'All' },
    { id: 'ai_research',    label: '🔬 AI Research' },
    { id: 'ai_news',        label: '🤖 AI News' },
    { id: 'edtech',         label: '📚 EdTech' },
    { id: 'university_news',label: '🏛️ Universities' },
  ]

  const filtered = activeTab === 'all'
    ? articles
    : articles.filter(a => a.category === activeTab)

  if (compact) {
    return (
      <div>
        <NewsTicker articles={articles} />
      </div>
    )
  }

  return (
    <div>
      {/* Ticker */}
      <div style={{ marginBottom: 20 }}>
        <NewsTicker articles={articles} />
      </div>

      {/* Header + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
            News & Trends
          </h2>
          <p style={{ fontSize: 12, color: '#9aa3b5', marginTop: 2 }}>
            {fetchedAt ? `Updated ${new Date(fetchedAt).toLocaleTimeString()}` : 'Latest in AI, EdTech & Higher Education'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 0, background: '#f4f6f9',
          borderRadius: 10, padding: 4, overflow: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)} style={{
              background: activeTab === t.id ? '#fff' : 'transparent',
              border: 'none', cursor: 'pointer',
              padding: '6px 12px', borderRadius: 8, fontSize: 12,
              fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? '#D01012' : '#5a6478',
              boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              whiteSpace: 'nowrap', transition: 'all .15s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {filtered.map((a, i) => <NewsCard key={i} article={a} index={i} />)}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40,
              color: '#9aa3b5', fontSize: 14 }}>
              No articles in this category right now.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { NewsTicker }

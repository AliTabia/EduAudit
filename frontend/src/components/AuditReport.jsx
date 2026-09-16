import React, { useState } from 'react'
import ScoreCard from './ScoreCard'
import GradeBadge from './GradeBadge'
import RecommendationsList from './RecommendationsList'
import BloomBadge from './BloomBadge'
import { scoreColor, formatDate, formatFileSize, scoreToPercent } from '../utils/helpers'

function Section({ title, children, icon }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{
        fontWeight: 700, fontSize: 16,
        color: 'var(--color-text)', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {icon && <span>{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  )
}

function MetaTag({ label, value }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 2,
      padding: '10px 16px',
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
    }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{value}</span>
    </div>
  )
}

function WritingScoreBar({ label, score }) {
  const pct = scoreToPercent(score)
  const color = scoreColor(score)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{score?.toFixed(1)}/10</span>
      </div>
      <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: 99,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

export default function AuditReport({ report, onNewAudit }) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!report) return null

  const { document: doc, scores, pedagogical_coherence: peda, writing_quality: writing,
    executive_summary, priority_recommendations, created_at,
    processing_time_seconds, llm_model_used } = report

  const tabs = [
    { id: 'overview',    label: 'Overview' },
    { id: 'pedagogical', label: 'Pedagogical Coherence' },
    { id: 'writing',     label: 'Writing Quality' },
    { id: 'recommendations', label: 'Recommendations' },
  ]

  return (
    <div>
      {/* Header card */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: 24,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(37,99,235,.15)',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Audit Report
              </div>
              <h2 style={{ fontWeight: 700, fontSize: 22, margin: 0, wordBreak: 'break-word' }}>
                {doc?.filename}
              </h2>
              <div style={{ marginTop: 6, fontSize: 13, color: '#94a3b8' }}>
                {formatDate(created_at)} · Processed in {processing_time_seconds?.toFixed(1)}s · Model: {llm_model_used}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {scores?.global_score?.toFixed(1)}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>/ 10</div>
              </div>
              <GradeBadge grade={scores?.grade} size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '2px solid var(--color-border)',
        marginBottom: 28,
        overflowX: 'auto',
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 20px',
            fontSize: 14, fontWeight: activeTab === t.id ? 600 : 400,
            color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: -2,
            transition: 'var(--transition)',
            whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div>
          {/* Score cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
            <ScoreCard label="Global Score" score={scores?.global_score} icon="⭐" size="lg" subtitle="Overall quality" />
            <ScoreCard label="Pedagogical" score={scores?.pedagogical_coherence} icon="📚" subtitle="Coherence" />
            <ScoreCard label="Writing Quality" score={scores?.writing_quality} icon="✍️" subtitle="Clarity & structure" />
          </div>

          {/* Document metadata */}
          <Section title="Document Information" icon="📄">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <MetaTag label="Format" value={doc?.format?.toUpperCase()} />
              <MetaTag label="Pages" value={doc?.page_count} />
              <MetaTag label="Word Count" value={doc?.word_count?.toLocaleString()} />
              <MetaTag label="File Size" value={formatFileSize(doc?.file_size_kb)} />
            </div>
          </Section>

          {/* Executive summary */}
          <Section title="Executive Summary" icon="📋">
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px 24px',
              fontSize: 14,
              lineHeight: 1.8,
              color: 'var(--color-text)',
              borderLeft: '4px solid var(--color-primary)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {executive_summary || 'No summary generated.'}
            </div>
          </Section>

          {/* Priority recommendations */}
          {priority_recommendations?.length > 0 && (
            <Section title="Top Priority Recommendations" icon="🎯">
              {priority_recommendations.map((rec, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '10px 14px', marginBottom: 6,
                  background: i === 0 ? '#fef2f2' : i === 1 ? '#fff7ed' : 'var(--color-bg)',
                  border: `1px solid ${i === 0 ? '#fecaca' : i === 1 ? '#fed7aa' : 'var(--color-border)'}`,
                  borderRadius: 8,
                }}>
                  <span style={{
                    fontWeight: 700, fontSize: 13,
                    color: i === 0 ? '#b91c1c' : i === 1 ? '#c2410c' : 'var(--color-primary)',
                    flexShrink: 0,
                    minWidth: 20,
                  }}>#{i + 1}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>{rec}</span>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}

      {/* ── PEDAGOGICAL TAB ── */}
      {activeTab === 'pedagogical' && peda && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
            <ScoreCard label="Overall" score={peda.overall_score} icon="📚" size="lg" />
            <ScoreCard label="Obj. Clarity" score={peda.objectives_clarity} icon="🎯" />
            <ScoreCard label="Content Align" score={peda.content_alignment} icon="🔗" />
            <ScoreCard label="Eval. Align" score={peda.evaluation_alignment} icon="📝" />
          </div>

          <BloomBadge analysis={peda.bloom_analysis} />

          <div style={{ marginTop: 20 }}>
            <RecommendationsList
              title="Pedagogical Feedback"
              recommendations={peda.recommendations}
              strengths={peda.strengths}
              weaknesses={peda.weaknesses}
            />
          </div>
        </div>
      )}

      {/* ── WRITING TAB ── */}
      {activeTab === 'writing' && writing && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
            <ScoreCard label="Overall" score={writing.overall_score} icon="✍️" size="lg" />
            <ScoreCard label="Clarity" score={writing.clarity_score} icon="💡" />
            <ScoreCard label="Structure" score={writing.structure_score} icon="🏗️" />
            <ScoreCard label="Readability" score={writing.readability_score} icon="👁️" />
            <ScoreCard label="Grammar" score={writing.spelling_grammar_score} icon="🔤" />
          </div>

          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            marginBottom: 20,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Score Breakdown</h4>
            <WritingScoreBar label="Clarity" score={writing.clarity_score} />
            <WritingScoreBar label="Structure" score={writing.structure_score} />
            <WritingScoreBar label="Readability" score={writing.readability_score} />
            <WritingScoreBar label="Spelling & Grammar" score={writing.spelling_grammar_score} />
          </div>

          <RecommendationsList
            title="Writing Feedback"
            recommendations={writing.recommendations}
            strengths={writing.strengths}
            weaknesses={writing.weaknesses}
          />
        </div>
      )}

      {/* ── RECOMMENDATIONS TAB ── */}
      {activeTab === 'recommendations' && (
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>All Recommendations</h3>
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pedagogical Coherence
            </h4>
            <RecommendationsList
              recommendations={peda?.recommendations || []}
              strengths={peda?.strengths || []}
              weaknesses={peda?.weaknesses || []}
            />
          </div>
          <div>
            <h4 style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Writing Quality
            </h4>
            <RecommendationsList
              recommendations={writing?.recommendations || []}
              strengths={writing?.strengths || []}
              weaknesses={writing?.weaknesses || []}
            />
          </div>
        </div>
      )}

      {/* New Audit button */}
      {onNewAudit && (
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <button onClick={onNewAudit} style={{
            background: 'var(--color-primary)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '12px 28px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-dark)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
          >
            ＋ Start a New Audit
          </button>
        </div>
      )}
    </div>
  )
}

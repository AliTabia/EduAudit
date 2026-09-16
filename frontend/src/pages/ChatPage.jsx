import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments, ragChat } from '../utils/api'

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display:'flex', justifyContent:isUser?'flex-end':'flex-start', marginBottom:12 }}>
      {!isUser && (
        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#D01012,#870a0c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, marginRight:10 }}>🤖</div>
      )}
      <div style={{
        maxWidth:'75%', padding:'10px 14px', borderRadius:isUser?'14px 14px 4px 14px':'14px 14px 14px 4px',
        background:isUser?'linear-gradient(135deg,#D01012,#a80d0f)':'#fff',
        color:isUser?'#fff':'#0f172a',
        border:isUser?'none':'1px solid #e4e8ef',
        boxShadow:'0 1px 4px rgba(0,0,0,.07)',
        fontSize:13, lineHeight:1.6,
        animation:'fadeInUp .25s ease both',
      }}>
        {msg.content}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid rgba(255,255,255,.2)' }}>
            <div style={{ fontSize:10, opacity:.7, fontWeight:600, marginBottom:4 }}>📎 Sources from document</div>
            {msg.sources.map((s,i) => (
              <div key={i} style={{ fontSize:10, opacity:.8, fontStyle:'italic' }}>{s}</div>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div style={{ width:32, height:32, borderRadius:'50%', background:'#f4f6f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, marginLeft:10 }}>👤</div>
      )}
    </div>
  )
}

const SUGGESTED = [
  'What are the main learning objectives?',
  'Summarize the key concepts of this document',
  'What topics are covered in this course?',
  'Are there any exercises or assessments?',
  'What Bloom\'s level does this document target?',
]

export default function ChatPage() {
  const { token } = useAuth()
  const [docs, setDocs]       = useState([])
  const [docId, setDocId]     = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    getDocuments(token).then(d => setDocs(d.documents || [])).catch(() => {})
  }, [token])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim() || !docId || loading) return
    const question = text.trim()
    setInput('')
    setError('')

    const userMsg = { role: 'user', content: question }
    setMessages(m => [...m, userMsg])
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const r = await ragChat(docId, question, history, token)
      setMessages(m => [...m, { role: 'assistant', content: r.answer, sources: r.sources }])
    } catch(e) {
      setError(e.message)
      setMessages(m => m.slice(0, -1)) // remove user msg on error
    } finally { setLoading(false) }
  }

  const selectedDoc = docs.find(d => d.doc_id === docId)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 124px)' }} className="fade-in-up">
      <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 }}>💬 Chat with Your Document</h1>
      <p style={{ color:'#64748b', fontSize:14, marginBottom:16 }}>Ask any question about your course material. Powered by RAG + AI.</p>

      {/* Doc selector */}
      <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:14, padding:'16px 20px', marginBottom:16, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <select value={docId} onChange={e => { setDocId(e.target.value); setMessages([]) }} style={{ padding:'9px 12px', borderRadius:10, border:'1.5px solid #e4e8ef', fontSize:13, fontFamily:'inherit', background:'#fafbfc', width:'100%' }}>
            <option value="">— Select a document to chat with —</option>
            {docs.map(d => <option key={d.doc_id} value={d.doc_id}>{d.filename}</option>)}
          </select>
        </div>
        {selectedDoc && (
          <div style={{ fontSize:12, color:'#64748b', background:'#f4f6f9', borderRadius:8, padding:'6px 12px' }}>
            📄 {selectedDoc.word_count?.toLocaleString()} words · {selectedDoc.format?.toUpperCase()} · {selectedDoc.page_count} pages
          </div>
        )}
      </div>

      {/* Chat area */}
      <div style={{ flex:1, background:'#f8fafc', border:'1px solid #e4e8ef', borderRadius:16, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          {!docId ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'#9aa3b5' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>💬</div>
              <div style={{ fontWeight:600, fontSize:16, marginBottom:6 }}>Select a document to start chatting</div>
              <div style={{ fontSize:13 }}>The AI will answer questions based on your document's content</div>
            </div>
          ) : messages.length === 0 ? (
            <div>
              <div style={{ textAlign:'center', padding:'20px', color:'#9aa3b5' }}>
                <div style={{ fontSize:40, marginBottom:8 }}>🤖</div>
                <div style={{ fontWeight:600, fontSize:15, color:'#374151', marginBottom:4 }}>EduAudit AI is ready</div>
                <div style={{ fontSize:13 }}>Ask me anything about <strong>{selectedDoc?.filename}</strong></div>
              </div>
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:12, color:'#9aa3b5', fontWeight:600, marginBottom:8, textAlign:'center' }}>Suggested questions</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
                  {SUGGESTED.map(s => (
                    <button key={s} onClick={() => sendMessage(s)} style={{
                      background:'#fff', border:'1px solid #e4e8ef', borderRadius:20,
                      padding:'7px 14px', fontSize:12, cursor:'pointer', color:'#374151',
                      transition:'all .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#D01012'; e.currentTarget.style.color = '#D01012' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e8ef'; e.currentTarget.style.color = '#374151' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => <Message key={i} msg={msg} />)
          )}

          {loading && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#D01012,#870a0c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🤖</div>
              <div style={{ background:'#fff', border:'1px solid #e4e8ef', borderRadius:'14px 14px 14px 4px', padding:'12px 16px', display:'flex', gap:4 }}>
                {[0,1,2].map(i => <span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#D01012', display:'inline-block', animation:`pulse-dot 1s ease ${i*.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid #e4e8ef', background:'#fff' }}>
          {error && <div style={{ fontSize:12, color:'#D01012', marginBottom:8 }}>⚠️ {error}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder={docId ? 'Ask a question about your document…' : 'Select a document first…'}
              disabled={!docId || loading}
              style={{
                flex:1, padding:'10px 14px', borderRadius:10, border:'1.5px solid #e4e8ef',
                fontSize:13, fontFamily:'inherit', outline:'none',
                background: !docId ? '#f4f6f9' : '#fff',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || !docId || loading}
              style={{
                padding:'10px 20px', background:'linear-gradient(135deg,#D01012,#a80d0f)',
                color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700,
                cursor:(!input.trim()||!docId||loading)?'not-allowed':'pointer',
                opacity:(!input.trim()||!docId||loading)?.5:1,
              }}
            >➤</button>
          </div>
          <div style={{ fontSize:11, color:'#9aa3b5', marginTop:6 }}>Press Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import EspritLogo from '../components/EspritLogo'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow]       = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setError('')
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try { await login(form.email, form.password); navigate('/') }
    catch (err) { setError(err.message || 'Login failed.') }
    finally { setLoading(false) }
  }

  return (
    <div style={S.page}>
      {/* Left panel — branding */}
      <div style={S.left}>
        <div style={S.leftInner}>
          <EspritLogo variant="white" height={64} />
          <h1 style={S.leftTitle}>EduAudit AI</h1>
          <p style={S.leftSub}>
            The AI-powered platform for auditing pedagogical content quality at ESPRIT.
          </p>
          <div style={S.featureList}>
            {['Pedagogical coherence analysis','Bloom\'s Taxonomy alignment','Writing quality scoring','Instant AI-generated reports'].map((f,i) => (
              <div key={i} style={S.featureItem}>
                <span style={S.featureDot} />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div style={S.leftFooter}>
          Honoris United Universities · ESPRIT © {new Date().getFullYear()}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={S.right}>
        <div style={S.card} className="fade-in-up">
          <div style={S.formHeader}>
            <div style={S.formIcon}>🎓</div>
            <div>
              <h2 style={S.formTitle}>Welcome back</h2>
              <p style={S.formSub}>Sign in to your teacher account</p>
            </div>
          </div>

          {error && <div style={S.errorBox}>⚠️ &nbsp;{error}</div>}

          <form onSubmit={handleSubmit} style={S.form}>
            <div style={S.field}>
              <label style={S.label}>Email address</label>
              <input
                type="email" value={form.email} onChange={set('email')}
                placeholder="you@esprit.tn" style={S.input} autoFocus
              />
            </div>
            <div style={S.field}>
              <label style={S.label}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={show ? 'text' : 'password'} value={form.password}
                  onChange={set('password')} placeholder="••••••••"
                  style={{ ...S.input, paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShow(s=>!s)} style={S.eyeBtn}>
                  {show ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              ...S.btn, opacity: loading ? 0.75 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                    <span style={S.spinner} />Signing in…
                  </span>
                : 'Sign In →'}
            </button>
          </form>

          <div style={S.divider}><span>New to EduAudit?</span></div>
          <Link to="/register" style={S.outlineBtn}>Create a teacher account</Link>
        </div>
      </div>
    </div>
  )
}

const S = {
  page: {
    minHeight:'100vh', display:'flex',
    fontFamily:'Inter,system-ui,sans-serif',
  },
  left: {
    width:'45%', minWidth:380,
    background:'linear-gradient(160deg,#D01012 0%,#870a0c 100%)',
    display:'flex', flexDirection:'column', justifyContent:'space-between',
    padding:'48px 52px',
    '@media(max-width:768px)':{ display:'none' },
  },
  leftInner:{ display:'flex', flexDirection:'column', gap:32 },
  leftTitle:{
    fontSize:34, fontWeight:800, color:'#fff',
    marginTop:28, lineHeight:1.1, letterSpacing:'-0.5px',
  },
  leftSub:{ fontSize:15, color:'rgba(255,255,255,.78)', lineHeight:1.7, maxWidth:320 },
  featureList:{ display:'flex', flexDirection:'column', gap:12, marginTop:8 },
  featureItem:{
    display:'flex', alignItems:'center', gap:12,
    fontSize:14, color:'rgba(255,255,255,.85)', fontWeight:500,
  },
  featureDot:{
    width:8, height:8, borderRadius:'50%',
    background:'rgba(255,255,255,.6)', flexShrink:0,
  },
  leftFooter:{ fontSize:11, color:'rgba(255,255,255,.4)', letterSpacing:'0.5px' },
  right:{
    flex:1, display:'flex', alignItems:'center', justifyContent:'center',
    background:'#f4f6f9', padding:'40px 24px',
  },
  card:{
    background:'#fff', borderRadius:20, padding:'44px 48px',
    width:'100%', maxWidth:440,
    boxShadow:'0 8px 40px rgba(0,0,0,.1)',
  },
  formHeader:{ display:'flex', alignItems:'center', gap:14, marginBottom:28 },
  formIcon:{
    width:48, height:48, borderRadius:12,
    background:'linear-gradient(135deg,#D01012,#870a0c)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:24, flexShrink:0,
  },
  formTitle:{ fontWeight:800, fontSize:22, color:'#0f172a', margin:0 },
  formSub:{ fontSize:13, color:'#64748b', marginTop:2 },
  errorBox:{
    background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10,
    padding:'11px 16px', fontSize:13, color:'#b91c1c', marginBottom:18,
    display:'flex', alignItems:'center',
  },
  form:{ display:'flex', flexDirection:'column', gap:18 },
  field:{ display:'flex', flexDirection:'column', gap:6 },
  label:{ fontWeight:600, fontSize:13, color:'#374151' },
  input:{
    padding:'11px 14px', borderRadius:10, fontSize:14,
    border:'1.5px solid #e4e8ef', fontFamily:'inherit',
    transition:'border-color .15s, box-shadow .15s', width:'100%',
    background:'#fafbfc',
  },
  eyeBtn:{
    position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
    background:'none', border:'none', cursor:'pointer', fontSize:16, lineHeight:1,
  },
  btn:{
    marginTop:4, padding:'13px',
    background:'linear-gradient(135deg,#D01012,#a80d0f)',
    color:'#fff', border:'none', borderRadius:12,
    fontSize:15, fontWeight:700, cursor:'pointer',
    boxShadow:'0 4px 16px rgba(208,16,18,.3)',
    transition:'opacity .15s, transform .1s',
  },
  spinner:{
    width:16, height:16, borderRadius:'50%',
    border:'2px solid rgba(255,255,255,.3)',
    borderTopColor:'#fff',
    display:'inline-block',
    animation:'spin 0.7s linear infinite',
  },
  divider:{
    textAlign:'center', margin:'22px 0 16px', position:'relative',
    fontSize:12, color:'#9aa3b5',
    '::before':{ content:'""' },
  },
  outlineBtn:{
    display:'block', textAlign:'center', padding:'11px',
    border:'1.5px solid #e4e8ef', borderRadius:12,
    fontSize:14, fontWeight:600, color:'#374151',
    transition:'border-color .15s, color .15s',
  },
}

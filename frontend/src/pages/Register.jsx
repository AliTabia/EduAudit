import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EspritIcon } from '../components/EspritLogo'

const SUBJECTS = ['','Mathematics','Physics','Chemistry','Computer Science',
  'Algorithms & Data Structures','Networks & Security','Databases',
  'Software Engineering','Artificial Intelligence','Web Development',
  'Statistics & Probability','Project Management','Business Intelligence',
  'English','French','Philosophy','Other']

const DEPARTMENTS = ['','Computer Science','Business','Engineering',
  'Mathematics','Sciences','Languages','Management','Other']

const COLORS = ['#D01012','#7c3aed','#0891b2','#059669','#d97706','#0f172a','#db2777','#9333ea']

const inputStyle = {
  padding:'10px 14px', borderRadius:10, border:'1.5px solid #e4e8ef',
  fontSize:14, fontFamily:'inherit', background:'#fafbfc', width:'100%',
  transition:'border-color .15s',
}
const labelStyle = { fontWeight:600, fontSize:13, color:'#374151' }

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name:'',last_name:'',email:'',password:'',confirm_password:'',
    subject:'',department:'',grade_level:'',avatar_color:'#D01012',
  })
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}))

  const next = e => {
    e.preventDefault(); setError('')
    if(!form.first_name.trim()) return setError('First name required.')
    if(!form.last_name.trim())  return setError('Last name required.')
    if(!form.email.trim())      return setError('Email required.')
    if(form.password.length<6)  return setError('Password must be 6+ characters.')
    if(form.password!==form.confirm_password) return setError('Passwords do not match.')
    setStep(2)
  }

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await register({ first_name:form.first_name, last_name:form.last_name,
        email:form.email, password:form.password, subject:form.subject,
        department:form.department, grade_level:form.grade_level })
      navigate('/')
    } catch(err){ setError(err.message||'Registration failed.') }
    finally{ setLoading(false) }
  }

  return (
    <div style={S.page}>
      {/* Left panel */}
      <div style={S.left}>
        <EspritIcon size={48} />
        <h2 style={S.leftTitle}>Join EduAudit AI</h2>
        <p style={S.leftSub}>Create your teacher account and start auditing your course materials with the power of AI.</p>
        <div style={S.steps}>
          {[{n:1,label:'Account Details'},{n:2,label:'Teaching Profile'}].map(s=>(
            <div key={s.n} style={S.stepRow}>
              <div style={{...S.stepDot, background:step>=s.n?'rgba(255,255,255,.9)':'rgba(255,255,255,.25)', color:step>=s.n?'#D01012':'rgba(255,255,255,.6)'}}>
                {step>s.n?'✓':s.n}
              </div>
              <span style={{fontSize:13,color:step>=s.n?'#fff':'rgba(255,255,255,.5)',fontWeight:step===s.n?600:400}}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div style={S.leftFooter}>Already have an account?{' '}
          <Link to="/login" style={{color:'rgba(255,255,255,.8)',fontWeight:600}}>Sign in</Link>
        </div>
      </div>

      {/* Right panel */}
      <div style={S.right}>
        <div style={S.card} className="fade-in-up">
          <div style={S.cardHeader}>
            <div style={S.stepPill}>{step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}</div>
            <h2 style={S.cardTitle}>{step===1?'Create your account':'Your teaching profile'}</h2>
            <p style={S.cardSub}>{step===1?'Fill in your credentials to get started':'Help us personalise your audit reports'}</p>
          </div>

          {error && <div style={S.errorBox}>⚠️ &nbsp;{error}</div>}

          {step===1 && (
            <form onSubmit={next} style={S.form}>
              <div style={S.row}>
                <div style={S.field}><label style={labelStyle}>First Name</label>
                  <input value={form.first_name} onChange={set('first_name')} placeholder="Amine" style={inputStyle} autoFocus/></div>
                <div style={S.field}><label style={labelStyle}>Last Name</label>
                  <input value={form.last_name} onChange={set('last_name')} placeholder="Ben Ali" style={inputStyle}/></div>
              </div>
              <div style={S.field}><label style={labelStyle}>Email</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="amine@esprit.tn" style={inputStyle}/></div>
              <div style={S.field}><label style={labelStyle}>Password</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" style={inputStyle}/></div>
              <div style={S.field}><label style={labelStyle}>Confirm Password</label>
                <input type="password" value={form.confirm_password} onChange={set('confirm_password')} placeholder="Repeat password" style={inputStyle}/></div>
              <button type="submit" style={S.btn}>Continue →</button>
            </form>
          )}

          {step===2 && (
            <form onSubmit={submit} style={S.form}>
              <div style={S.field}><label style={labelStyle}>Subject(s) you teach</label>
                <select value={form.subject} onChange={set('subject')} style={inputStyle}>
                  {SUBJECTS.map(s=><option key={s} value={s}>{s||'— Select subject —'}</option>)}</select></div>
              <div style={S.field}><label style={labelStyle}>Department / Option</label>
                <select value={form.department} onChange={set('department')} style={inputStyle}>
                  {DEPARTMENTS.map(d=><option key={d} value={d}>{d||'— Select department —'}</option>)}</select></div>
              <div style={S.field}><label style={labelStyle}>Grade Level(s)</label>
                <input value={form.grade_level} onChange={set('grade_level')} placeholder="e.g. 1st year, Master 1" style={inputStyle}/></div>
              <div style={S.field}>
                <label style={labelStyle}>Profile Colour</label>
                <div style={{display:'flex',gap:8,marginTop:4}}>
                  {COLORS.map(c=>(
                    <button key={c} type="button" onClick={()=>setForm(f=>({...f,avatar_color:c}))} style={{
                      width:28,height:28,borderRadius:'50%',background:c,border:'none',cursor:'pointer',
                      outline:form.avatar_color===c?`3px solid #0f172a`:'3px solid transparent',
                      outlineOffset:2,transition:'outline .12s',
                    }}/>))}
                </div>
              </div>
              <div style={{display:'flex',gap:10,marginTop:4}}>
                <button type="button" onClick={()=>setStep(1)} style={{...S.btn,background:'#f1f5f9',color:'#374151',boxShadow:'none',flex:'0 0 auto',paddingLeft:20,paddingRight:20}}>← Back</button>
                <button type="submit" disabled={loading} style={{...S.btn,flex:1,opacity:loading?.75:1}}>
                  {loading?'Creating account…':'Create Account 🎓'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const S = {
  page:{minHeight:'100vh',display:'flex',fontFamily:'Inter,system-ui,sans-serif'},
  left:{width:'38%',minWidth:320,background:'linear-gradient(160deg,#D01012,#870a0c)',
    display:'flex',flexDirection:'column',padding:'48px 44px',gap:24},
  leftTitle:{fontSize:28,fontWeight:800,color:'#fff',lineHeight:1.2},
  leftSub:{fontSize:14,color:'rgba(255,255,255,.75)',lineHeight:1.7},
  steps:{display:'flex',flexDirection:'column',gap:14,marginTop:8},
  stepRow:{display:'flex',alignItems:'center',gap:12},
  stepDot:{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',
    justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0},
  leftFooter:{fontSize:13,color:'rgba(255,255,255,.55)',marginTop:'auto'},
  right:{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
    background:'#f4f6f9',padding:'40px 24px'},
  card:{background:'#fff',borderRadius:20,padding:'40px 44px',width:'100%',
    maxWidth:480,boxShadow:'0 8px 40px rgba(0,0,0,.1)'},
  cardHeader:{marginBottom:24},
  stepPill:{display:'inline-block',background:'#fdf1f1',color:'#D01012',
    borderRadius:6,padding:'3px 10px',fontSize:11,fontWeight:700,
    letterSpacing:'0.5px',marginBottom:10},
  cardTitle:{fontWeight:800,fontSize:22,color:'#0f172a',marginBottom:4},
  cardSub:{fontSize:13,color:'#64748b'},
  errorBox:{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,
    padding:'10px 16px',fontSize:13,color:'#b91c1c',marginBottom:16,display:'flex',alignItems:'center'},
  form:{display:'flex',flexDirection:'column',gap:14},
  row:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
  field:{display:'flex',flexDirection:'column',gap:5},
  btn:{padding:'12px',background:'linear-gradient(135deg,#D01012,#a80d0f)',
    color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,
    cursor:'pointer',boxShadow:'0 4px 14px rgba(208,16,18,.28)'},
}

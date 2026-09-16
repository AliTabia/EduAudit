import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/Layout'

const SUBJECTS = ['','Mathematics','Physics','Chemistry','Computer Science',
  'Algorithms & Data Structures','Networks & Security','Databases',
  'Software Engineering','Artificial Intelligence','Web Development',
  'Statistics & Probability','Project Management','Business Intelligence',
  'English','French','Philosophy','Other']
const DEPARTMENTS = ['','Computer Science','Business','Engineering',
  'Mathematics','Sciences','Languages','Management','Other']
const COLORS = ['#D01012','#7c3aed','#0891b2','#059669','#d97706','#0f172a','#db2777','#9333ea']

const input = {
  padding:'10px 14px', borderRadius:10, border:'1.5px solid #e4e8ef',
  fontSize:14, fontFamily:'inherit', background:'#fafbfc', width:'100%',
  transition:'border-color .15s, box-shadow .15s',
}

function Card({ title, icon, children }) {
  return (
    <div style={{ background:'#fff', border:'1px solid var(--color-border)',
      borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow-sm)', marginBottom:20 }}>
      <div style={{ padding:'18px 24px', borderBottom:'1px solid #f0f2f7',
        display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:18 }}>{icon}</span>
        <span style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>{title}</span>
      </div>
      <div style={{ padding:'22px 24px' }}>{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
      <label style={{ fontWeight:600, fontSize:13, color:'#374151' }}>{label}</label>
      {children}
    </div>
  )
}

function Toast({ toast }) {
  if (!toast) return null
  const isErr = toast.type === 'error'
  return (
    <div style={{
      position:'fixed', top:24, right:24, zIndex:9999,
      background: isErr ? '#fef2f2' : '#fff',
      border:`1px solid ${isErr?'#fecaca':'#bbf7d0'}`,
      color: isErr ? '#b91c1c' : '#15803d',
      borderRadius:12, padding:'12px 20px', fontSize:14, fontWeight:600,
      boxShadow:'0 8px 32px rgba(0,0,0,.14)',
      display:'flex', alignItems:'center', gap:8,
      animation:'slideInRight .3s ease both',
    }}>
      {isErr ? '⚠️' : '✅'} {toast.msg}
    </div>
  )
}

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth()

  const [pf, setPf] = useState({
    first_name:  user?.first_name  || '',
    last_name:   user?.last_name   || '',
    subject:     user?.subject     || '',
    department:  user?.department  || '',
    grade_level: user?.grade_level || '',
    bio:         user?.bio         || '',
    avatar_color: user?.avatar_color || '#D01012',
  })
  const [pw, setPw]         = useState({ old_password:'', new_password:'', confirm:'' })
  const [saving, setSaving] = useState(false)
  const [savPw, setSavPw]   = useState(false)
  const [toast, setToast]   = useState(null)
  const [pwErr, setPwErr]   = useState('')

  const showToast = (msg, type='success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  const setP = k => e => setPf(f => ({ ...f, [k]: e.target.value }))

  const saveProfile = async e => {
    e.preventDefault(); setSaving(true)
    try { await updateProfile(pf); showToast('Profile saved successfully.') }
    catch(err){ showToast(err.message||'Failed to save.','error') }
    finally { setSaving(false) }
  }

  const savePw = async e => {
    e.preventDefault(); setPwErr('')
    if(pw.new_password.length<6) return setPwErr('New password must be 6+ characters.')
    if(pw.new_password!==pw.confirm) return setPwErr('Passwords do not match.')
    setSavPw(true)
    try {
      await changePassword(pw.old_password, pw.new_password)
      setPw({ old_password:'', new_password:'', confirm:'' })
      showToast('Password updated successfully.')
    } catch(err){ setPwErr(err.message||'Failed to update password.') }
    finally { setSavPw(false) }
  }

  const preview = { ...user, ...pf }

  return (
    <div>
      <Toast toast={toast} />

      {/* Profile hero */}
      <div style={{
        background: 'linear-gradient(120deg,#D01012,#870a0c)',
        borderRadius:20, padding:'28px 36px', marginBottom:24,
        display:'flex', alignItems:'center', gap:20, flexWrap:'wrap',
        boxShadow:'var(--shadow-red)', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', right:-30, top:-30, width:160, height:160,
          borderRadius:'50%', background:'rgba(255,255,255,.06)' }} />
        <Avatar user={preview} size={72} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>
            {preview.first_name} {preview.last_name}
          </div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,.7)', marginTop:4 }}>
            {preview.subject || 'No subject set'} · {preview.department || 'No department'}
          </div>
          {preview.grade_level && (
            <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:2 }}>{preview.grade_level}</div>
          )}
          <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:4 }}>{user?.email}</div>
        </div>
        {preview.bio && (
          <div style={{ fontSize:13, color:'rgba(255,255,255,.65)', maxWidth:360,
            lineHeight:1.6, borderLeft:'2px solid rgba(255,255,255,.3)', paddingLeft:14 }}>
            {preview.bio}
          </div>
        )}
      </div>

      {/* Edit profile form */}
      <Card title="Edit Profile" icon="✏️">
        <form onSubmit={saveProfile}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Field label="First Name">
              <input value={pf.first_name} onChange={setP('first_name')} style={input}/>
            </Field>
            <Field label="Last Name">
              <input value={pf.last_name} onChange={setP('last_name')} style={input}/>
            </Field>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Field label="Subject(s)">
              <select value={pf.subject} onChange={setP('subject')} style={input}>
                {SUBJECTS.map(s=><option key={s} value={s}>{s||'— Select —'}</option>)}
              </select>
            </Field>
            <Field label="Department">
              <select value={pf.department} onChange={setP('department')} style={input}>
                {DEPARTMENTS.map(d=><option key={d} value={d}>{d||'— Select —'}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Grade Level(s)">
            <input value={pf.grade_level} onChange={setP('grade_level')}
              placeholder="e.g. 1st year, Master 1" style={input}/>
          </Field>
          <Field label="Bio">
            <textarea value={pf.bio} onChange={setP('bio')}
              placeholder="A short description of your teaching experience…"
              style={{ ...input, resize:'vertical', minHeight:80 }}/>
          </Field>
          <Field label="Profile Colour">
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:2 }}>
              {COLORS.map(c => (
                <button key={c} type="button"
                  onClick={() => setPf(f=>({...f, avatar_color:c}))} style={{
                    width:30, height:30, borderRadius:'50%', background:c,
                    border:'none', cursor:'pointer',
                    outline: pf.avatar_color===c ? '3px solid #0f172a' : '3px solid transparent',
                    outlineOffset:2, transition:'outline .12s',
                  }}/>
              ))}
            </div>
          </Field>
          <button type="submit" disabled={saving} style={{
            background:'linear-gradient(135deg,#D01012,#a80d0f)',
            color:'#fff', border:'none', borderRadius:12,
            padding:'11px 28px', fontSize:14, fontWeight:700, cursor:'pointer',
            boxShadow:'var(--shadow-red)', opacity:saving?.75:1,
          }}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </form>
      </Card>

      {/* Change password */}
      <Card title="Change Password" icon="🔒">
        <form onSubmit={savePw} style={{ maxWidth:400 }}>
          {pwErr && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10,
              padding:'10px 14px', fontSize:13, color:'#b91c1c', marginBottom:14 }}>
              ⚠️ {pwErr}
            </div>
          )}
          <Field label="Current Password">
            <input type="password" value={pw.old_password}
              onChange={e=>setPw(p=>({...p,old_password:e.target.value}))} style={input}/>
          </Field>
          <Field label="New Password">
            <input type="password" value={pw.new_password}
              onChange={e=>setPw(p=>({...p,new_password:e.target.value}))} style={input}/>
          </Field>
          <Field label="Confirm New Password">
            <input type="password" value={pw.confirm}
              onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} style={input}/>
          </Field>
          <button type="submit" disabled={savPw} style={{
            background:'#0f172a', color:'#fff', border:'none', borderRadius:12,
            padding:'11px 28px', fontSize:14, fontWeight:700,
            cursor:'pointer', opacity:savPw?.75:1,
          }}>{savPw ? 'Updating…' : 'Update Password'}</button>
        </form>
      </Card>
    </div>
  )
}

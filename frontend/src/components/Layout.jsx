import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { EspritIcon } from './EspritLogo'

const NAV = [
  { path: '/',          labelKey: 'nav.dashboard',    descKey: 'nav.dashboard.desc',    icon: '▦',  group: 'main' },
  { path: '/audit',     labelKey: 'nav.newAudit',     descKey: 'nav.newAudit.desc',     icon: '＋',  group: 'main' },
  { path: '/history',   labelKey: 'nav.history',      descKey: 'nav.history.desc',      icon: '◷',  group: 'main' },
  { path: '/module',    labelKey: 'nav.moduleAudit',  descKey: 'nav.moduleAudit.desc',  icon: '📚', group: 'advanced' },
  { path: '/similarity',labelKey: 'nav.similarity',   descKey: 'nav.similarity.desc',   icon: '🔁', group: 'advanced' },
  { path: '/freshness', labelKey: 'nav.freshness',    descKey: 'nav.freshness.desc',    icon: '⚡', group: 'advanced' },
  { path: '/exam',      labelKey: 'nav.exam',         descKey: 'nav.exam.desc',         icon: '📝', group: 'advanced' },
  { path: '/chat',      labelKey: 'nav.chat',         descKey: 'nav.chat.desc',         icon: '💬', group: 'advanced' },
  { path: '/courseware',labelKey: 'nav.courseware',    descKey: 'nav.courseware.desc',    icon: '🌍', group: 'advanced' },
  { path: '/evolution', labelKey: 'nav.evolution',    descKey: 'nav.evolution.desc',    icon: '📈', group: 'advanced' },
  { path: '/outline',  labelKey: 'nav.outline',      descKey: 'nav.outline.desc',      icon: '🧠', group: 'advanced' },
  { path: '/profile',   labelKey: 'nav.profile',      descKey: 'nav.profile.desc',      icon: '👤', group: 'account' },
  { path: '/admin',     labelKey: 'nav.admin',        descKey: 'nav.admin.desc',        icon: '🛡️', group: 'admin' },
]

function Avatar({ user, size = 34 }) {
  const initials = `${user?.first_name?.[0]??''}${user?.last_name?.[0]??''}`.toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: user?.avatar_color || '#D01012',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: size * 0.36, flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,.2)',
    }}>{initials || '?'}</div>
  )
}
export { Avatar }

function NavItem({ item, pathname, collapsed }) {
  const { t } = useLang()
  const active = pathname === item.path
  return (
    <Link to={item.path} title={collapsed ? t(item.labelKey) : ''} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: collapsed ? '10px 0' : '9px 12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderRadius: 9, marginBottom: 2,
      color: active ? '#fff' : 'rgba(255,255,255,.5)',
      background: active ? 'linear-gradient(90deg,rgba(208,16,18,.45),rgba(208,16,18,.12))' : 'transparent',
      fontWeight: active ? 700 : 400, fontSize: 13,
      textDecoration: 'none', transition: 'all .15s',
      borderLeft: active ? '3px solid #D01012' : '3px solid transparent',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.06)' }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
      {!collapsed && (
        <div style={{ overflow: 'hidden' }}>
          <div style={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}>{t(item.labelKey)}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.28)', fontWeight: 400, marginTop: 1, whiteSpace: 'nowrap' }}>{t(item.descKey)}</div>
        </div>
      )}
      {active && !collapsed && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#D01012', boxShadow: '0 0 6px #D01012', flexShrink: 0 }} />}
    </Link>
  )
}

export default function Layout({ children }) {
  const { pathname }     = useLocation()
  const navigate         = useNavigate()
  const { user, logout } = useAuth()
  const { lang, switchLang, t } = useLang()
  const [collapsed, setCollapsed] = useState(false)
  const [dropOpen, setDropOpen]   = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const sideW = collapsed ? 68 : 248

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--color-bg)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: sideW, flexShrink: 0,
        background: '#0f172a',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        transition: 'width .22s ease',
        overflow: 'hidden',
        boxShadow: '2px 0 16px rgba(0,0,0,.18)',
        zIndex: 100,
      }}>

        {/* Logo area */}
        <div style={{
          padding: collapsed ? '20px 16px' : '20px 20px 18px',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          display: 'flex', alignItems: 'center', gap: 12, minHeight: 72,
        }}>
          <EspritIcon size={36} />
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#fff',
                letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>EduAudit AI</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)',
                marginTop: 1, whiteSpace: 'nowrap' }}>ESPRIT · Honoris</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {/* Group: Main */}
          {!collapsed && <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,.25)', letterSpacing:'1px', textTransform:'uppercase', padding:'4px 12px 6px' }}>{lang === 'fr' ? 'Principal' : 'Main'}</div>}
          {NAV.filter(n => n.group === 'main').map(item => <NavItem key={item.path} item={item} pathname={pathname} collapsed={collapsed} />)}

          {/* Group: Advanced */}
          {!collapsed && <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,.25)', letterSpacing:'1px', textTransform:'uppercase', padding:'12px 12px 6px' }}>{lang === 'fr' ? 'IA Avancée' : 'Advanced AI'}</div>}
          {collapsed && <div style={{ height:8 }} />}
          {NAV.filter(n => n.group === 'advanced').map(item => <NavItem key={item.path} item={item} pathname={pathname} collapsed={collapsed} />)}

          {/* Group: Account */}
          {!collapsed && <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,.25)', letterSpacing:'1px', textTransform:'uppercase', padding:'12px 12px 6px' }}>{lang === 'fr' ? 'Compte' : 'Account'}</div>}
          {collapsed && <div style={{ height:8 }} />}
          {NAV.filter(n => n.group === 'account').map(item => <NavItem key={item.path} item={item} pathname={pathname} collapsed={collapsed} />)}

          {/* Admin — only if is_admin */}
          {user?.is_admin && (
            <>
              {!collapsed && <div style={{ fontSize:9, fontWeight:700, color:'rgba(208,16,18,.7)', letterSpacing:'1px', textTransform:'uppercase', padding:'12px 12px 6px' }}>Admin</div>}
              {collapsed && <div style={{ height:8 }} />}
              {NAV.filter(n => n.group === 'admin').map(item => <NavItem key={item.path} item={item} pathname={pathname} collapsed={collapsed} />)}
            </>
          )}
        </nav>

        {/* User mini-card */}
        {!collapsed && user && (
          <div style={{
            margin: '0 10px 8px',
            padding: '10px 12px',
            background: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar user={user} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.first_name} {user.last_name}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.38)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.subject || user.email}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(c => !c)} style={{
          margin: '0 10px 12px', padding: '9px',
          background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 10, color: 'rgba(255,255,255,.4)',
          cursor: 'pointer', fontSize: 13, textAlign: 'center',
          transition: 'all .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.4)'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? '▶' : '◀ Collapse'}
        </button>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 28px', height: 60,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 8px rgba(0,0,0,.06)',
        }}>
          {/* Page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 4, height: 20, borderRadius: 2,
              background: '#D01012', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
              {t(NAV.find(n => n.path === pathname)?.labelKey ?? 'nav.dashboard')}
            </span>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Language toggle */}
            <div style={{
              display: 'flex', alignItems: 'center',
              background: '#f4f6f9', borderRadius: 20, padding: 3,
              border: '1px solid #e4e8ef',
            }}>
              <button onClick={() => switchLang('fr')} style={{
                padding: '4px 10px', borderRadius: 16, border: 'none',
                background: lang === 'fr' ? '#D01012' : 'transparent',
                color: lang === 'fr' ? '#fff' : '#5a6478',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all .15s',
              }}>FR</button>
              <button onClick={() => switchLang('en')} style={{
                padding: '4px 10px', borderRadius: 16, border: 'none',
                background: lang === 'en' ? '#D01012' : 'transparent',
                color: lang === 'en' ? '#fff' : '#5a6478',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all .15s',
              }}>EN</button>
            </div>

            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: '#5a6478',
              background: '#f4f6f9', borderRadius: 20, padding: '5px 12px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%',
                background: '#16a34a', display: 'inline-block',
                animation: 'pulse-dot 2s ease-in-out infinite' }} />
              Platform Online
            </div>

            {/* User dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setDropOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                background: dropOpen ? '#f4f6f9' : 'none',
                border: '1px solid', borderColor: dropOpen ? '#e4e8ef' : 'transparent',
                borderRadius: 10, padding: '6px 12px 6px 8px',
                cursor: 'pointer', transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f4f6f9'; e.currentTarget.style.borderColor = '#e4e8ef' }}
              onMouseLeave={e => { if (!dropOpen) { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent' } }}
              >
                <Avatar user={user} size={32} />
                <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div style={{ fontSize: 10, color: '#9aa3b5' }}>
                    {user?.subject || 'Teacher'}
                  </div>
                </div>
                <span style={{ color: '#9aa3b5', fontSize: 11,
                  transform: dropOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform .15s' }}>▾</span>
              </button>

              {dropOpen && (
                <>
                  <div style={{ position:'fixed', inset:0, zIndex:19 }}
                    onClick={() => setDropOpen(false)} />
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    zIndex: 20, background: '#fff',
                    border: '1px solid var(--color-border)', borderRadius: 14,
                    boxShadow: '0 8px 32px rgba(0,0,0,.12)',
                    minWidth: 220, overflow: 'hidden',
                  }}>
                    {/* User header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f2f7',
                      display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Avatar user={user} size={42} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                          {user?.first_name} {user?.last_name}
                        </div>
                        <div style={{ fontSize: 11, color: '#9aa3b5', marginTop: 1 }}>{user?.email}</div>
                      </div>
                    </div>
                    {/* Badges */}
                    {(user?.subject || user?.department) && (
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0f2f7',
                        display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {user.subject && <span style={{ fontSize: 11, background: '#fdf1f1',
                          color: '#D01012', borderRadius: 5, padding: '2px 8px', fontWeight: 600 }}>
                          {user.subject}</span>}
                        {user.department && <span style={{ fontSize: 11, background: '#f5f3ff',
                          color: '#7c3aed', borderRadius: 5, padding: '2px 8px', fontWeight: 600 }}>
                          {user.department}</span>}
                      </div>
                    )}
                    {/* Actions */}
                    <div style={{ padding: '6px' }}>
                      {[
                        { icon: '👤', label: t('common.editProfile'), action: () => { navigate('/profile'); setDropOpen(false) } },
                        { icon: '◷',  label: t('common.myAudits'),   action: () => { navigate('/history'); setDropOpen(false) } },
                        { icon: '🚪', label: t('common.signOut'),    action: handleLogout, red: true },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} style={{
                          display: 'flex', width: '100%', alignItems: 'center', gap: 10,
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '9px 12px', borderRadius: 8, fontSize: 13,
                          color: item.red ? '#D01012' : '#374151', fontWeight: 500,
                          transition: 'background .12s', textAlign: 'left',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = item.red ? '#fdf1f1' : '#f4f6f9'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <span>{item.icon}</span>{item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 32px',
          maxWidth: 1280, width: '100%', margin: '0 auto',
          animation: 'fadeInUp .3s ease both' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

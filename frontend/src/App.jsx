import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LangProvider } from './context/LangContext'
import Layout from './components/Layout'

// Core pages (eager)
import Dashboard    from './pages/Dashboard'
import NewAudit     from './pages/NewAudit'
import History      from './pages/History'
import Profile      from './pages/Profile'
import Login        from './pages/Login'
import Register     from './pages/Register'

// Advanced pages (lazy)
const SimilarityPage  = lazy(() => import('./pages/SimilarityPage'))
const ExamPage        = lazy(() => import('./pages/ExamPage'))
const ChatPage        = lazy(() => import('./pages/ChatPage'))
const AdminPage       = lazy(() => import('./pages/AdminPage'))
const ModuleAuditPage = lazy(() => import('./pages/ModuleAuditPage'))
const FreshnessPage   = lazy(() => import('./pages/FreshnessPage'))
const CoursewarePage   = lazy(() => import('./pages/CoursewarePage'))
const EvolutionPage    = lazy(() => import('./pages/EvolutionPage'))
const OutlinePage      = lazy(() => import('./pages/OutlinePage'))

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0f172a,#D01012)', color:'#fff', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:52 }}>🎓</div>
      <div style={{ fontWeight:700, fontSize:18 }}>EduAudit AI</div>
      <div style={{ fontSize:13, opacity:.6 }}>Loading…</div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

function Wrap({ component: Component }) {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<div style={{ textAlign:'center', padding:60, color:'#9aa3b5' }}>Loading…</div>}>
          <Component />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      <Route path="/"          element={<Wrap component={Dashboard} />} />
      <Route path="/audit"     element={<Wrap component={NewAudit} />} />
      <Route path="/history"   element={<Wrap component={History} />} />
      <Route path="/profile"   element={<Wrap component={Profile} />} />
      <Route path="/similarity"element={<Wrap component={SimilarityPage} />} />
      <Route path="/exam"      element={<Wrap component={ExamPage} />} />
      <Route path="/chat"      element={<Wrap component={ChatPage} />} />
      <Route path="/admin"     element={<Wrap component={AdminPage} />} />
      <Route path="/module"    element={<Wrap component={ModuleAuditPage} />} />
      <Route path="/freshness" element={<Wrap component={FreshnessPage} />} />
      <Route path="/courseware"element={<Wrap component={CoursewarePage} />} />
      <Route path="/evolution" element={<Wrap component={EvolutionPage} />} />
      <Route path="/outline"   element={<Wrap component={OutlinePage} />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  )
}

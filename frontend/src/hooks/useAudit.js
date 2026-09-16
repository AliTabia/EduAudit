/**
 * Custom hooks — manage the upload → audit lifecycle and history.
 * Token is read from AuthContext automatically.
 */

import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import {
  uploadDocument, runAudit, getAuditHistory,
  getAuditStats, getAuditReport,
} from '../utils/api'

export function useAudit() {
  const { token } = useAuth()
  const { lang }  = useLang()
  const [uploading, setUploading]     = useState(false)
  const [auditing, setAuditing]       = useState(false)
  const [uploadedDoc, setUploadedDoc] = useState(null)
  const [auditReport, setAuditReport] = useState(null)
  const [error, setError]             = useState(null)
  const [step, setStep]               = useState('idle')

  const reset = useCallback(() => {
    setUploading(false); setAuditing(false)
    setUploadedDoc(null); setAuditReport(null)
    setError(null); setStep('idle')
  }, [])

  const upload = useCallback(async (file) => {
    setError(null); setUploading(true); setStep('uploading')
    try {
      const doc = await uploadDocument(file, token)
      setUploadedDoc(doc); setStep('uploaded')
      return doc
    } catch (e) {
      setError(e.message); setStep('error'); throw e
    } finally { setUploading(false) }
  }, [token])

  const audit = useCallback(async (docId, criteria, language = 'auto') => {
    setError(null); setAuditing(true); setStep('auditing')
    try {
      const report = await runAudit(docId, criteria, language, token)
      setAuditReport(report); setStep('done')
      return report
    } catch (e) {
      setError(e.message); setStep('error'); throw e
    } finally { setAuditing(false) }
  }, [token])

  const loadReport = useCallback(async (auditId) => {
    setError(null)
    try {
      const report = await getAuditReport(auditId, token)
      setAuditReport(report); setStep('done')
      return report
    } catch (e) { setError(e.message); throw e }
  }, [token])

  return { uploading, auditing, uploadedDoc, auditReport, error, step, upload, audit, loadReport, reset }
}

export function useHistory() {
  const { token } = useAuth()
  const [history, setHistory] = useState([])
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [h, s] = await Promise.all([getAuditHistory(token), getAuditStats(token)])
      setHistory(h.items || []); setStats(s)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [token])

  return { history, stats, loading, error, refresh }
}

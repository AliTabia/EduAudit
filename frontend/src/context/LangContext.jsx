/**
 * LangContext — Global language switcher (FR / EN).
 * Persists choice in localStorage.
 * All components use `t(key)` to get translated strings.
 */

import React, { createContext, useContext, useState, useCallback } from 'react'

const LangContext = createContext(null)

const TRANSLATIONS = {
  // ── Navigation ─────────────────────────────────────────────────────────
  'nav.dashboard':      { fr: 'Tableau de bord',       en: 'Dashboard' },
  'nav.newAudit':       { fr: 'Nouvel Audit',          en: 'New Audit' },
  'nav.history':        { fr: 'Historique',            en: 'History' },
  'nav.moduleAudit':    { fr: 'Audit Module',          en: 'Module Audit' },
  'nav.similarity':     { fr: 'Similarité',            en: 'Similarity' },
  'nav.freshness':      { fr: 'Détecteur de Tendances',en: 'Trend Detector' },
  'nav.exam':           { fr: 'Générateur d\'Examen',  en: 'Exam Generator' },
  'nav.chat':           { fr: 'Chat avec Doc',         en: 'Chat with Doc' },
  'nav.courseware':     { fr: 'Comparaison Mondiale',  en: 'Courseware Comparison' },
  'nav.evolution':     { fr: 'Évolution Qualité',     en: 'Quality Evolution' },
  'nav.outline':       { fr: 'Générateur de Programme', en: 'Course Outline Generator' },
  'nav.profile':        { fr: 'Mon Profil',            en: 'My Profile' },
  'nav.admin':          { fr: 'Administration',        en: 'Admin' },

  // ── Navigation descriptions ────────────────────────────────────────────
  'nav.dashboard.desc':   { fr: 'Vue d\'ensemble',         en: 'Overview & stats' },
  'nav.newAudit.desc':    { fr: 'Auditer un document',     en: 'Audit a document' },
  'nav.history.desc':     { fr: 'Audits passés',           en: 'Past audits' },
  'nav.moduleAudit.desc': { fr: 'Audit multi-documents',   en: 'Multi-doc audit' },
  'nav.similarity.desc':  { fr: 'Détection de plagiat',    en: 'Plagiarism detection' },
  'nav.freshness.desc':   { fr: 'Contenu obsolète',        en: 'Outdated content scan' },
  'nav.exam.desc':        { fr: 'Génération auto d\'exams',en: 'Auto-generate exams' },
  'nav.chat.desc':        { fr: 'Chat propulsé par RAG',   en: 'RAG-powered chat' },
  'nav.courseware.desc':  { fr: 'Benchmark MIT/Stanford',  en: 'MIT/Stanford benchmark' },
  'nav.evolution.desc':  { fr: 'Suivi de progression',    en: 'Score improvement tracking' },
  'nav.outline.desc':   { fr: 'Créer un programme complet', en: 'Generate full syllabus' },
  'nav.profile.desc':     { fr: 'Paramètres du compte',    en: 'Account settings' },
  'nav.admin.desc':       { fr: 'Tableau de bord département', en: 'Department dashboard' },

  // ── Common ─────────────────────────────────────────────────────────────
  'common.loading':     { fr: 'Chargement…',           en: 'Loading…' },
  'common.error':       { fr: 'Erreur',                en: 'Error' },
  'common.save':        { fr: 'Enregistrer',           en: 'Save' },
  'common.cancel':      { fr: 'Annuler',               en: 'Cancel' },
  'common.back':        { fr: '← Retour',              en: '← Back' },
  'common.viewAll':     { fr: 'Voir tout →',           en: 'View all →' },
  'common.search':      { fr: 'Rechercher…',           en: 'Search…' },
  'common.noResults':   { fr: 'Aucun résultat',        en: 'No results' },
  'common.online':      { fr: 'Plateforme en ligne',   en: 'Platform Online' },
  'common.signOut':     { fr: 'Déconnexion',           en: 'Sign Out' },
  'common.editProfile': { fr: 'Modifier le profil',    en: 'Edit Profile' },
  'common.myAudits':    { fr: 'Mes Audits',            en: 'My Audits' },
  'common.language':    { fr: 'Langue',                en: 'Language' },

  // ── Auth ───────────────────────────────────────────────────────────────
  'auth.welcome':       { fr: 'Bienvenue',             en: 'Welcome back' },
  'auth.signIn':        { fr: 'Connexion',             en: 'Sign In' },
  'auth.signInSub':     { fr: 'Connectez-vous à votre compte enseignant', en: 'Sign in to your teacher account' },
  'auth.email':         { fr: 'Adresse email',         en: 'Email address' },
  'auth.password':      { fr: 'Mot de passe',          en: 'Password' },
  'auth.signingIn':     { fr: 'Connexion en cours…',   en: 'Signing in…' },
  'auth.noAccount':     { fr: 'Pas encore de compte ?',en: 'Don\'t have an account?' },
  'auth.createAccount': { fr: 'Créer un compte',       en: 'Create one' },
  'auth.hasAccount':    { fr: 'Déjà un compte ?',      en: 'Already have an account?' },
  'auth.signInLink':    { fr: 'Se connecter',          en: 'Sign in' },
  'auth.register':      { fr: 'Créer votre compte',    en: 'Create your account' },
  'auth.registerSub':   { fr: 'Rejoignez EduAudit AI en tant qu\'enseignant', en: 'Join EduAudit AI as a teacher' },
  'auth.firstName':     { fr: 'Prénom',                en: 'First Name' },
  'auth.lastName':      { fr: 'Nom',                   en: 'Last Name' },
  'auth.confirmPw':     { fr: 'Confirmer le mot de passe', en: 'Confirm Password' },
  'auth.continue':      { fr: 'Continuer →',           en: 'Continue →' },
  'auth.creating':      { fr: 'Création en cours…',    en: 'Creating account…' },
  'auth.step1':         { fr: 'Détails du compte',     en: 'Account Details' },
  'auth.step2':         { fr: 'Profil Enseignant',     en: 'Teaching Profile' },

  // ── Profile ────────────────────────────────────────────────────────────
  'profile.title':      { fr: 'Mon Profil',            en: 'My Profile' },
  'profile.subtitle':   { fr: 'Gérez votre profil enseignant et vos paramètres.', en: 'Manage your teacher profile and account settings.' },
  'profile.subject':    { fr: 'Matière(s) enseignée(s)',en: 'Subject(s) you teach' },
  'profile.department': { fr: 'Département / Option',  en: 'Department / Option' },
  'profile.gradeLevel': { fr: 'Niveau(x)',             en: 'Grade Level(s)' },
  'profile.bio':        { fr: 'Biographie',            en: 'Bio' },
  'profile.color':      { fr: 'Couleur du profil',     en: 'Profile Colour' },
  'profile.changePw':   { fr: 'Changer le mot de passe', en: 'Change Password' },
  'profile.currentPw':  { fr: 'Mot de passe actuel',   en: 'Current Password' },
  'profile.newPw':      { fr: 'Nouveau mot de passe',  en: 'New Password' },
  'profile.confirmPw':  { fr: 'Confirmer le nouveau',  en: 'Confirm New Password' },
  'profile.updatePw':   { fr: 'Mettre à jour',         en: 'Update Password' },
  'profile.saved':      { fr: 'Profil enregistré avec succès.', en: 'Profile saved successfully.' },
  'profile.pwUpdated':  { fr: 'Mot de passe mis à jour.', en: 'Password updated successfully.' },

  // ── Dashboard ──────────────────────────────────────────────────────────
  'dash.greeting.morning':   { fr: 'Bonjour',          en: 'Good morning' },
  'dash.greeting.afternoon': { fr: 'Bon après-midi',   en: 'Good afternoon' },
  'dash.greeting.evening':   { fr: 'Bonsoir',          en: 'Good evening' },
  'dash.totalAudits':   { fr: 'Total Audits',          en: 'Total Audits' },
  'dash.avgScore':      { fr: 'Score Moyen',           en: 'Average Score' },
  'dash.highest':       { fr: 'Meilleur Score',        en: 'Highest Score' },
  'dash.lowest':        { fr: 'Score le plus bas',     en: 'Lowest Score' },
  'dash.recentAudits':  { fr: 'Audits Récents',        en: 'Recent Audits' },
  'dash.gradeDistrib':  { fr: 'Répartition des Notes', en: 'Grade Distribution' },
  'dash.newAudit':      { fr: '＋ Nouvel Audit',        en: '＋ New Audit' },
  'dash.noAudits':      { fr: 'Aucun audit pour le moment', en: 'No audits yet' },
  'dash.firstAudit':    { fr: 'Lancez votre premier audit', en: 'Run your first audit' },
  'dash.news':          { fr: 'Actualités & Tendances',en: 'News & Trends' },

  // ── Audit ──────────────────────────────────────────────────────────────
  'audit.upload':       { fr: 'Téléverser un Document', en: 'Upload Document' },
  'audit.uploadSub':    { fr: 'Téléversez un PDF, PPTX ou DOCX à auditer.', en: 'Upload a PDF, PPTX, or DOCX educational document to audit.' },
  'audit.dragDrop':     { fr: 'Glissez-déposez votre document', en: 'Drag & drop your document' },
  'audit.orBrowse':     { fr: 'ou cliquez pour parcourir', en: 'or click to browse' },
  'audit.selectCriteria':{ fr: 'Sélectionner les critères d\'audit', en: 'Select Audit Criteria' },
  'audit.pedagogical':  { fr: 'Cohérence Pédagogique', en: 'Pedagogical Coherence' },
  'audit.pedagogicalDesc': { fr: 'Analyse l\'alignement entre objectifs, contenu et évaluations selon la taxonomie de Bloom.', en: 'Analyzes alignment between learning objectives, content, and assessments using Bloom\'s Taxonomy.' },
  'audit.writing':      { fr: 'Qualité Rédactionnelle',en: 'Writing Quality' },
  'audit.writingDesc':  { fr: 'Évalue la clarté, la structure, la lisibilité et la grammaire.', en: 'Evaluates clarity, structure, readability, spelling, and grammar.' },
  'audit.docLanguage':  { fr: 'Langue du Document',    en: 'Document Language' },
  'audit.autoDetect':   { fr: 'Détection automatique', en: 'Auto-detect' },
  'audit.runAudit':     { fr: '🔍 Lancer l\'Audit',    en: '🔍 Run Audit' },
  'audit.analyzing':    { fr: 'Analyse en cours…',     en: 'Analyzing Your Document' },
  'audit.analyzingSub': { fr: 'L\'IA effectue une analyse approfondie. Cela prend 15 à 60 secondes.', en: 'The AI is performing a deep analysis. This typically takes 15–60 seconds.' },
  'audit.success':      { fr: 'Document téléversé avec succès', en: 'Document uploaded successfully' },
  'audit.uploadDiff':   { fr: '← Changer de fichier',  en: '← Upload Different File' },

  // ── Exam ───────────────────────────────────────────────────────────────
  'exam.title':         { fr: '📝 Générateur Automatique d\'Examen', en: '📝 Automatic Exam Generator' },
  'exam.subtitle':      { fr: 'Générez des QCM, questions ouvertes et études de cas calibrés au niveau Bloom.', en: 'Generate MCQs, open questions, and case studies calibrated to your document\'s Bloom level.' },
  'exam.generate':      { fr: '⚙️ Générer l\'Examen',  en: '⚙️ Generate Exam' },
  'exam.generating':    { fr: '⚙️ Génération…',        en: '⚙️ Generating…' },
  'exam.download':      { fr: '⬇ Télécharger .txt',    en: '⬇ Download .txt' },

  // ── Similarity ─────────────────────────────────────────────────────────
  'sim.title':          { fr: 'Moteur de Similarité & Plagiat', en: 'AI Similarity & Plagiarism Engine' },
  'sim.subtitle':       { fr: 'Détectez le contenu dupliqué ou chevauchant dans votre corpus.', en: 'Detect duplicate or overlapping content across your document corpus.' },
  'sim.scan':           { fr: '📡 Scanner le Corpus',   en: '📡 Corpus Scan' },
  'sim.compare':        { fr: '⚖️ Comparer Deux',      en: '⚖️ Compare Two' },

  // ── Chat ───────────────────────────────────────────────────────────────
  'chat.title':         { fr: '💬 Discuter avec votre Document', en: '💬 Chat with Your Document' },
  'chat.subtitle':      { fr: 'Posez n\'importe quelle question sur votre support de cours.', en: 'Ask any question about your course material.' },
  'chat.placeholder':   { fr: 'Posez une question sur votre document…', en: 'Ask a question about your document…' },
  'chat.selectDoc':     { fr: '— Sélectionnez un document —', en: '— Select a document to chat with —' },

  // ── Freshness ──────────────────────────────────────────────────────────
  'fresh.title':        { fr: '🔍 Détecteur de Tendances & Fraîcheur', en: '🔍 AI Trend & Freshness Detector' },
  'fresh.subtitle':     { fr: 'Identifiez les technologies obsolètes et les développements manquants.', en: 'Identify outdated technologies and missing recent developments.' },
  'fresh.analyze':      { fr: '⚡ Analyser la Fraîcheur', en: '⚡ Analyze Freshness' },

  // ── Module Audit ───────────────────────────────────────────────────────
  'module.title':       { fr: '📚 Audit de Module Multi-Documents', en: '📚 Multi-Document Module Audit' },
  'module.subtitle':    { fr: 'Auditez un module complet — vérifiez la progression, Bloom, redondances et lacunes.', en: 'Audit a full course module — check progression, Bloom escalation, redundancy, and coverage gaps.' },
  'module.name':        { fr: 'Nom du Module',         en: 'Module Name' },
  'module.selectDocs':  { fr: 'Sélectionner les Documents', en: 'Select Documents for Module' },
  'module.run':         { fr: '📚 Auditer le Module',   en: '📚 Audit Module' },

  // ── Admin ──────────────────────────────────────────────────────────────
  'admin.title':        { fr: 'Tableau de Bord Administrateur', en: 'Admin Dashboard' },
  'admin.subtitle':     { fr: 'Statistiques d\'audit pour l\'ensemble de la plateforme ESPRIT', en: 'Platform-wide audit analytics for ESPRIT' },
  'admin.teachers':     { fr: '👥 Enseignants',        en: '👥 Teachers' },
  'admin.rankings':     { fr: '🏆 Classement',         en: '🏆 Rankings' },
  'admin.overview':     { fr: '📊 Vue d\'ensemble',     en: '📊 Overview' },

  // ── Report ─────────────────────────────────────────────────────────────
  'report.title':       { fr: 'Rapport d\'Audit',      en: 'Audit Report' },
  'report.overview':    { fr: 'Vue d\'ensemble',        en: 'Overview' },
  'report.pedagogical': { fr: 'Cohérence Pédagogique', en: 'Pedagogical Coherence' },
  'report.writing':     { fr: 'Qualité Rédactionnelle',en: 'Writing Quality' },
  'report.recommendations': { fr: 'Recommandations',   en: 'Recommendations' },
  'report.summary':     { fr: 'Résumé Exécutif',       en: 'Executive Summary' },
  'report.strengths':   { fr: 'Points Forts',          en: 'Strengths' },
  'report.weaknesses':  { fr: 'Points Faibles',        en: 'Weaknesses' },
  'report.downloadPdf': { fr: '📄 Télécharger PDF',    en: '📄 Download PDF' },
  'report.newAudit':    { fr: '＋ Lancer un Nouvel Audit', en: '＋ Start a New Audit' },
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('edu_lang') || 'fr')

  const switchLang = useCallback((newLang) => {
    const l = newLang === 'fr' ? 'fr' : 'en'
    localStorage.setItem('edu_lang', l)
    setLang(l)
  }, [])

  const t = useCallback((key) => {
    const entry = TRANSLATIONS[key]
    if (!entry) return key
    return entry[lang] || entry.en || key
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be inside LangProvider')
  return ctx
}

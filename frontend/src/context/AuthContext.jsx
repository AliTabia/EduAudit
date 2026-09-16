/**
 * AuthContext — global auth state.
 * Persists JWT in localStorage. Provides login, logout, register, updateProfile.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('edu_token') || null)
  const [loading, setLoading] = useState(true)  // checking stored token on mount
  const [error, setError]     = useState(null)

  // On mount: if we have a stored token, fetch the user profile to validate it
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api.getMe(token)
      .then(u => setUser(u))
      .catch(() => {
        // Token invalid/expired — clear it
        localStorage.removeItem('edu_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const _persist = (tok, usr) => {
    localStorage.setItem('edu_token', tok)
    setToken(tok)
    setUser(usr)
    setError(null)
  }

  const login = useCallback(async (email, password) => {
    setError(null)
    const data = await api.login(email, password)
    _persist(data.access_token, data.user)
    return data.user
  }, [])

  const register = useCallback(async (fields) => {
    setError(null)
    const data = await api.register(fields)
    _persist(data.access_token, data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('edu_token')
    setToken(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (fields) => {
    const updated = await api.updateProfile(token, fields)
    setUser(updated)
    return updated
  }, [token])

  const changePassword = useCallback(async (oldPw, newPw) => {
    return api.changePassword(token, oldPw, newPw)
  }, [token])

  return (
    <AuthContext.Provider value={{
      user, token, loading, error,
      isAuthenticated: !!user,
      login, register, logout, updateProfile, changePassword,
      setError,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

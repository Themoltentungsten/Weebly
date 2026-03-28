import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api, { setAuthToken } from '../api/client'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const refreshMe = useCallback(async () => {
    const t = localStorage.getItem('token')
    if (!t) {
      setUser(null)
      setReady(true)
      return
    }
    setAuthToken(t)
    try {
      const { data } = await api.get('/api/auth/me', { timeout: 12000 })
      setUser(data)
    } catch {
      setAuthToken(null)
      setUser(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    refreshMe()
  }, [refreshMe])

  const login = async (username, password) => {
    const { data } = await api.post('/api/auth/login', { username, password })
    setAuthToken(data.token)
    setUser({ id: data.user.id, username: data.user.username, email: data.user.email, isAdmin: data.user.isAdmin })
    toast.success('Welcome back!')
  }

  const signup = async (username, email, password) => {
    const { data } = await api.post('/api/auth/signup', { username, email, password })
    setAuthToken(data.token)
    setUser({ id: data.user.id, username: data.user.username, email: data.user.email, isAdmin: data.user.isAdmin })
    toast.success('Account created!')
  }

  const logout = () => {
    setAuthToken(null)
    setUser(null)
    toast.success('Logged out')
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, signup, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth needs AuthProvider')
  return ctx
}

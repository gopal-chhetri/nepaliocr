import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { apiClient, setAuthToken, clearAuthToken } from './api-client'

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 > Date.now()) {
        setUser({ id: payload.sub, email: payload.email })
      } else {
        clearAuthToken()
        setToken(null)
      }
    }
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient<{ token: string; user: User }>('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setAuthToken(res.token)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const res = await apiClient<{ token: string; user: User }>('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setAuthToken(res.token)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
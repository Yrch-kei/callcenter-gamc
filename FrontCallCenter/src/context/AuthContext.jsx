import { createContext, useContext, useState, useCallback } from 'react'
import api from '@/services/api'

const ROLE_MAP = {
  'Operador de Call Center': 'operador',
  'Operador Call Center':    'operador',
  'Personal de Campo':       'personal_campo',
  'Tecnico de campo':        'personal_campo',
  'Jefe de Unidad':          'operador',
  'Administrador':           'administrador',
}

const ROLE_HOME = {
  operador:       '/dashboard',
  personal_campo: '/campo',
  administrador:  '/admin',
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', {
        email:    email.trim().toLowerCase(),
        password,
      })

      const raw = data.user
      localStorage.setItem('token', data.token)

      const frontRole = ROLE_MAP[raw.role] ?? 'operador'
      const userData = {
        id:      raw.id,
        name:    [raw.names, raw.lastname].filter(Boolean).join(' '),
        email:   raw.email,
        role:    frontRole,
        roleRaw: raw.role,
        unitId:  raw.unitId ?? null,
        area:    null,
      }

      localStorage.setItem('auth_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, homeRoute: ROLE_HOME[frontRole] ?? '/dashboard' }
    } catch (err) {
      let msg = 'Error al procesar la solicitud'
      if (err?.response) {
        msg = err.response.data?.message || err.response.data?.error || 'Credenciales inválidas'
      } else if (err?.request) {
        msg = 'Error de conexión: No se pudo contactar al servidor'
      } else if (err?.message) {
        msg = err.message
      }
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }, [])

  const hasRole    = useCallback((role)  => user?.role === role,                                [user])
  const hasAnyRole = useCallback((roles) => Array.isArray(roles) && roles.includes(user?.role), [user])
  const homeRoute  = user ? (ROLE_HOME[user.role] ?? '/dashboard') : '/login'

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
        hasAnyRole,
        homeRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

/**
 * Cliente HTTP centralizado.
 * - Añade el Bearer token de forma automática en cada petición.
 * - Si el servidor responde 401, limpia la sesión y redirige al login.
 */
import axios from 'axios'

const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const API_URL = `${protocol}//${host}:3000/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 60_000, // 60 segundos
  headers: { 'Content-Type': 'application/json' },
})


// ── Request: adjunta el token ─────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: manejo global de errores ────────────────────────────────────────
let isRedirecting = false
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      // Token expirado o inválido — limpiar sesión una sola vez
      isRedirecting = true
      localStorage.removeItem('token')
      localStorage.removeItem('auth_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      // Reset flag after redirect completes
      setTimeout(() => { isRedirecting = false }, 2000)
    }
    return Promise.reject(error)
  }
)

export default api

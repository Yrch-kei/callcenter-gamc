import api from './api'

export const authService = {
  /**
   * POST /api/auth/login
   * Devuelve { token, user: { id, names, lastname, email, role, unitId } }
   */
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  /**
   * POST /api/auth/forgot-password
   */
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  /**
   * POST /api/auth/reset-password
   */
  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword }).then((r) => r.data),

  /**
   * PUT /api/auth/change-password
   */
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),

  /**
   * POST /api/auth/logout (requiere token en header)
   */
  logout: () =>
    api.post('/auth/logout').catch(() => {
      // Si el backend falla (token ya expirado), ignorar el error
    }),
}

import api from './api'

/**
 * Mapea un usuario del backend al modelo interno del frontend.
 * El backend devuelve { id, names, lastname, secondLastname, ci, phone,
 * birthdate, gender, email, status, role: { id, name }, unit: { id, name } }
 */
export function mapUser(u) {
  return {
    id:             u.id,
    name:           [u.names, u.lastname, u.secondLastname].filter(Boolean).join(' '),
    names:          u.names,
    lastname:       u.lastname,
    secondLastname: u.secondLastname ?? '',
    ci:             u.ci,
    phone:          u.phone,
    birthdate:      u.birthdate ? String(u.birthdate).substring(0, 10) : '',
    gender:         u.gender,
    email:          u.email,
    roleId:         u.role?.id   ?? null,
    roleRaw:        u.role?.name ?? '',
    unitId:         u.unit?.id   ?? null,
    area:           u.unit?.name ?? null,
    active:         u.status === 1,
  }
}

const userService = {
  /** GET /api/users — solo Administrador */
  getAll: () => api.get('/users').then((r) => r.data.map(mapUser)),

  /** GET /api/users/:id */
  getById: (id) => api.get(`/users/${id}`).then((r) => mapUser(r.data)),

  /**
   * POST /api/users
   * El backend genera la contraseña y la envía por email.
   * Campos: names, lastname, secondLastname?, ci, phone, birthdate,
   *         gender, email, roleId, unitId?
   */
  create: (data) => api.post('/users', data).then((r) => mapUser(r.data)),

  /** PUT /api/users/:id — actualiza campos del usuario */
  update: (id, data) => api.put(`/users/${id}`, data).then((r) => mapUser(r.data)),

  /**
   * DELETE /api/users/:id — borrado lógico (status=0).
   * El backend no retorna body (204).
   */
  delete: (id) => api.delete(`/users/${id}`),

  /** GET /api/roles */
  getRoles: () => api.get('/roles').then((r) => r.data),
}

export default userService

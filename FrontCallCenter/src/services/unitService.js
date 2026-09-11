import api from './api'

const unitService = {
  getAll:  ()         => api.get('/units').then((r) => r.data),
  create:  (data)     => api.post('/units', data).then((r) => r.data),
  update:  (id, data) => api.put(`/units/${id}`, data).then((r) => r.data),
  delete:  (id)       => api.delete(`/units/${id}`),
}

export default unitService

import api from './api'

const departmentService = {
  getAll:         ()          => api.get('/departments').then((r) => r.data),
  create:         (data)      => api.post('/departments', data).then((r) => r.data),
  update:         (id, data)  => api.put(`/departments/${id}`, data).then((r) => r.data),
  delete:         (id)        => api.delete(`/departments/${id}`),
}

export default departmentService

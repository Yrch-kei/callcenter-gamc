import api from './api'

const historyService = {
  /** GET /api/complaint-history/complaint/:complaintId */
  getByComplaint: (complaintId) =>
    api
      .get(`/complaint-history/complaint/${complaintId}`)
      .then((r) =>
        // Ordenar cronológicamente (más antiguo primero — igual que el mock)
        [...r.data].sort((a, b) => new Date(a.registerDate) - new Date(b.registerDate))
      ),
}

export default historyService

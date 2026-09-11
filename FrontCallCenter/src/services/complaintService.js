import api from './api'

/**
 * Mapeo de estados backend -> frontend
 * Backend: 'Pendiente' | 'Derivada' | 'En proceso' | 'Resuelta' | 'Cancelada'
 * Frontend: 'pendiente' | 'en_proceso' | 'resuelta' | 'rechazada'
 */
export const STATUS_BACKEND_TO_FRONT = {
  Pendiente:   'pendiente',
  Derivada:    'pendiente',   // visualmente sigue pendiente
  'En proceso':'en_proceso',
  Resuelta:    'resuelta',
  Cancelada:   'rechazada',
}

export const STATUS_FRONT_TO_BACKEND = {
  pendiente:  'Pendiente',
  en_proceso: 'En proceso',
  resuelta:   'Resuelta',
  rechazada:  'Cancelada',
}

/**
 * Mapeo de risk (int 1-4) -> prioridad frontend
 * El backend usa el campo `risk`: 1=baja, 2=media, 3=alta, 4=urgente
 */
const RISK_TO_PRIORITY = { 1: 'baja', 2: 'media', 3: 'alta', 4: 'urgente' }
const PRIORITY_TO_RISK = { baja: 1, media: 2, alta: 3, urgente: 4 }

/** Convierte un objeto Complaint del backend al modelo que usa el frontend */
export function mapComplaint(c) {
  const getMediaBaseUrl = () => {
    if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.startsWith('/')) {
      return import.meta.env.VITE_API_URL.replace('/api', '');
    }
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3000`;
  };
  const baseUrl = getMediaBaseUrl();

  const normalizePhotoUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    if (url.startsWith('/uploads/')) return `${baseUrl}/photos/${url.replace(/^\/uploads\//, '')}`
    if (url.startsWith('/photos/')) return `${baseUrl}${url}`
    return `${baseUrl}/photos/${url.replace(/^\/+/, '')}`
  }
  return {
    // Identificadores
    _id:           c.id,                                          // ID num?rico para llamadas API
    id:            c.code,                                        // C?digo DEN-YYYY-NNNNN
    // Datos principales
    titulo:        c.title || c.incident,
    descripcion:   c.incident,
    categoria:     c.category?.name   ?? '',
    area:          c.category?.unit?.name ?? '',
    // Denunciante
    ciudadano:     [c.names, c.lastname].filter(Boolean).join(' '),
    telefono:      c.phone,
    // Ubicaci?n
    direccion:     c.address,
    lat:           c.latitude  ? parseFloat(c.latitude)  : null,
    lng:           c.longitude ? parseFloat(c.longitude) : null,
    // Estado y prioridad
    estado:        STATUS_BACKEND_TO_FRONT[c.status] ?? 'pendiente',
    prioridad:     RISK_TO_PRIORITY[c.risk] ?? 'baja',
    // Fechas
    fecha:         c.registerDate,
    arrivalTime:   c.arrivalTime  ?? null,
    finishTime:    c.finishTime   ?? null,
    // Operador
    operador:      c.createdBy ? [c.createdBy.names, c.createdBy.lastname].filter(Boolean).join(' ') : null,
    tecnicoResponsable: c.attendedBy ? [c.attendedBy.names, c.attendedBy.lastname].filter(Boolean).join(' ') : null,
    // Intervención
    technicalNotes:   c.technicalNotes   ?? null,
    materialsUsed:    c.materialsUsed    ?? null,
    resolutionResult: c.resolutionResult ?? null,
    operatorSignature: c.operatorSignature ?? null,
    // Correo, satisfacción y reapertura
    citizenEmail:     c.citizenEmail     ?? null,
    notifyEmail:      c.notifyEmail      ?? false,
    satisfactionRating: c.satisfactionRating ?? null,
    reopenReason:     c.reopenReason     ?? null,
    reopenStatus:     c.reopenStatus     ?? 'NONE',
    reopenResolution: c.reopenResolution ?? null,
    // Evidencia principal (foto subida al crear la denuncia)
    evidence: normalizePhotoUrl(c.evidence),
    // Imágenes de intervención (BEFORE/AFTER)
    images: (c.images ?? []).map((img) => ({
      ...img,
      url: normalizePhotoUrl(img.url),
    })),
  }
}

const complaintService = {
  /** GET /api/complaints */
  getAll: () => api.get('/complaints').then((r) => r.data.map(mapComplaint)),

  /** GET /api/complaints/:id  (id numérico) */
  getById: (id) => api.get(`/complaints/${id}`).then((r) => mapComplaint(r.data)),

  /** GET /api/complaints/public/status/:code */
  getPublicStatus: (code) =>
    api.get(`/complaints/public/status/${code.trim().toUpperCase()}`).then((r) => r.data),

  /**
   * POST /api/complaints  (multipart/form-data - evidencia opcional)
   * payload: { names, lastname, phone, incident, address, latitude, longitude,
   *            categoryId, companyId, risk, [evidence file] }
   */
  create: (formData) =>
    api.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => mapComplaint(r.data)),

  /**
   * PUT /api/complaints/:id  (actualización general o cambio de estado)
   */
  update: (id, formData) =>
    api.put(`/complaints/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => mapComplaint(r.data)),

  /** PUT /api/complaints/:id/status (o /api/complaints/:id) cambio directo de estado JSON */
  updateStatus: (id, status, notes) => {
    const backendStatus = STATUS_FRONT_TO_BACKEND[status] || status || 'Pendiente'
    return api.put(`/complaints/${id}/status`, {
      status: backendStatus,
      notes: notes || 'Cambio de estado realizado por operador'
    }).then((r) => mapComplaint(r.data))
  },

  /** POST /api/complaints/:id/evaluate-reopen  { action: 'APPROVE' | 'REJECT', note?: string } */
  evaluateReopen: (id, action, note) =>
    api.post(`/complaints/${id}/evaluate-reopen`, { action, note }).then((r) => mapComplaint(r.data)),

  /** POST /api/complaints/:id/note  { text } */
  addNote: (id, text) =>
    api.post(`/complaints/${id}/note`, { text }).then((r) => r.data),

  /** POST /api/complaints/:id/derive  { area, note? } */
  derive: (id, area, note) =>
    api.post(`/complaints/${id}/derive`, { area, note }).then((r) => mapComplaint(r.data)),

  /**
   * POST /api/complaints/:id/start  (multipart - fotos ANTES)
   * payload: FormData con { latitude, longitude, photos[] }
   */
  startIntervention: (id, formData) =>
    api.post(`/complaints/${id}/start`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => mapComplaint(r.data)),

  /**
   * POST /api/complaints/:id/finish  (multipart ? fotos DESPUÃ‰S)
   * payload: FormData con { technicalNotes, materialsUsed, resolutionResult, photos[] }
   */
  finishIntervention: (id, formData) =>
    api.post(`/complaints/${id}/finish`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => mapComplaint(r.data)),

  /** GET /api/complaints/assigned */
  getAssigned: () => api.get('/complaints/assigned').then((r) => r.data.map(mapComplaint)),

  /** POST /api/complaints/:id/arrive { latitude, longitude } */
  arriveAtSite: (id, { latitude, longitude }) =>
    api.post(`/complaints/${id}/arrive`, { latitude, longitude }).then((r) => mapComplaint(r.data)),

  /** POST /api/complaints/:id/resolve (multipart/form-data: afterImage, technicalNotes, materialsUsed, resolutionResult, finishTime) */
  resolve: (id, formData) =>
    api.post(`/complaints/${id}/resolve`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => mapComplaint(r.data)),

  /** GET /api/complaints/heatmap?year=YYYY */
  getHeatmap: (year) =>
    api.get('/complaints/heatmap', { params: { year } }).then((r) => r.data),


  /** DELETE /api/complaints/:id  (cancela la denuncia) */
  cancel: (id) => api.delete(`/complaints/${id}`).then((r) => r.data),

  /**
   * GET /api/complaints/:id/pdf
   * Descarga el PDF generado por el backend (solo denuncias Resueltas).
   * Retorna true si tuvo ?xito, false si fall?.
   */
  downloadPdf: async (id, code) => {
    const response = await api.get(`/complaints/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `FORMULARIO_${code}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  /** POST /api/complaints/:id/assign { technicianId, observation? } */
  assign: (id, technicianId, observation) =>
    api.post(`/complaints/${id}/assign`, { technicianId, observation }).then((r) => mapComplaint(r.data)),

  /** GET /api/users/technicians?unitId=... */
  getTechnicians: (unitId) =>
    api.get('/users/technicians', { params: { unitId } }).then((r) => r.data),

  // Helpers
  PRIORITY_TO_RISK,
  STATUS_FRONT_TO_BACKEND,
  STATUS_BACKEND_TO_FRONT,
}

export default complaintService



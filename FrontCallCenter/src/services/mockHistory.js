export const MOCK_HISTORIAL = {
  'DEN-2026-001': [
    {
      id: 1,
      tipo: 'creacion',
      descripcion: 'Denuncia registrada por el ciudadano',
      fecha: '2026-03-28T09:15:00',
      usuario: 'Sistema',
    },
    {
      id: 2,
      tipo: 'asignacion',
      descripcion: 'Asignada a María García',
      fecha: '2026-03-28T09:45:00',
      usuario: 'Admin',
    },
    {
      id: 3,
      tipo: 'nota',
      descripcion: 'Se verificó la ubicación del bache. Tiene aproximadamente 50cm de profundidad.',
      fecha: '2026-03-28T14:20:00',
      usuario: 'María García',
    },
  ],
  'DEN-2026-002': [
    {
      id: 1,
      tipo: 'creacion',
      descripcion: 'Denuncia registrada vía telefónica',
      fecha: '2026-03-27T14:30:00',
      usuario: 'Sistema',
    },
    {
      id: 2,
      tipo: 'asignacion',
      descripcion: 'Asignada a María García',
      fecha: '2026-03-27T15:00:00',
      usuario: 'Admin',
    },
    {
      id: 3,
      tipo: 'cambio_estado',
      descripcion: 'Estado cambiado a En Proceso',
      fecha: '2026-03-27T16:10:00',
      usuario: 'María García',
    },
    {
      id: 4,
      tipo: 'nota',
      descripcion: 'Cuadrilla de reparación enviada al sitio. Se estima reparación en 48 horas.',
      fecha: '2026-03-28T08:00:00',
      usuario: 'María García',
    },
  ],
  'DEN-2026-003': [
    {
      id: 1,
      tipo: 'creacion',
      descripcion: 'Denuncia registrada desde portal ciudadano',
      fecha: '2026-03-27T11:00:00',
      usuario: 'Sistema',
    },
  ],
  'DEN-2026-004': [
    {
      id: 1,
      tipo: 'creacion',
      descripcion: 'Denuncia registrada vía telefónica',
      fecha: '2026-03-25T08:45:00',
      usuario: 'Sistema',
    },
    {
      id: 2,
      tipo: 'asignacion',
      descripcion: 'Asignada a Juan Pérez',
      fecha: '2026-03-25T09:30:00',
      usuario: 'Admin',
    },
    {
      id: 3,
      tipo: 'cambio_estado',
      descripcion: 'Estado cambiado a En Proceso',
      fecha: '2026-03-25T10:00:00',
      usuario: 'Juan Pérez',
    },
    {
      id: 4,
      tipo: 'cambio_estado',
      descripcion: 'Estado cambiado a Resuelta. Limpieza completada.',
      fecha: '2026-03-26T16:30:00',
      usuario: 'Juan Pérez',
    },
  ],
}

export const MOCK_EVIDENCIAS = {
  'DEN-2026-001': [
    { id: 1, url: 'https://placehold.co/600x400/4ac1e0/ffffff?text=Bache+1', alt: 'Foto del bache vista frontal' },
    { id: 2, url: 'https://placehold.co/600x400/2a9bc0/ffffff?text=Bache+2', alt: 'Foto del bache vista lateral' },
  ],
  'DEN-2026-002': [
    { id: 1, url: 'https://placehold.co/600x400/4ac1e0/ffffff?text=Fuga+agua', alt: 'Foto de la fuga de agua' },
  ],
}

export function getHistorial(denunciaId) {
  return MOCK_HISTORIAL[denunciaId] || [
    {
      id: 1,
      tipo: 'creacion',
      descripcion: 'Denuncia registrada',
      fecha: '2026-03-27T10:00:00',
      usuario: 'Sistema',
    },
  ]
}

export function getEvidencias(denunciaId) {
  return MOCK_EVIDENCIAS[denunciaId] || []
}

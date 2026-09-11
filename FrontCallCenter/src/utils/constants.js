// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  OPERADOR: 'operador',
  PERSONAL_CAMPO: 'personal_campo',
  ADMINISTRADOR: 'administrador',
}

export const ROLE_CONFIG = {
  [ROLES.OPERADOR]: {
    label: 'Operador',
    labelShort: 'OP',
    color: 'text-primary-700 dark:text-primary',
    bg: 'bg-primary-100 dark:bg-primary-700/20',
    home: '/dashboard',
  },
  [ROLES.PERSONAL_CAMPO]: {
    label: 'Personal de Campo',
    labelShort: 'PC',
    color: 'text-success dark:text-success',
    bg: 'bg-success-light dark:bg-success/10',
    home: '/campo',
  },
  [ROLES.ADMINISTRADOR]: {
    label: 'Administrador',
    labelShort: 'AD',
    color: 'text-accent dark:text-accent',
    bg: 'bg-accent-50 dark:bg-accent/10',
    home: '/admin',
  },
}

// Usuarios simulados — no usar en producción
export const MOCK_USERS = [
  {
    id: 1,
    name: 'María García',
    email: 'operador@municipio.gob',
    password: '123456',
    role: ROLES.OPERADOR,
    area: null,
    avatar: null,
  },
  {
    id: 2,
    name: 'Carlos Mamani',
    email: 'campo@municipio.gob',
    password: '123456',
    role: ROLES.PERSONAL_CAMPO,
    area: 'Infraestructura Urbana',
    avatar: null,
  },
  {
    id: 3,
    name: 'Ana Rodríguez',
    email: 'admin@municipio.gob',
    password: '123456',
    role: ROLES.ADMINISTRADOR,
    area: null,
    avatar: null,
  },
]

// ─── Denuncias ────────────────────────────────────────────────────────────────
export const DENUNCIA_STATUS = {
  PENDIENTE: 'pendiente',
  EN_PROCESO: 'en_proceso',
  RESUELTA: 'resuelta',
  RECHAZADA: 'rechazada',
}

export const STATUS_CONFIG = {
  [DENUNCIA_STATUS.PENDIENTE]: {
    label: 'Pendiente',
    color: 'warning',
    bg: 'bg-warning-light',
    text: 'text-warning',
    dot: 'bg-warning',
  },
  [DENUNCIA_STATUS.EN_PROCESO]: {
    label: 'En Proceso',
    color: 'info',
    bg: 'bg-info-light',
    text: 'text-primary',
    dot: 'bg-primary',
  },
  [DENUNCIA_STATUS.RESUELTA]: {
    label: 'Resuelta',
    color: 'success',
    bg: 'bg-success-light',
    text: 'text-success',
    dot: 'bg-success',
  },
  [DENUNCIA_STATUS.RECHAZADA]: {
    label: 'Rechazada',
    color: 'danger',
    bg: 'bg-danger-light',
    text: 'text-danger',
    dot: 'bg-danger',
  },
}

export const PRIORITY = {
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
  URGENTE: 'urgente',
}

export const PRIORITY_CONFIG = {
  [PRIORITY.BAJA]: { label: 'Baja', color: 'text-text-secondary', bg: 'bg-gray-100' },
  [PRIORITY.MEDIA]: { label: 'Media', color: 'text-warning', bg: 'bg-warning-light' },
  [PRIORITY.ALTA]: { label: 'Alta', color: 'text-accent', bg: 'bg-accent-50' },
  [PRIORITY.URGENTE]: { label: 'Urgente', color: 'text-danger', bg: 'bg-danger-light' },
}

// Transiciones de estado permitidas
export const TRANSICIONES_VALIDAS = {
  [DENUNCIA_STATUS.PENDIENTE]:  [DENUNCIA_STATUS.EN_PROCESO, DENUNCIA_STATUS.RECHAZADA],
  [DENUNCIA_STATUS.EN_PROCESO]: [DENUNCIA_STATUS.RESUELTA,   DENUNCIA_STATUS.RECHAZADA],
  [DENUNCIA_STATUS.RESUELTA]:   [],
  [DENUNCIA_STATUS.RECHAZADA]:  [],
}

// Etiquetas legibles para cada estado destino
export const ESTADO_TRANSICION_CONFIG = {
  [DENUNCIA_STATUS.EN_PROCESO]: {
    label: 'Iniciar atención',
    desc: 'El personal de campo ha sido asignado al caso.',
    color: 'bg-primary-100 text-primary-700 border-primary/30 dark:bg-primary-700/20 dark:text-primary',
  },
  [DENUNCIA_STATUS.RESUELTA]: {
    label: 'Marcar como resuelta',
    desc: 'El problema fue atendido y solucionado.',
    color: 'bg-success-light text-success border-success/30',
  },
  [DENUNCIA_STATUS.RECHAZADA]: {
    label: 'Rechazar denuncia',
    desc: 'La denuncia no procede. Se requiere justificación.',
    color: 'bg-danger-light text-danger border-danger/30',
  },
}

// Áreas operativas disponibles para derivación
export const AREAS_OPERATIVAS = [
  'Infraestructura Urbana',
  'Vías y Pavimento',
  'Medio Ambiente',
  'Alumbrado Público',
  'Agua y Drenaje',
  'Espacios Públicos y Parques',
  'Transporte',
  'Seguridad Ciudadana',
]

export const CATEGORIES = [
  'Alumbrado público',
  'Baches y vialidad',
  'Basura y limpieza',
  'Ruido excesivo',
  'Agua y drenaje',
  'Espacios públicos',
  'Transporte',
  'Seguridad',
  'Otro',
]

// ─── Taxonomía de denuncias (Area → Sub-área → Categoría → Subcategoría) ──────
export const TAXONOMY = {
  'Infraestructura': {
    'Vías y Pavimento': {
      'Baches y vialidad': ['Bache en calzada', 'Hundimiento de pavimento', 'Grietas en asfalto', 'Bordillo dañado', 'Acera rota'],
      'Señalética vial':   ['Señal faltante', 'Señal dañada', 'Semáforo averiado', 'Demarcación borrada'],
    },
    'Alumbrado Público': {
      'Alumbrado público': ['Luminaria apagada', 'Luminaria dañada', 'Poste caído', 'Cableado expuesto'],
    },
    'Agua y Saneamiento': {
      'Agua y drenaje': ['Tubería rota', 'Inundación en vía', 'Falta de suministro', 'Drenaje obstruido', 'Pozo abierto'],
    },
    'Obras Públicas': {
      'Obras públicas': ['Obra abandonada', 'Zanja sin señalizar', 'Demolición ilegal', 'Obra sin permiso'],
    },
  },
  'Medio Ambiente': {
    'Residuos Sólidos': {
      'Basura y limpieza': ['Acumulación de basura', 'Contenedor desbordado', 'Basura en vía pública', 'Botadero clandestino'],
      'Escombros':         ['Escombros en vía', 'Depósito ilegal de materiales'],
    },
    'Contaminación': {
      'Ruido excesivo':           ['Ruido nocturno', 'Actividad comercial ruidosa', 'Construcción fuera de horario', 'Evento sin permiso'],
      'Contaminación ambiental':  ['Quema a cielo abierto', 'Vertido de residuos líquidos', 'Humos y emanaciones'],
    },
    'Áreas Verdes': {
      'Vegetación': ['Árbol caído', 'Árbol con riesgo de caída', 'Poda requerida', 'Plaga en arbolado'],
    },
  },
  'Espacios Públicos': {
    'Parques y Plazas': {
      'Espacios públicos': ['Mobiliario dañado', 'Juegos infantiles rotos', 'Vegetación descuidada', 'Falta de iluminación en parque'],
    },
    'Mercados y Comercio': {
      'Mercados': ['Invasión de aceras', 'Higiene deficiente', 'Actividad informal no autorizada'],
    },
  },
  'Transporte y Movilidad': {
    'Transporte Público': {
      'Transporte': ['Ruta sin cobertura', 'Paradero en mal estado', 'Vehículo con defectos visibles', 'Conductor infractor'],
    },
    'Estacionamiento': {
      'Estacionamiento': ['Vehículo abandonado', 'Bloqueo de acceso', 'Zona de carga bloqueada'],
    },
  },
  'Seguridad Ciudadana': {
    'Orden Público': {
      'Seguridad': ['Actividad delictiva', 'Vandalismo', 'Persona en situación de calle', 'Riña o alteración del orden'],
    },
    'Vigilancia': {
      'Cámaras y vigilancia': ['Cámara dañada', 'Cámara sin funcionar', 'Solicitud de nueva cámara'],
    },
  },
  'Otro': {
    'General': {
      'Otro': ['No clasificado'],
    },
  },
}

// Helpers para cascada
export const getTaxonomyAreas        = ()                         => Object.keys(TAXONOMY)
export const getTaxonomySubareas     = (area)                     => Object.keys(TAXONOMY[area] ?? {})
export const getTaxonomyCategorias   = (area, subarea)            => Object.keys(TAXONOMY[area]?.[subarea] ?? {})
export const getTaxonomySubcategorias = (area, subarea, categoria) => TAXONOMY[area]?.[subarea]?.[categoria] ?? []

// ─── Territorio (Distrito → Subdistrito → OTB) ────────────────────────────────
export const TERRITORIO = {
  'Distrito 1 - Centro': {
    'Subdistrito 1-A': ['OTB Casco Viejo', 'OTB Plaza Central', 'OTB San Sebastián'],
    'Subdistrito 1-B': ['OTB La Libertad', 'OTB Colón', 'OTB San Francisco'],
  },
  'Distrito 2 - Norte': {
    'Subdistrito 2-A': ['OTB Villa Norte', 'OTB San Marcos', 'OTB Residencial Norte'],
    'Subdistrito 2-B': ['OTB Los Álamos', 'OTB Nueva Esperanza', 'OTB El Prado'],
  },
  'Distrito 3 - Sur': {
    'Subdistrito 3-A': ['OTB Villa Mercedes', 'OTB El Sur', 'OTB Obispo Bosque'],
    'Subdistrito 3-B': ['OTB Uspa Uspa', 'OTB Huayra K\'asa', 'OTB Llave Mayu'],
  },
  'Distrito 4 - Este': {
    'Subdistrito 4-A': ['OTB Sarco', 'OTB Valle Verde', 'OTB San Isidro'],
    'Subdistrito 4-B': ['OTB Pacata Baja', 'OTB Pacata Alta', 'OTB Los Jardines'],
  },
  'Distrito 5 - Oeste': {
    'Subdistrito 5-A': ['OTB Molle Molle', 'OTB Ticti Norte', 'OTB Ticti Sur'],
    'Subdistrito 5-B': ['OTB Muyurina', 'OTB Villa Israel', 'OTB Kantutani'],
  },
  'Distrito 6 - Periurbano': {
    'Subdistrito 6-A': ['OTB Lacma', 'OTB Chimba', 'OTB Jaihuayco'],
    'Subdistrito 6-B': ['OTB Alto San Miguel', 'OTB Santa Vera Cruz', 'OTB Putucuni'],
  },
  'Distrito 7 - Industrial': {
    'Subdistrito 7-A': ['OTB Temporal', 'OTB Industrial Norte'],
    'Subdistrito 7-B': ['OTB Parque Industrial', 'OTB Villa Pagador'],
  },
}

// Helpers para cascada de territorio
export const getDistritos    = ()                   => Object.keys(TERRITORIO)
export const getSubdistritos = (distrito)           => Object.keys(TERRITORIO[distrito] ?? {})
export const getOTBs         = (distrito, subdistr) => TERRITORIO[distrito]?.[subdistr] ?? []

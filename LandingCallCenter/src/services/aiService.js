/**
 * Servicio de Inteligencia Artificial para la Landing Page de Denuncias Municipal (GAMC).
 * Orquesta la transcripción con Whisper STT, la clasificación con Ollama LLM
 * y la persistencia del ticket oficial en BackCallCenter.
 */

const WHISPER_URL = import.meta.env.VITE_WHISPER_URL || 'http://localhost:5000/transcribe';
const GAMC_API_URL = import.meta.env.VITE_GAMC_API_URL || 'http://localhost:4000/api/v1';
const MAIN_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Mapeo auxiliar de categorías a IDs de la base de datos principal
const CATEGORY_MAP = {
  BACHEO_Y_VIAS: 1,
  BACHEO: 1,
  VIAS: 1,
  BACHE_EN_CALZADA: 1,
  ALUMBRADO_PUBLICO: 3,
  ALUMBRADO: 3,
  LUMINARIA: 3,
  POSTE_SIN_LUZ: 3,
  ATENCION_CIUDADANA: 3,
  AGUA_Y_ALCANTARILLADO: 5,
  AGUA: 5,
  ALCANTARILLADO: 5,
  FUGA_DE_AGUA: 5,
  RESIDUOS_SOLIDOS: 7,
  BASURA: 7,
  BASURA_ACUMULADA: 7,
  AREAS_VERDES_Y_PARQUES: 9,
  AREAS_VERDES_Y_FORESTAL: 9,
  AREAS_VERDES: 9,
  ARBOLES: 9,
  ARBOL_PELIGROSO: 9,
  TRANSPORTE_Y_MOVILIDAD: 11,
  MERCADOS_Y_COMERCIO: 11,
  MERCADOS: 11,
  COMERCIO: 11,
  COMERCIO_INFORMAL: 11,
  CONTROL_ACTIVIDADES_E_INTENDENCIA: 11,
  CONSTRUCCION_Y_URBANISMO: 1,
  SEGURIDAD_CIUDADANA: 11,
  MEDIO_AMBIENTE: 7,
};

const RISK_MAP = {
  CRITICA: 4,
  ALTA: 3,
  MEDIA: 2,
  BAJA: 1,
};

/**
 * Transcribe un blob de audio usando el microservicio Whisper (FastAPI).
 */
export async function transcribeAudio(audioBlob) {
  if (!audioBlob || audioBlob.size === 0) {
    throw new Error('El archivo de audio está vacío o no es válido.');
  }

  console.log('[aiService] 📤 Transcribiendo audio con Whisper...', {
    size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
    type: audioBlob.type,
  });

  const formData = new FormData();
  let ext = 'webm';
  if (audioBlob.type.includes('ogg')) ext = 'ogg';
  else if (audioBlob.type.includes('wav')) ext = 'wav';

  formData.append('file', audioBlob, `audio.${ext}`);

  try {
    const res = await fetch(WHISPER_URL, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Whisper HTTP ${res.status}: ${errText || res.statusText}`);
    }

    const data = await res.json();
    const text = (data?.text || '').trim();

    if (!text) {
      throw new Error('No se detectó ningún mensaje de voz entendible en el audio enviado.');
    }

    console.log('[aiService] ✅ Transcripción Whisper recibida:', text);
    return text;
  } catch (err) {
    console.error('[aiService] ❌ Error en servicio Whisper:', err);
    throw err;
  }
}

/**
 * Fallback heurístico inteligente por palabras clave cuando Ollama no está disponible.
 */
function getHeuristicClassification(textRaw) {
  const text = (textRaw || '').toLowerCase();

  if (
    text.includes('arbol') ||
    text.includes('árbol') ||
    text.includes('rama') ||
    text.includes('plaza') ||
    text.includes('parque') ||
    text.includes('forestal')
  ) {
    return {
      category: 'AREAS_VERDES_Y_FORESTAL',
      subcategory: 'Árbol o rama caída',
      priority: 'ALTA',
      aiConfidence: 0.90,
      confidencePercent: '90.0%',
      cleanSummary: textRaw.substring(0, 140),
      keywords: ['árbol', 'parque', 'emergencia'],
      requiresVerification: false,
    };
  } else if (
    text.includes('bache') ||
    text.includes('hueco') ||
    text.includes('asfalto') ||
    text.includes('calle rota') ||
    text.includes('vias') ||
    text.includes('vías') ||
    text.includes('pavimento')
  ) {
    return {
      category: 'BACHEO_Y_VIAS',
      subcategory: 'Bache en calzada',
      priority: 'ALTA',
      aiConfidence: 0.90,
      confidencePercent: '90.0%',
      cleanSummary: textRaw.substring(0, 140),
      keywords: ['bache', 'vía', 'calzada'],
      requiresVerification: false,
    };
  } else if (
    text.includes('luz') ||
    text.includes('poste') ||
    text.includes('cable') ||
    text.includes('foco') ||
    text.includes('alumbrado') ||
    text.includes('luminaria')
  ) {
    return {
      category: 'ALUMBRADO_PUBLICO',
      subcategory: 'Poste sin luz',
      priority: 'MEDIA',
      aiConfidence: 0.90,
      confidencePercent: '90.0%',
      cleanSummary: textRaw.substring(0, 140),
      keywords: ['alumbrado', 'foco', 'poste'],
      requiresVerification: false,
    };
  } else if (
    text.includes('agua') ||
    text.includes('fuga') ||
    text.includes('alcantarilla') ||
    text.includes('tuberia') ||
    text.includes('tubería') ||
    text.includes('desagüe') ||
    text.includes('drenaje')
  ) {
    return {
      category: 'AGUA_Y_ALCANTARILLADO',
      subcategory: 'Fuga de agua',
      priority: 'ALTA',
      aiConfidence: 0.90,
      confidencePercent: '90.0%',
      cleanSummary: textRaw.substring(0, 140),
      keywords: ['agua', 'fuga', 'alcantarillado'],
      requiresVerification: false,
    };
  } else if (
    text.includes('basura') ||
    text.includes('escombro') ||
    text.includes('contenedor') ||
    text.includes('desechos') ||
    text.includes('limpieza')
  ) {
    return {
      category: 'RESIDUOS_SOLIDOS',
      subcategory: 'Basura acumulada',
      priority: 'MEDIA',
      aiConfidence: 0.90,
      confidencePercent: '90.0%',
      cleanSummary: textRaw.substring(0, 140),
      keywords: ['basura', 'residuos', 'limpieza'],
      requiresVerification: false,
    };
  } else if (
    text.includes('comercio') ||
    text.includes('vendedor') ||
    text.includes('mercado') ||
    text.includes('intendencia') ||
    text.includes('ambulante')
  ) {
    return {
      category: 'CONTROL_ACTIVIDADES_E_INTENDENCIA',
      subcategory: 'Comercio informal',
      priority: 'MEDIA',
      aiConfidence: 0.90,
      confidencePercent: '90.0%',
      cleanSummary: textRaw.substring(0, 140),
      keywords: ['comercio', 'vendedor', 'intendencia'],
      requiresVerification: false,
    };
  }

  return {
    category: 'ATENCION_CIUDADANA',
    subcategory: 'REGISTRO_GENERAL',
    priority: 'MEDIA',
    aiConfidence: 0.85,
    confidencePercent: '85.0%',
    cleanSummary: textRaw.substring(0, 140),
    keywords: ['denuncia', 'ciudadano'],
    requiresVerification: true,
  };
}

/**
 * Registra y clasifica una denuncia con el modelo LLM y la persiste en la API Principal.
 */
export async function classifyAndRegisterComplaint(payload) {
  let aiData = null;

  // 1. Intento de clasificación con IA (gamc-backend en :4000)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seg timeout

    const res = await fetch(`${GAMC_API_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        text_raw: payload.text_raw,
        address: payload.address || 'No especificada',
        district: payload.district || undefined,
        names: payload.names || 'Ciudadano Web',
        phone: payload.phone || undefined,
        session_token: `LANDING_${Date.now()}`,
        input_channel: payload.input_channel || 'WEB',
      }),
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      aiData = json.data || json;
    }
  } catch (err) {
    console.error("Fallo al clasificar con Ollama:", err);
  }

  // Fallback heurístico inteligente si la IA falló o estuvo indisponible
  const classification = aiData?.classification || getHeuristicClassification(payload.text_raw);

  const riskNum = RISK_MAP[classification.priority] || 2;
  const categoryId = CATEGORY_MAP[classification.category] || 1;

  const categoryAliases = {
    AREAS_VERDES_Y_FORESTAL: 'Árbol peligroso',
    ARBOL_PELIGROSO: 'Árbol peligroso',
    ALUMBRADO_PUBLICO: 'Poste sin luz',
    POSTE_SIN_LUZ: 'Poste sin luz',
    BACHEO_Y_VIAS: 'Bache en calzada',
    BACHE_EN_CALZADA: 'Bache en calzada',
    AGUA_Y_ALCANTARILLADO: 'Fuga de agua',
    FUGA_DE_AGUA: 'Fuga de agua',
    RESIDUOS_SOLIDOS: 'Basura acumulada',
    BASURA_ACUMULADA: 'Basura acumulada',
    CONTROL_ACTIVIDADES_E_INTENDENCIA: 'Comercio informal',
    COMERCIO_INFORMAL: 'Comercio informal',
  };

  const categoryNameToSend = categoryAliases[classification.category] || classification.category;

  // 2. Persistencia en la API Principal (BackCallCenter en :3000)
  const mainEndpoint = `${MAIN_API_URL}/complaints/public`;
  
  const formData = new FormData();
  if (payload.evidenceFile) {
    formData.append('evidence', payload.evidenceFile);
  }
  formData.append('names', payload.names || 'Ciudadano');
  formData.append('lastname', payload.lastname || '');
  formData.append('phone', payload.phone || '0000000');
  formData.append('title', (payload.title || classification.cleanSummary || payload.text_raw).substring(0, 50));
  formData.append('incident', payload.text_raw);
  formData.append('address', payload.address || 'Dirección no especificada');
  formData.append('latitude', String(payload.latitude || '-17.3895'));
  formData.append('longitude', String(payload.longitude || '-66.1568'));
  formData.append('risk', String(riskNum));
  formData.append('categoryId', String(categoryId));
  formData.append('category', categoryNameToSend);
  formData.append('categoryName', categoryNameToSend);
  if (payload.district) {
    formData.append('district', payload.district);
  }

  if (payload.citizenEmail) {
    formData.append('citizenEmail', payload.citizenEmail);
  }
  if (payload.notifyEmail !== undefined && payload.notifyEmail !== null) {
    formData.append('notifyEmail', String(payload.notifyEmail));
  }

  let resMain;
  try {
    resMain = await fetch(mainEndpoint, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.error('[aiService] ❌ Error de conexión con el backend principal:', err);
    throw new Error('No se pudo establecer conexión con el servidor municipal para guardar la denuncia.');
  }

  const jsonMain = await resMain.json().catch(() => ({}));
  if (!resMain.ok) {
    const errorMsg = jsonMain.error || jsonMain.message || `Error del servidor (${resMain.status})`;
    throw new Error(errorMsg);
  }

  const savedComplaint = jsonMain.data || jsonMain;
  const officialCode = jsonMain.code || savedComplaint.code;

  if (!officialCode) {
    throw new Error('La denuncia fue procesada pero el servidor no retornó un código de seguimiento válido.');
  }

  return {
    ticketCode: officialCode,
    complaintId: savedComplaint.id,
    classification,
    denunciante: {
      names: payload.names || 'Ciudadano Web',
      phone: payload.phone || null,
    },
    status: savedComplaint.status || 'Pendiente',
    input_channel: payload.input_channel || 'WEB',
    createdAt: savedComplaint.createdAt || new Date().toISOString(),
  };
}

/**
 * Consulta el estado público de una denuncia por su código de seguimiento.
 */
export async function trackComplaintByCode(code) {
  const trimmed = code.trim().toUpperCase();
  const endpoint = `${MAIN_API_URL}/complaints/public/status/${encodeURIComponent(trimmed)}`;

  const res = await fetch(endpoint);
  if (res.status === 404) {
    throw new Error(`No se encontró ninguna denuncia con el código "${trimmed}".`);
  }
  if (!res.ok) {
    throw new Error('Error al consultar el estado de la denuncia.');
  }

  return await res.json();
}

/**
 * Envía la calificación de satisfacción de un ciudadano para una denuncia resuelta.
 */
export async function rateComplaint(code, rating) {
  const trimmed = code.trim().toUpperCase();
  const endpoint = `${MAIN_API_URL}/complaints/public/${encodeURIComponent(trimmed)}/rate`;
  const ratingNum = Number(rating);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating: ratingNum,
      satisfactionRating: ratingNum,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || json.error || 'No se pudo guardar la calificación.');
  }
  return json;
}

/**
 * Envía una solicitud de reapertura de denuncia por el ciudadano.
 */
export async function requestComplaintReopen(code, reopenReason) {
  const trimmed = code.trim().toUpperCase();
  const endpoint = `${MAIN_API_URL}/complaints/public/${encodeURIComponent(trimmed)}/request-reopen`;
  const reasonText = typeof reopenReason === 'string' ? reopenReason : String(reopenReason || '');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reason: reasonText,
      reopenReason: reasonText,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || json.error || 'No se pudo registrar la solicitud de reapertura.');
  }
  return json;
}

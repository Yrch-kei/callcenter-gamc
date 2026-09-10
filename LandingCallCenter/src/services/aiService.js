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
 * Devuelve las categorías reales de la base de datos municipal.
 */
export const localHeuristicClassifier = (text = '') => {
  const lower = (text || '').toLowerCase();

  if (lower.match(/alcohol|bebida|borracho|cerveza|tomando|feria|comercio|vendedor|acera/)) {
    return {
      categoria: 'Comercio informal',
      subcategoria: 'Consumo de alcohol en vía pública',
      prioridad: 'MEDIA',
      confianza: 0.92,
      resumen_limpio: text.slice(0, 140)
    };
  }
  if (lower.match(/arbol|árbol|rama|caido|caído|parque|jardin|jardín|verde/)) {
    return {
      categoria: 'Árbol peligroso',
      subcategoria: 'Árbol o rama caída',
      prioridad: 'ALTA',
      confianza: 0.95,
      resumen_limpio: text.slice(0, 140)
    };
  }
  if (lower.match(/poste|luz|cable|luminaria|foco|electrico|eléctrico|chispa/)) {
    return {
      categoria: 'Poste sin luz',
      subcategoria: 'Falla de alumbrado público',
      prioridad: 'ALTA',
      confianza: 0.95,
      resumen_limpio: text.slice(0, 140)
    };
  }
  if (lower.match(/bache|hueco|calle|asfalto|pavimento|avenida|calzada/)) {
    return {
      categoria: 'Bache en calzada',
      subcategoria: 'Deterioro vial',
      prioridad: 'MEDIA',
      confianza: 0.92,
      resumen_limpio: text.slice(0, 140)
    };
  }
  if (lower.match(/agua|tubo|tuberia|tubería|fuga|alcantarilla|desague|desagüe/)) {
    return {
      categoria: 'Fuga de agua',
      subcategoria: 'Fuga o colapso hidráulico',
      prioridad: 'ALTA',
      confianza: 0.95,
      resumen_limpio: text.slice(0, 140)
    };
  }
  if (lower.match(/basura|desperdicio|escombro|contenedor|limpieza/)) {
    return {
      categoria: 'Basura acumulada',
      subcategoria: 'Acumulación de residuos',
      prioridad: 'MEDIA',
      confianza: 0.92,
      resumen_limpio: text.slice(0, 140)
    };
  }

  return {
    categoria: 'Comercio informal',
    subcategoria: 'Inspección general',
    prioridad: 'BAJA',
    confianza: 0.70,
    resumen_limpio: text.slice(0, 140)
  };
};

export const getHeuristicClassification = localHeuristicClassifier;

/**
 * Realiza la clasificación con Ollama llamando al endpoint /api/generate.
 * Configura un timeout de 120 segundos para inferencia en CPU y limpia el temporizador en el bloque finally.
 */
export const classifyWithOllama = async (complaintText) => {
  const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434/api/generate';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 segundos para CPU

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gamc-clasificador',
        prompt: `Analiza y clasifica la siguiente denuncia ciudadana: "${complaintText}"`,
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const parsedResult = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
    return parsedResult;
  } catch (error) {
    console.warn("Ollama falló o superó el tiempo límite. Aplicando clasificador heurístico local:", error);
    return localHeuristicClassifier(complaintText);
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Registra y clasifica una denuncia con el modelo LLM y la persiste en la API Principal.
 */
export async function classifyAndRegisterComplaint(payload) {
  let aiData = null;

  // 1. Intento de clasificación con IA (gamc-backend en :4000 / Ollama)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 segundos timeout

  try {
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

    if (res.ok) {
      const json = await res.json();
      aiData = json.data || json;
    }
  } catch (error) {
    console.warn("Fallo o timeout al clasificar, aplicando clasificador heurístico o directo:", error);
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback heurístico semántico local si la IA falló o estuvo indisponible
  const rawClassification = aiData?.classification || localHeuristicClassifier(payload.text_raw);

  const catName = rawClassification.categoria || rawClassification.category || 'Comercio informal';
  const subcatName = rawClassification.subcategoria || rawClassification.subcategory || 'Inspección general';
  const prio = rawClassification.prioridad || rawClassification.priority || 'MEDIA';
  const conf = rawClassification.confianza ?? rawClassification.aiConfidence ?? 0.70;
  const confPercent = rawClassification.confidencePercent || `${(conf * 100).toFixed(1)}%`;
  const cleanSum = rawClassification.resumen_limpio || rawClassification.cleanSummary || payload.text_raw.slice(0, 140);

  const categoryAliases = {
    AREAS_VERDES_Y_FORESTAL: 'Árbol peligroso',
    ARBOL_PELIGROSO: 'Árbol peligroso',
    'Árbol peligroso': 'Árbol peligroso',
    ALUMBRADO_PUBLICO: 'Poste sin luz',
    POSTE_SIN_LUZ: 'Poste sin luz',
    'Poste sin luz': 'Poste sin luz',
    BACHEO_Y_VIAS: 'Bache en calzada',
    BACHE_EN_CALZADA: 'Bache en calzada',
    'Bache en calzada': 'Bache en calzada',
    AGUA_Y_ALCANTARILLADO: 'Fuga de agua',
    FUGA_DE_AGUA: 'Fuga de agua',
    'Fuga de agua': 'Fuga de agua',
    RESIDUOS_SOLIDOS: 'Basura acumulada',
    BASURA_ACUMULADA: 'Basura acumulada',
    'Basura acumulada': 'Basura acumulada',
    CONTROL_ACTIVIDADES_E_INTENDENCIA: 'Comercio informal',
    COMERCIO_INFORMAL: 'Comercio informal',
    'Comercio informal': 'Comercio informal',
  };

  const finalCategoryName = categoryAliases[catName] || catName;

  const classification = {
    categoria: finalCategoryName,
    category: finalCategoryName,
    subcategoria: subcatName,
    subcategory: subcatName,
    prioridad: prio,
    priority: prio,
    confianza: conf,
    aiConfidence: conf,
    confidencePercent: confPercent,
    resumen_limpio: cleanSum,
    cleanSummary: cleanSum,
    keywords: rawClassification.keywords || [finalCategoryName.toLowerCase()],
    requiresVerification: rawClassification.requiresVerification ?? (prio === 'BAJA'),
  };

  const riskNum = RISK_MAP[classification.priority] || 2;
  const categoryId = CATEGORY_MAP[classification.category] || CATEGORY_MAP[catName] || 1;

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
  formData.append('category', finalCategoryName);
  formData.append('categoryName', finalCategoryName);
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

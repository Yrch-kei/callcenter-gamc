/**
 * Servicio de Inteligencia Artificial para la Landing Page de Denuncias Municipal (GAMC).
 * Orquesta la transcripción con Whisper STT y la clasificación inteligente con Ollama LLM.
 */

const WHISPER_URL = import.meta.env.VITE_WHISPER_URL || 'http://localhost:5000/transcribe';
const GAMC_API_URL = import.meta.env.VITE_GAMC_API_URL || 'http://localhost:4000/api/v1';
const MAIN_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Transcribe un blob de audio usando el microservicio Whisper (FastAPI).
 * @param {Blob} audioBlob
 * @returns {Promise<string>} Texto transcrito
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

  // CONTRATO OBLIGATORIO: Whisper espera un campo multipart llamado 'file'
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
 * Registra y clasifica automáticamente una denuncia con el modelo LLM gamc-clasificador.
 * @param {Object} payload - { text_raw, address, district, names, phone, input_channel }
 * @returns {Promise<Object>} Resultado con ticket, clasificación, prioridad y resumen técnico
 */
export async function classifyAndRegisterComplaint(payload) {
  const endpoint = `${GAMC_API_URL}/complaints`;

  console.log('[aiService] 🚀 Enviando denuncia a clasificación IA:', payload);

  const requestBody = {
    text_raw: payload.text_raw,
    address: payload.address || 'No especificada',
    district: payload.district || undefined,
    names: payload.names || 'Ciudadano Web',
    phone: payload.phone || undefined,
    session_token: `LANDING_${Date.now()}`,
    input_channel: payload.input_channel || 'WEB',
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();

    if (!res.ok) {
      const details = data?.details ? Object.values(data.details).flat().join(' · ') : null;
      throw new Error(details || data?.error || `Error en servidor GAMC HTTP ${res.status}`);
    }

    console.log('[aiService] ✅ Respuesta de clasificación recibida:', data);
    return data.data || data;
  } catch (err) {
    console.error('[aiService] ❌ Error al clasificar denuncia:', err);
    throw err;
  }
}

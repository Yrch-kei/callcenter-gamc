// src/components/ChatInputVoz.tsx
// Micrófono → MediaRecorder → Whisper (local) para transcripción
// Usa el proxy de Vite: /whisper/transcribe → http://127.0.0.1:5000/transcribe

import { useState, useRef, useEffect, useCallback } from 'react'
import './ChatInputVoz.css'

interface ChatInputVozProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

type MicState = 'idle' | 'requesting' | 'listening' | 'processing' | 'error'

// URL del servicio Whisper — usa proxy de Vite en dev, variable de entorno en prod
const WHISPER_URL = import.meta.env.VITE_WHISPER_URL || '/whisper/transcribe'

export default function ChatInputVoz({ onTranscript, disabled = false }: ChatInputVozProps) {
  const [micState, setMicState]       = useState<MicState>('idle')
  const [errorMsg, setErrorMsg]       = useState('')
  const [permGranted, setPermGranted] = useState<boolean | null>(null)
  const [bars, setBars]               = useState([30, 50, 40, 60, 35])
  const [elapsed, setElapsed]         = useState(0) // segundos grabando

  const mediaRecRef     = useRef<MediaRecorder | null>(null)
  const chunksRef       = useRef<Blob[]>([])
  const streamRef       = useRef<MediaStream | null>(null)
  const barTimer        = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedTimer    = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Verificar estado de permiso al montar ──────────────────────────────────
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          setPermGranted(result.state === 'granted')
          result.onchange = () => setPermGranted(result.state === 'granted')
        })
        .catch(() => {}) // Firefox no soporta esto
    }

    return () => {
      if (barTimer.current) clearInterval(barTimer.current)
      if (elapsedTimer.current) clearInterval(elapsedTimer.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  const animateBars = (on: boolean) => {
    if (on) {
      barTimer.current = setInterval(() =>
        setBars(Array.from({ length: 5 }, () => 15 + Math.random() * 85)), 100)
    } else {
      if (barTimer.current) clearInterval(barTimer.current)
      setBars([30, 50, 40, 60, 35])
    }
  }

  const startElapsedTimer = () => {
    setElapsed(0)
    elapsedTimer.current = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)
  }

  const stopElapsedTimer = () => {
    if (elapsedTimer.current) clearInterval(elapsedTimer.current)
    setElapsed(0)
  }

  // ── Liberar stream de micrófono ─────────────────────────────────────────────
  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  // ── Formatear segundos ──────────────────────────────────────────────────────
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // ── Enviar audio a Whisper ──────────────────────────────────────────────────
  const sendToWhisper = async (audioBlob: Blob) => {
    setMicState('processing')
    console.log('[VOZ] 📤 Enviando audio a Whisper...', {
      size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
      type: audioBlob.type,
    })

    try {
      const formData = new FormData()
      // Whisper (FastAPI) espera un parámetro "file"
      const ext = audioBlob.type.includes('webm') ? 'webm' : audioBlob.type.includes('ogg') ? 'ogg' : 'wav'
      formData.append('file', audioBlob, `audio.${ext}`)

      // Intentar primero por proxy de Vite, luego directo
      let url = '/whisper/transcribe'
      try {
        const res = await fetch(url, { method: 'POST', body: formData })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const text = (data.text || '').trim()
        if (text) {
          console.log(`[VOZ] ✅ Whisper transcribió: "${text}"`)
          onTranscript(text)
        } else {
          console.log('[VOZ] ⚠️ Whisper no detectó texto')
          setErrorMsg('No se detectó voz en la grabación. Intenta hablar más fuerte o más cerca del micrófono.')
          setMicState('error')
          return
        }
      } catch (proxyErr) {
        // Si el proxy falla, intentar directo
        console.log('[VOZ] ⚠️ Proxy falló, intentando directo...', proxyErr)
        url = WHISPER_URL
        const res = await fetch(url, { method: 'POST', body: formData })
        if (!res.ok) {
          const errText = await res.text().catch(() => '')
          throw new Error(`HTTP ${res.status}: ${errText}`)
        }
        const data = await res.json()
        const text = (data.text || '').trim()
        if (text) {
          console.log(`[VOZ] ✅ Whisper transcribió (directo): "${text}"`)
          onTranscript(text)
        } else {
          console.log('[VOZ] ⚠️ Whisper no detectó texto')
          setErrorMsg('No se detectó voz en la grabación. Intenta hablar más fuerte o más cerca del micrófono.')
          setMicState('error')
          return
        }
      }

      setMicState('idle')
    } catch (err) {
      console.error('[VOZ] ❌ Error enviando a Whisper:', err)
      setErrorMsg(
        `Error al transcribir: ${(err as Error).message}. ` +
        'Verifica que el servicio Whisper esté corriendo (python app.py en whisper-service).'
      )
      setMicState('error')
    }
  }

  // ── Iniciar grabación ──────────────────────────────────────────────────────
  const startRecording = async () => {
    setErrorMsg('')
    setMicState('requesting')
    console.log('[VOZ] Paso 1: Solicitando permiso getUserMedia...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('[VOZ] ✅ Permiso concedido.')
      setPermGranted(true)
      streamRef.current = stream

      // Determinar el tipo MIME soportado
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus'
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '' // Dejar que el navegador elija
          }
        }
      }
      console.log('[VOZ] MIME type:', mimeType || '(default del navegador)')

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        console.log('[VOZ] MediaRecorder detenido, chunks:', chunksRef.current.length)
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        releaseStream()
        stopElapsedTimer()

        if (audioBlob.size < 1000) {
          // Audio muy corto/vacío
          console.log('[VOZ] ⚠️ Audio muy corto, descartando')
          setErrorMsg('La grabación fue muy corta. Mantén presionado el botón y habla.')
          setMicState('error')
          return
        }

        sendToWhisper(audioBlob)
      }

      recorder.onerror = (e) => {
        console.error('[VOZ] MediaRecorder error:', e)
        releaseStream()
        stopElapsedTimer()
        animateBars(false)
        setErrorMsg('Error durante la grabación de audio.')
        setMicState('error')
      }

      // Grabar en bloques de 250ms para mejor control
      recorder.start(250)
      console.log('[VOZ] 🎙️ Grabando...')
      setMicState('listening')
      animateBars(true)
      startElapsedTimer()

    } catch (err: unknown) {
      console.error('[VOZ] Error getUserMedia:', err)
      setPermGranted(false)
      const name = (err as Error).name
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMsg('PERMISO_DENEGADO')
      } else if (name === 'NotFoundError') {
        setErrorMsg('NO_MICROFONO')
      } else {
        setErrorMsg(`Error: ${(err as Error).message}`)
      }
      setMicState('error')
    }
  }

  // ── Detener grabación ─────────────────────────────────────────────────────
  const stopRecording = () => {
    console.log('[VOZ] 🛑 stopRecording()')
    animateBars(false)
    try {
      if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
        mediaRecRef.current.stop()
      }
    } catch {
      // Si ya estaba parado, ignorar
    }
    mediaRecRef.current = null
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const isListening  = micState === 'listening'
  const isRequesting = micState === 'requesting'
  const isProcessing = micState === 'processing'
  const isBusy       = isListening || isRequesting || isProcessing

  return (
    <div className={`voz-container ${isListening ? 'listening' : ''}`}>
      {/* Botón principal */}
      <button
        id="btn-grabar-voz"
        type="button"
        onClick={isBusy ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        className={`btn-mic ${isListening ? 'recording' : ''} ${isRequesting ? 'requesting' : ''} ${isProcessing ? 'processing' : ''}`}
        title={isListening ? 'Clic para detener' : isProcessing ? 'Procesando...' : 'Clic para hablar'}
      >
        {isRequesting ? <span className="mic-spinner"/> :
         isProcessing ? <span className="mic-spinner"/> :
         isListening  ? <span className="mic-bars">{bars.map((h,i)=><b key={i} style={{height:`${h}%`}}/>)}</span> :
         <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
           <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v7a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-1 16.93V21h2v-1.07A8.002 8.002 0 0 0 20 12h-2a6 6 0 0 1-12 0H4a8.002 8.002 0 0 0 7 7.93z"/>
         </svg>}
      </button>

      {/* Área de estado */}
      <div className="voz-status">
        {micState === 'idle' && permGranted === false && (
          <div className="voz-hint err-hint">🔒 Permiso denegado — ve abajo para solucionarlo</div>
        )}
        {micState === 'idle' && permGranted !== false && (
          <div className="voz-hint">Clic en 🎤 · habla en español · clic de nuevo para enviar</div>
        )}
        {isRequesting && (
          <div className="voz-hint" style={{color:'#fbbf24'}}>
            ⏳ Solicitando permiso de micrófono... <strong>acepta el popup del navegador</strong>
          </div>
        )}
        {isListening && (
          <div className="voz-live">
            <span className="live-dot"/>
            Grabando... <em className="interim">{formatTime(elapsed)}</em>
            <small style={{color:'#94a3b8', fontWeight: 400}}>(clic en 🛑 para detener y transcribir)</small>
          </div>
        )}
        {isProcessing && (
          <div className="voz-live" style={{color:'#fbbf24'}}>
            <span className="mic-spinner" style={{width: 12, height: 12, borderWidth: 2}}/>
            <span>Transcribiendo con Whisper...</span>
          </div>
        )}

        {/* Errores con instrucciones específicas */}
        {micState === 'error' && (
          <div className="voz-error-block">
            {errorMsg === 'PERMISO_DENEGADO' ? (
              <div className="voz-fix-steps">
                <strong>🔒 Permiso de micrófono denegado — soluciones:</strong>
                <ol>
                  <li>Haz clic en el <strong>candado 🔒</strong> o ícono 🎤 en la barra de dirección de Chrome</li>
                  <li>Cambia <em>"Micrófono"</em> de <em>Bloqueado</em> → <em>Permitir</em></li>
                  <li>Recarga la página (<kbd>F5</kbd>) y vuelve a intentar</li>
                </ol>
                <small style={{color:'#64748b'}}>
                  URL directa: <code>chrome://settings/content/microphone</code> → agrega <code>localhost:5173</code>
                </small>
              </div>
            ) : errorMsg === 'NO_MICROFONO' ? (
              <div className="voz-fix-steps">
                <strong>🎙️ No se detectó micrófono</strong>
                <ol>
                  <li>Verifica que el micrófono esté conectado</li>
                  <li>Revisa el Administrador de dispositivos de Windows</li>
                  <li>En Chrome: Configuración → Privacidad → Micrófono</li>
                </ol>
              </div>
            ) : (
              <div className="voz-err-simple">{errorMsg}</div>
            )}
            <button type="button" onClick={() => setMicState('idle')} className="btn-retry">
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

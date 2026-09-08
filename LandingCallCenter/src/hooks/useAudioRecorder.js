import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook para manejo de captura de audio y grabación con MediaRecorder.
 */
export function useAudioRecorder() {
  const [micState, setMicState] = useState('idle'); // 'idle' | 'requesting' | 'recording' | 'processing' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [permGranted, setPermGranted] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [bars, setBars] = useState([30, 50, 40, 60, 35, 45, 55]);

  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const barTimerRef = useRef(null);
  const timerRef = useRef(null);

  // Verificar estado del permiso al montar
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' })
        .then((result) => {
          setPermGranted(result.state === 'granted');
          result.onchange = () => setPermGranted(result.state === 'granted');
        })
        .catch(() => {});
    }

    return () => {
      stopAllTimers();
      releaseStream();
    };
  }, []);

  const stopAllTimers = () => {
    if (barTimerRef.current) clearInterval(barTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const animateBars = (active) => {
    if (active) {
      barTimerRef.current = setInterval(() => {
        setBars(Array.from({ length: 7 }, () => 15 + Math.random() * 85));
      }, 100);
    } else {
      if (barTimerRef.current) clearInterval(barTimerRef.current);
      setBars([30, 50, 40, 60, 35, 45, 55]);
    }
  };

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  /**
   * Inicia la grabación de audio desde el micrófono.
   */
  const startRecording = async () => {
    setErrorMsg('');
    setMicState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermGranted(true);
      streamRef.current = stream;

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(250);
      setMicState('recording');
      animateBars(true);
      startTimer();
    } catch (err) {
      console.error('[AudioRecorder] Error al acceder al micrófono:', err);
      setPermGranted(false);
      const name = err?.name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMsg('PERMISO_DENEGADO');
      } else if (name === 'NotFoundError') {
        setErrorMsg('NO_MICROFONO');
      } else {
        setErrorMsg(`Error de micrófono: ${err.message || 'Desconocido'}`);
      }
      setMicState('error');
    }
  };

  /**
   * Detiene la grabación y retorna el Blob generado.
   */
  const stopRecording = () => {
    return new Promise((resolve, reject) => {
      animateBars(false);
      stopTimer();

      const recorder = mediaRecRef.current;
      if (!recorder || recorder.state === 'inactive') {
        releaseStream();
        setMicState('idle');
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        releaseStream();
        mediaRecRef.current = null;

        if (audioBlob.size < 1000) {
          setErrorMsg('La grabación fue muy corta. Mantén presionado y habla claramente.');
          setMicState('error');
          reject(new Error('Audio muy corto'));
          return;
        }

        setMicState('idle');
        resolve(audioBlob);
      };

      recorder.onerror = (e) => {
        releaseStream();
        animateBars(false);
        setErrorMsg('Ocurrió un error en la grabación de audio.');
        setMicState('error');
        reject(e);
      };

      try {
        recorder.stop();
      } catch (err) {
        releaseStream();
        setMicState('idle');
        resolve(null);
      }
    });
  };

  const cancelRecording = () => {
    animateBars(false);
    stopTimer();
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      try {
        mediaRecRef.current.stop();
      } catch (e) {}
    }
    releaseStream();
    mediaRecRef.current = null;
    setMicState('idle');
    setRecordingTime(0);
  };

  const reset = () => {
    cancelRecording();
    setErrorMsg('');
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return {
    micState,
    setMicState,
    errorMsg,
    setErrorMsg,
    permGranted,
    recordingTime,
    formattedTime: formatTime(recordingTime),
    bars,
    isRecording: micState === 'recording',
    isRequesting: micState === 'requesting',
    isProcessing: micState === 'processing',
    isError: micState === 'error',
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  };
}

import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  Phone,
  Tag,
  RotateCcw,
  Loader2,
  Copy,
  Check,
  ShieldAlert,
  Sliders,
  FileText,
  Volume2,
  Search,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { transcribeAudio, classifyAndRegisterComplaint } from '../services/aiService';

const PRIORITY_CONFIG = {
  CRITICA: {
    label: 'CRÍTICA',
    icon: '🔴',
    color: '#ef4444',
    badgeClass: 'text-[#f87171] bg-[#ef444420] border-[#ef444450]',
  },
  ALTA: {
    label: 'ALTA',
    icon: '🟠',
    color: '#f97316',
    badgeClass: 'text-[#fb923c] bg-[#f9731620] border-[#f9731650]',
  },
  MEDIA: {
    label: 'MEDIA',
    icon: '🟡',
    color: '#f59e0b',
    badgeClass: 'text-[#fbbf24] bg-[#f59e0b20] border-[#f59e0b50]',
  },
  BAJA: {
    label: 'BAJA',
    icon: '🟢',
    color: '#10b981',
    badgeClass: 'text-[#34d399] bg-[#10b98120] border-[#10b98150]',
  },
};

export function CitizenComplaintAI() {
  const containerRef = useRef(null);
  const resultRef = useRef(null);

  // Estados del formulario
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [names, setNames] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState('WEB'); // 'WEB' | 'VOZ'

  // Estados de carga y resultado
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Hook de grabación de voz
  const {
    micState,
    setMicState,
    errorMsg,
    setErrorMsg,
    permGranted,
    formattedTime,
    bars,
    isRecording,
    isRequesting,
    isProcessing,
    startRecording,
    stopRecording,
    cancelRecording,
    reset: resetAudio,
  } = useAudioRecorder();

  // Animaciones GSAP al montar
  useGSAP(
    () => {
      gsap.fromTo(
        '.complaint-ai-card',
        { opacity: 0, y: 50, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );
    },
    { scope: containerRef }
  );

  // Manejador del botón de micrófono (Presionar para grabar / detener)
  const handleMicToggle = async () => {
    if (isRecording) {
      try {
        setTranscribing(true);
        setMicState('processing');
        const audioBlob = await stopRecording();
        if (audioBlob) {
          const text = await transcribeAudio(audioBlob);
          setDescription((prev) => (prev ? `${prev} ${text}` : text).trim());
          setChannel('VOZ');
        }
      } catch (err) {
        console.error('[ComplaintAI] Error en transcripción:', err);
        setErrorMsg(err.message || 'Error al transcribir el audio.');
      } finally {
        setTranscribing(false);
      }
    } else {
      setError(null);
      await startRecording();
    }
  };

  // Envío del formulario para clasificación con IA
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.length < 10) {
      setError('Por favor describe el problema con al menos 10 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await classifyAndRegisterComplaint({
        text_raw: description,
        address,
        district,
        names,
        phone,
        input_channel: channel,
      });

      setResult(data);

      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          gsap.fromTo(
            resultRef.current,
            { opacity: 0, y: 30, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)' }
          );
        }
      }, 100);
    } catch (err) {
      setError(err.message || 'No se pudo procesar la denuncia. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicket = () => {
    if (result?.ticketCode) {
      navigator.clipboard.writeText(result.ticketCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetAll = () => {
    setResult(null);
    setDescription('');
    setAddress('');
    setDistrict('');
    setNames('');
    setPhone('');
    setError(null);
    setChannel('WEB');
    resetAudio();
  };

  const priorityInfo = result?.classification?.priority
    ? PRIORITY_CONFIG[result.classification.priority] || PRIORITY_CONFIG.MEDIA
    : PRIORITY_CONFIG.MEDIA;

  return (
    <section id="denuncia-ia" ref={containerRef} className="relative py-28 px-6 bg-[#09090b] overflow-hidden">
      {/* Glow ambiental */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-12 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-[#A78BFA] border border-[#7C3AED40] bg-[#7C3AED15]">
            <Sparkles className="w-3.5 h-3.5" />
            Inteligencia Artificial Municipal
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[0.98]">
            Registra tu Denuncia <span className="text-gradient">por Voz o Texto.</span>
          </h2>

          <p className="max-w-xl text-[#71717a] text-base md:text-lg leading-relaxed">
            Habla o escribe la incidencia. Nuestro modelo de IA (Ollama + Whisper) clasificará automáticamente la categoría, subcategoría y nivel de prioridad.
          </p>
        </div>

        {/* Tarjeta Principal */}
        <div className="complaint-ai-card relative rounded-3xl border border-white/[0.1] p-6 md:p-10 overflow-hidden bg-[#121215]/80 backdrop-blur-xl shadow-2xl">
          <div
            className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, #7C3AED, #06B6D4, #7C3AED)' }}
          />

          {result ? (
            /* ========================================================================= */
            /* RESULTADO Y TARJETA DE CLASIFICACIÓN DE IA                                */
            /* ========================================================================= */
            <div ref={resultRef} className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#7C3AED20] border border-[#7C3AED50] flex items-center justify-center mx-auto text-[#A78BFA]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">¡Denuncia Registrada y Clasificada!</h3>
                <p className="text-sm text-[#71717a]">
                  Tu reporte ha sido procesado exitosamente por la Inteligencia Artificial del GAMC.
                </p>

                {/* Código de Ticket */}
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#18181b] border border-white/[0.12] mt-2">
                  <span className="text-xs text-[#71717a] uppercase font-mono">Código Ticket:</span>
                  <code className="text-lg font-mono font-bold text-[#A78BFA] tracking-wider">
                    {result.ticketCode}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyTicket}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[#a1a1aa] hover:text-white transition-colors"
                    title="Copiar código"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Grid de Clasificación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Categoría */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[11px] text-[#71717a] uppercase tracking-wider font-semibold">
                    Categoría Detectada
                  </span>
                  <p className="text-base font-bold text-[#A78BFA] capitalize">
                    {result.classification.category.replace(/_/g, ' ').toLowerCase()}
                  </p>
                </div>

                {/* Subcategoría */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[11px] text-[#71717a] uppercase tracking-wider font-semibold">
                    Subcategoría
                  </span>
                  <p className="text-base font-bold text-white capitalize">
                    {result.classification.subcategory.replace(/_/g, ' ').toLowerCase()}
                  </p>
                </div>

                {/* Badge Prioridad */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[11px] text-[#71717a] uppercase tracking-wider font-semibold">
                    Nivel de Prioridad
                  </span>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${priorityInfo.badgeClass}`}
                    >
                      {priorityInfo.icon} {priorityInfo.label}
                    </span>
                  </div>
                </div>

                {/* Confianza IA */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#71717a] uppercase tracking-wider font-semibold">
                      Confianza de la IA
                    </span>
                    <span className="font-bold text-[#38bdf8]">
                      {result.classification.confidencePercent}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#27272a] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] rounded-full transition-all duration-500"
                      style={{ width: result.classification.confidencePercent }}
                    />
                  </div>
                </div>
              </div>

              {/* Resumen Técnico */}
              <div className="p-5 rounded-2xl bg-[#7C3AED0d] border border-[#7C3AED30] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  Resumen Técnico Generado (Ollama)
                </div>
                <p className="text-sm text-[#e4e4e7] leading-relaxed italic">
                  "{result.classification.cleanSummary}"
                </p>
                {result.classification.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {result.classification.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-[#7C3AED20] text-[#c4b5fd] border border-[#7C3AED30]"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Alerta si requiere revisión */}
              {result.classification.requiresVerification && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200">
                    <strong>Revisión requerida:</strong> Debido a la complejidad o baja confianza del reporte, este ticket pasará por una breve validación manual en la central municipal.
                  </p>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  className="px-8 py-3.5 gap-2"
                  onClick={() => {
                    const trackInput = document.querySelector('input[placeholder*="DEN-"]');
                    if (trackInput) {
                      trackInput.value = result.ticketCode;
                    }
                    document.getElementById('consultar')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Search className="w-4 h-4" />
                  Hacer seguimiento ahora
                </Button>
                <Button variant="outline" className="px-8 py-3.5 gap-2" onClick={resetAll}>
                  <RotateCcw className="w-4 h-4" />
                  Registrar otra denuncia
                </Button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* FORMULARIO DE CAPTURA DE DENUNCIA (VOZ / TEXTO)                           */
            /* ========================================================================= */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sección Grabador de Voz */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#e4e4e7] flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#A78BFA]" />
                    Grabación de Voz por Micrófono (Whisper STT)
                  </label>
                  {channel === 'VOZ' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#7C3AED20] text-[#A78BFA] border border-[#7C3AED40] flex items-center gap-1">
                      <Mic className="w-3 h-3" /> Dictado por voz activo
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#18181b] border border-white/[0.08] flex flex-col md:flex-row items-center gap-4">
                  {/* Botón de Micrófono */}
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    disabled={loading || isTranscribingOrProcessing(micState, transcribing)}
                    className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isRecording
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/50 scale-105 animate-pulse'
                        : isTranscribingOrProcessing(micState, transcribing)
                        ? 'bg-[#7C3AED40] text-[#A78BFA] cursor-wait'
                        : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-[#7C3AED]/30 hover:scale-105'
                    }`}
                    title={isRecording ? 'Detener y transcribir' : 'Presionar para hablar'}
                  >
                    {isTranscribingOrProcessing(micState, transcribing) ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : isRecording ? (
                      <Square className="w-6 h-6 fill-current" />
                    ) : (
                      <Mic className="w-7 h-7" />
                    )}
                  </button>

                  {/* Estado y Onda del Sonido */}
                  <div className="flex-1 text-center md:text-left space-y-1">
                    {isRecording ? (
                      <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-rose-400 font-bold text-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                          Grabando... <span className="font-mono text-white ml-1">{formattedTime}</span>
                        </div>
                        <p className="text-xs text-[#71717a] mt-1">
                          Habla claramente sobre el problema municipal · Clic en 🛑 para detener y transcribir
                        </p>
                        {/* Barras de audio */}
                        <div className="flex items-center justify-center md:justify-start gap-1 h-6 mt-2">
                          {bars.map((h, i) => (
                            <div
                              key={i}
                              className="w-1.5 bg-[#A78BFA] rounded-full transition-all duration-100"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : isTranscribingOrProcessing(micState, transcribing) ? (
                      <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-[#38bdf8] font-semibold text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Transcribiendo audio con OpenAI Whisper...
                        </div>
                        <p className="text-xs text-[#71717a] mt-1">
                          Convirtiendo voz a texto en tiempo real.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-white">
                          Haz clic en el micrófono para hablar tu denuncia
                        </p>
                        <p className="text-xs text-[#71717a]">
                          Whisper procesará tu nota de voz y la colocará en la descripción.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Errores de Permiso/Micro */}
                {micState === 'error' && (
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      {errorMsg === 'PERMISO_DENEGADO' ? (
                        <span>
                          <strong>Micrófono bloqueado:</strong> Permite el uso del micrófono en el candado 🔒 de tu navegador y recarga la página.
                        </span>
                      ) : (
                        <span>{errorMsg}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Textarea de Descripción */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="ai-description" className="text-sm font-semibold text-[#e4e4e7]">
                    Descripción de la Incidencia <span className="text-rose-400">*</span>
                  </label>
                  <span
                    className={`text-xs ${
                      description.length < 10 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {description.length}/2000 {description.length < 10 && '(mínimo 10 caracteres)'}
                  </span>
                </div>
                <textarea
                  id="ai-description"
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (channel === 'VOZ' && !e.target.value) setChannel('WEB');
                  }}
                  placeholder="Describe la denuncia o habla con el micrófono (ej: Hay un poste de luz caído en la Av. Heroínas y Ayacucho con cables sueltos)..."
                  className="w-full px-4 py-3 rounded-xl bg-[#18181b] border border-white/[0.08] text-white placeholder-[#52525b] text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                  required
                  minLength={10}
                  maxLength={2000}
                />
              </div>

              {/* Ubicación y Distrito */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="ai-address" className="text-sm font-semibold text-[#e4e4e7] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#7C3AED]" /> Dirección / Ubicación
                  </label>
                  <input
                    id="ai-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, Avenida, Esquina o Barrio..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-white/[0.08] text-white placeholder-[#52525b] text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="ai-district" className="text-sm font-semibold text-[#e4e4e7] flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#7C3AED]" /> Distrito Municipal
                  </label>
                  <select
                    id="ai-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                  >
                    <option value="">Seleccionar Distrito (opcional)...</option>
                    {Array.from({ length: 14 }, (_, i) => (
                      <option key={i + 1} value={`D${i + 1}`}>
                        Distrito {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Datos del Ciudadano */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label htmlFor="ai-names" className="text-sm font-semibold text-[#e4e4e7] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#7C3AED]" /> Nombre Completo (Opcional)
                  </label>
                  <input
                    id="ai-names"
                    type="text"
                    value={names}
                    onChange={(e) => setNames(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-white/[0.08] text-white placeholder-[#52525b] text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="ai-phone" className="text-sm font-semibold text-[#e4e4e7] flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#7C3AED]" /> Teléfono de Contacto (Opcional)
                  </label>
                  <input
                    id="ai-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 77712345"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#18181b] border border-white/[0.08] text-white placeholder-[#52525b] text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                  />
                </div>
              </div>

              {/* Mensaje de Error General */}
              {error && (
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-200">{error}</p>
                </div>
              )}

              {/* Botón de Enviar / Clasificar */}
              <div className="pt-4 text-center">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading || description.length < 10}
                  className="w-full md:w-auto px-10 py-4 text-base font-bold gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      Clasificando con Ollama IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      Registrar y Clasificar con IA
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function isTranscribingOrProcessing(micState, transcribing) {
  return micState === 'processing' || transcribing;
}

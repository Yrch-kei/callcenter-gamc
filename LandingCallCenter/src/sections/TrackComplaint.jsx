import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Search,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  MapPin,
  CalendarDays,
  ChevronRight,
  XCircle,
  ArrowRightLeft,
  Tag,
  ImageIcon,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

gsap.registerPlugin(ScrollTrigger);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Normaliza y obtiene la configuración visual según el estado del backend.
 */
const getStatusConfig = (status) => {
  const normalized = (status || '').toString().trim().toLowerCase();

  switch (normalized) {
    case 'resuelta':
    case 'resuelto':
    case 'completada':
    case 'atendida':
      return {
        label: 'Resuelta',
        color: '#22c55e',
        bgClass: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30',
        icon: CheckCircle2,
        description: 'Tu denuncia fue atendida y resuelta con éxito por la cuadrilla técnica asignada.',
      };
    case 'en proceso':
    case 'en_proceso':
      return {
        label: 'En Proceso',
        color: '#06B6D4',
        bgClass: 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30',
        icon: Loader2,
        description: 'Personal técnico de la unidad municipal se encuentra interviniendo en la zona.',
      };
    case 'derivada':
    case 'derivado':
      return {
        label: 'Derivada',
        color: '#7C3AED',
        bgClass: 'text-purple-400 bg-purple-500/10 border border-purple-500/30',
        icon: ArrowRightLeft,
        description: 'El caso ha sido derivado a la unidad municipal competente para su programación.',
      };
    case 'cancelada':
    case 'rechazada':
    case 'cancelado':
      return {
        label: 'Cancelada',
        color: '#ef4444',
        bgClass: 'text-rose-400 bg-rose-500/10 border border-rose-500/30',
        icon: XCircle,
        description: 'La denuncia fue desestimada o cancelada tras la inspección técnica.',
      };
    case 'pendiente':
    default:
      return {
        label: 'Pendiente',
        color: '#f59e0b',
        bgClass: 'text-amber-400 bg-amber-500/10 border border-amber-500/30',
        icon: Clock,
        description: 'Tu denuncia fue registrada correctamente y está en espera de asignación.',
      };
  }
};

const riskLabels = { 1: 'Baja', 2: 'Media', 3: 'Alta', 4: 'Urgente' };
const riskColors = {
  1: 'text-[#a1a1aa] bg-[#27272a] border-[#3f3f46]',
  2: 'text-[#fbbf24] bg-[#f59e0b20] border-[#f59e0b40]',
  3: 'text-[#fb923c] bg-[#f9731620] border-[#f9731640]',
  4: 'text-[#f87171] bg-[#ef444420] border-[#ef444440]',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TrackComplaint() {
  const container = useRef(null);
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);
  const resultRef = useRef(null);

  useGSAP(
    () => {
      gsap.to('.track-glow', {
        y: -100,
        ease: 'none',
        scrollTrigger: {
          trigger: container.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });

      gsap.fromTo(
        '.track-reveal',
        { opacity: 0, y: 80, clipPath: 'inset(100% 0 0 0)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 1,
          stagger: 0.12,
          ease: 'power4.out',
          scrollTrigger: { trigger: '.track-header', start: 'top 75%', once: true },
        }
      );

      gsap.fromTo(
        '.track-search-card',
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.track-search-card', start: 'top 80%', once: true },
        }
      );
    },
    { scope: container }
  );

  const handleSearch = async () => {
    setError('');
    setResultado(null);

    const trimmed = codigo.trim().toUpperCase();
    if (!trimmed) {
      setError('Por favor ingresa tu código de seguimiento.');
      return;
    }

    setBuscando(true);

    try {
      const res = await fetch(`${API_URL}/complaints/public/status/${encodeURIComponent(trimmed)}`);

      if (res.status === 404) {
        setError(
          `No se encontró ninguna denuncia con el código "${trimmed}". Verifica que el código sea correcto (formato: GAMC-2026-XXXXX).`
        );
        setBuscando(false);
        return;
      }

      if (!res.ok) {
        setError('Ocurrió un error al consultar el servidor. Intenta nuevamente.');
        setBuscando(false);
        return;
      }

      const data = await res.json();
      setResultado(data);
      setError('');

      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          gsap.fromTo(
            resultRef.current,
            { opacity: 0, y: 30, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)' }
          );
        }
      }, 50);
    } catch {
      setError('No se pudo conectar con el servidor. Verifica que el servicio esté disponible.');
    }

    setBuscando(false);
  };

  const config = resultado ? getStatusConfig(resultado.status) : null;
  const StatusIcon = config?.icon;

  return (
    <section id="consultar" ref={container} className="relative py-32 px-6 bg-[#09090b] overflow-hidden">
      {/* Parallax glow */}
      <div
        className="track-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Separador */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24"
        style={{ background: 'linear-gradient(to bottom, transparent, #7C3AED44, transparent)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="track-header text-center mb-14 flex flex-col items-center gap-4">
          <span className="track-reveal inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-[#7C3AED] border border-[#7C3AED33] bg-[#7C3AED0a]">
            Seguimiento Ciudadano
          </span>
          <h2 className="track-reveal text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[0.95]">
            Consulta el estado
            <br />
            <span className="text-gradient">de tu denuncia.</span>
          </h2>
          <p className="track-reveal max-w-xl text-[#71717a] text-lg leading-relaxed">
            Ingresa el código único que te fue proporcionado al momento de registrar tu denuncia para conocer su estado actual.
          </p>
        </div>

        {/* Tarjeta de Búsqueda */}
        <div className="track-search-card relative max-w-2xl mx-auto mb-12">
          <div
            className="relative rounded-3xl border border-white/[0.1] p-6 md:p-8 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}
          >
            <div
              className="absolute inset-0 pointer-events-none rounded-3xl"
              style={{ background: 'radial-gradient(circle at 50% 0%, rgba(37,99,235,0.08), transparent 60%)' }}
            />
            <div
              className="absolute top-0 left-1/4 right-1/4 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #7C3AED, transparent)' }}
            />

            <div className="relative z-10">
              <label className="block text-sm font-medium text-[#a1a1aa] mb-3">
                Código de Seguimiento
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Ej: GAMC-2026-00001"
                    className="w-full px-5 py-3.5 rounded-xl bg-[#18181b] border border-white/[0.08] text-white placeholder-[#52525b] text-lg font-mono tracking-wider focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all duration-200"
                  />
                </div>
                <Button
                  variant="primary"
                  className="px-8 py-3.5 text-base gap-2 shrink-0"
                  onClick={handleSearch}
                  disabled={buscando}
                >
                  {buscando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {buscando ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 p-4 rounded-xl border border-[#ef444440] bg-[#ef444410]">
            <AlertCircle className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
            <p className="text-sm text-[#fca5a5]">{error}</p>
          </div>
        )}

        {/* Resultado */}
        {resultado && config && (
          <div ref={resultRef} className="max-w-2xl mx-auto">
            <div
              className="rounded-3xl border border-white/[0.08] overflow-hidden bg-[#121215]/90 backdrop-blur-xl shadow-2xl"
            >
              {/* Header de Estado Dinámico */}
              <div
                className="px-6 py-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${config.color}20`, border: `1px solid ${config.color}40` }}
                  >
                    <StatusIcon className={`w-6 h-6 ${config.label === 'En Proceso' ? 'animate-spin' : ''}`} style={{ color: config.color }} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg font-mono tracking-wider">{resultado.code}</p>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {resultado.risk >= 3 && (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${riskColors[resultado.risk]}`}>
                      {riskLabels[resultado.risk]}
                    </span>
                  )}
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${config.bgClass}`}>
                    {config.label}
                  </span>
                </div>
              </div>

              {/* Detalle de Datos */}
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DetailRow icon={Tag} label="Categoría Municipal" value={resultado.categoryName || '—'} />
                <DetailRow icon={ArrowRightLeft} label="Área / Unidad Asignada" value={resultado.areaName || '—'} />
                <DetailRow icon={MapPin} label="Dirección" value={resultado.address || '—'} />
                <DetailRow icon={CalendarDays} label="Fecha de Registro" value={formatDate(resultado.registerDate)} />
                {resultado.updateDate && (
                  <DetailRow icon={CalendarDays} label="Última Actualización" value={formatDate(resultado.updateDate)} />
                )}
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-xs text-[#71717a] uppercase tracking-wider font-semibold">
                    {resultado.title || 'Descripción de la Denuncia'}
                  </p>
                  <p className="text-sm text-[#e4e4e7] leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.04]">
                    {resultado.incident}
                  </p>
                </div>

                {/* Sección de Resultado Técnico de la Atención */}
                {(resultado.resolutionResult || resultado.technicalNotes || resultado.finishTime || config.label === 'Resuelta') && (
                  <div className="sm:col-span-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Resultado de la Atención Técnica
                    </div>
                    {resultado.resolutionResult && (
                      <p className="text-sm font-semibold text-white">
                        Dictamen Final: <span className="text-emerald-300 font-bold">{resultado.resolutionResult}</span>
                      </p>
                    )}
                    {resultado.technicalNotes && (
                      <p className="text-sm text-[#e4e4e7] leading-relaxed italic">
                        "{resultado.technicalNotes}"
                      </p>
                    )}
                    {resultado.finishTime && (
                      <p className="text-xs text-[#94a3b8] pt-1">
                        Trabajo finalizado el: <strong>{formatDate(resultado.finishTime)}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Fotos de Evidencia (Si están disponibles) */}
                {(resultado.imagesBefore?.length > 0 || resultado.imagesAfter?.length > 0) && (
                  <div className="sm:col-span-2 space-y-2 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                      <ImageIcon className="w-4 h-4" />
                      Fotografías de Inspección e Intervención
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {resultado.imagesBefore?.map((img, i) => (
                        <div key={`before-${i}`} className="space-y-1">
                          <img src={img} alt="Antes" className="w-24 h-24 object-cover rounded-xl border border-white/[0.1]" />
                          <span className="block text-[10px] text-center text-[#71717a]">Antes</span>
                        </div>
                      ))}
                      {resultado.imagesAfter?.map((img, i) => (
                        <div key={`after-${i}`} className="space-y-1">
                          <img src={img} alt="Después" className="w-24 h-24 object-cover rounded-xl border border-emerald-500/40" />
                          <span className="block text-[10px] text-center text-emerald-400 font-semibold">Después</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Información Geográfica */}
              {(resultado.distrito || resultado.comuna) && (
                <div className="px-6 py-4 border-t border-white/[0.06] flex flex-wrap gap-3 text-xs text-[#71717a] bg-white/[0.01]">
                  {resultado.comuna && (
                    <span className="flex items-center gap-1 text-[#a1a1aa]">
                      <MapPin className="w-3.5 h-3.5 text-[#7C3AED]" />
                      Comuna {resultado.comuna}
                    </span>
                  )}
                  {resultado.distrito && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-[#52525b]" />
                      <span className="text-[#a1a1aa]">Distrito Municipal {resultado.distrito}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-[#71717a] uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

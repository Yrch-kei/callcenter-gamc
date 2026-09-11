import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, MapPin, User, Phone, Calendar, Tag,
  Clock, CheckCircle2, XCircle, AlertTriangle,
  MessageSquare, ClipboardList, Wrench,
} from 'lucide-react'
import dayjs from 'dayjs'
import gsap from 'gsap'
import { useDenuncias } from '@/context/DenunciasContext'
import { DENUNCIA_STATUS, PRIORITY, STATUS_CONFIG } from '@/utils/constants'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui'

// ── Visual maps ───────────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  [PRIORITY.URGENTE]: { label: '🔴 Urgente',  class: 'bg-danger-light text-danger',   border: 'border-l-4 border-l-danger'  },
  [PRIORITY.ALTA]:    { label: '🟠 Alta',      class: 'bg-accent-50 text-accent',      border: 'border-l-4 border-l-accent'  },
  [PRIORITY.MEDIA]:   { label: '🟡 Media',     class: 'bg-warning-light text-warning', border: 'border-l-4 border-l-warning' },
  [PRIORITY.BAJA]:    { label: '⚪ Baja',      class: 'bg-gray-100 text-text-muted',   border: 'border-l-4 border-l-gray-300' },
}

const EVENTO_CONFIG = {
  creacion:      { icon: ClipboardList,  color: 'bg-gray-100 text-text-muted dark:bg-surface-dark-elevated',         dot: 'bg-gray-400' },
  asignacion:    { icon: User,           color: 'bg-primary-100 text-primary-700 dark:bg-primary-700/20',             dot: 'bg-primary'  },
  nota:          { icon: MessageSquare,  color: 'bg-warning-light text-warning',                                      dot: 'bg-warning'  },
  cambio_estado: { icon: CheckCircle2,   color: 'bg-success-light text-success',                                      dot: 'bg-success'  },
  derivacion:    { icon: ArrowLeft,      color: 'bg-accent-50 text-accent',                                           dot: 'bg-accent'   },
  edicion:       { icon: ClipboardList,  color: 'bg-gray-100 text-text-muted dark:bg-surface-dark-elevated',         dot: 'bg-gray-400' },
  intervencion:  { icon: Wrench,         color: 'bg-success-light text-success',                                      dot: 'bg-success'  },
}

const TERMINAL_STATES = [DENUNCIA_STATUS.RESUELTA, DENUNCIA_STATUS.RECHAZADA]

// ── Component ─────────────────────────────────────────────────────────────────
export default function CampoDenuncia() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { getById, getHistorial, loadHistorial } = useDenuncias()

  const denuncia  = getById(id)
  const historial = getHistorial(id)

  const pageRef = useRef(null)

  // Carga historial desde la API al montar o cambiar de denuncia
  useEffect(() => {
    if (id) loadHistorial(id)
  }, [id, loadHistorial])

  useEffect(() => {
    if (!pageRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      pageRef.current,
      { autoAlpha: 0, x: 20 },
      { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power2.out' }
    )
  }, [])

  if (!denuncia) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center py-20 text-center">
        <AlertTriangle className="mb-3 h-12 w-12 text-warning" />
        <p className="font-semibold text-text-primary dark:text-text-dark-primary">
          Denuncia no encontrada
        </p>
        <button
          onClick={() => navigate('/campo')}
          className="mt-4 cursor-pointer text-sm text-primary hover:underline"
        >
          Volver a la lista
        </button>
      </div>
    )
  }

  const prioConfig   = PRIORITY_CONFIG[denuncia.prioridad] ?? PRIORITY_CONFIG[PRIORITY.BAJA]
  const statusConfig = STATUS_CONFIG[denuncia.estado]
  const isTerminal   = TERMINAL_STATES.includes(denuncia.estado)

  return (
    <div ref={pageRef} className="mx-auto max-w-2xl pb-28">

      {/* ── Back + header ──────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-start gap-3">
        <button
          onClick={() => navigate('/campo')}
          className="mt-0.5 cursor-pointer rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary dark:hover:bg-surface-dark-elevated"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-medium text-text-muted">{denuncia.id}</p>
          <h1 className="mt-0.5 text-xl font-bold leading-snug text-text-primary dark:text-text-dark-primary">
            {denuncia.titulo}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', prioConfig.class)}>
              {prioConfig.label}
            </span>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                statusConfig?.bg, statusConfig?.text
              )}
            >
              {statusConfig?.label ?? denuncia.estado}
            </span>
            {denuncia.area && (
              <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-700/20 dark:text-primary">
                {denuncia.area}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Terminal banner ─────────────────────────────────────────────────── */}
      {isTerminal && (
        <div className={cn(
          'mb-4 flex items-center gap-3 rounded-2xl p-4',
          denuncia.estado === DENUNCIA_STATUS.RESUELTA
            ? 'bg-success-light text-success'
            : 'bg-danger-light text-danger'
        )}>
          {denuncia.estado === DENUNCIA_STATUS.RESUELTA
            ? <CheckCircle2 className="h-5 w-5 shrink-0" />
            : <XCircle      className="h-5 w-5 shrink-0" />
          }
          <div>
            <p className="font-semibold">
              {denuncia.estado === DENUNCIA_STATUS.RESUELTA ? 'Denuncia resuelta' : 'Denuncia rechazada'}
            </p>
            <p className="text-sm opacity-80">No se puede registrar una intervención.</p>
          </div>
        </div>
      )}

      {!isTerminal && (
        <div className="mb-4 rounded-2xl border border-primary/20 bg-primary-50 px-4 py-3 text-sm text-primary-700 dark:border-primary/30 dark:bg-primary-700/10 dark:text-primary">
          Esta denuncia está disponible para el personal de campo del área <strong>{denuncia.area || 'correspondiente'}</strong>. Al iniciar la intervención estás aceptando atender este caso.
        </div>
      )}

      {/* ── Sección: Descripción ────────────────────────────────────────────── */}
      <Section icon={ClipboardList} title="Descripción">
        <p className="text-sm leading-relaxed text-text-secondary dark:text-text-dark-secondary">
          {denuncia.descripcion}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <InfoChip icon={Tag}      label="Categoría"  value={denuncia.categoria} />
          <InfoChip icon={Calendar} label="Registrada" value={dayjs(denuncia.fecha).format('DD/MM/YYYY HH:mm')} />
        </div>
      </Section>

      {/* ── Sección: Ubicación ──────────────────────────────────────────────── */}
      <Section icon={MapPin} title="Ubicación">
        <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
          {denuncia.direccion}
        </p>
        {denuncia.lat && denuncia.lng && (
          <p className="mt-1 font-mono text-xs text-text-muted">
            {denuncia.lat.toFixed(5)}, {denuncia.lng.toFixed(5)}
          </p>
        )}
        {denuncia.distrito && (
          <div className="mt-3 flex flex-wrap gap-2">
            {denuncia.distrito    && <LocationTag label="Distrito"    value={denuncia.distrito}    />}
            {denuncia.subdistrito && <LocationTag label="Subdistrito" value={denuncia.subdistrito} />}
            {denuncia.otb         && <LocationTag label="OTB"         value={denuncia.otb}         />}
          </div>
        )}
      </Section>

      {/* ── Sección: Ciudadano ──────────────────────────────────────────────── */}
      <Section icon={User} title="Ciudadano">
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <InfoChip icon={User}  label="Nombre"   value={denuncia.ciudadano ?? '—'} />
          <InfoChip icon={Phone} label="Teléfono" value={denuncia.telefono  ?? '—'} />
        </div>
      </Section>

      {/* ── Sección: Historial ──────────────────────────────────────────────── */}
      {historial.length > 0 && (
        <Section icon={Clock} title="Historial">
          <div className="relative space-y-0 pl-5">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
            {historial.map((evento) => {
              const config = EVENTO_CONFIG[evento.tipo] ?? EVENTO_CONFIG.creacion
              const EventIcon = config.icon
              return (
                <div key={evento.id} className="relative pb-4 last:pb-0">
                  <div
                    className={cn(
                      'absolute -left-5 top-1 flex h-5 w-5 items-center justify-center rounded-full',
                      config.color
                    )}
                  >
                    <EventIcon className="h-2.5 w-2.5" />
                  </div>
                  <p className="text-sm text-text-primary dark:text-text-dark-primary">
                    {evento.descripcion}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {dayjs(evento.fecha).format('DD/MM/YYYY HH:mm')}
                    {evento.usuario && ` · ${evento.usuario}`}
                  </p>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* ── Sticky CTA ─────────────────────────────────────────────────────── */}
      {!isTerminal && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 p-4 backdrop-blur-sm dark:border-gray-700 dark:bg-surface-dark-card/95 md:sticky md:bottom-0 md:border-0 md:bg-transparent md:p-0 md:pt-2 md:backdrop-blur-none">
          <div className="mx-auto max-w-2xl">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate(`/campo/${denuncia.id}/intervencion`)}
            >
              <Wrench className="h-5 w-5" />
              Aceptar y registrar intervención
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }) {
  return (
    <div className="mb-3 rounded-2xl border border-gray-100 bg-surface-card p-4 dark:border-gray-800 dark:bg-surface-dark-card">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary dark:text-text-dark-primary">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      {children}
    </div>
  )
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
      <div>
        <p className="text-[10px] uppercase tracking-wide text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">{value}</p>
      </div>
    </div>
  )
}

function LocationTag({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 px-2.5 py-1.5 dark:bg-surface-dark-elevated">
      <p className="text-[10px] uppercase tracking-wide text-text-muted">{label}</p>
      <p className="text-xs font-medium text-text-primary dark:text-text-dark-primary">{value}</p>
    </div>
  )
}

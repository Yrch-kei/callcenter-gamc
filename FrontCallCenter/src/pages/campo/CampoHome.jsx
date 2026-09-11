import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Clock, CheckCircle, AlertTriangle, ClipboardList,
  MapPin, ChevronRight, X, Inbox,
} from 'lucide-react'
import gsap from 'gsap'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import es from 'dayjs/locale/es'
import { useAuth } from '@/context/AuthContext'
import { useDenuncias } from '@/context/DenunciasContext'
import { DENUNCIA_STATUS, PRIORITY } from '@/utils/constants'
import { cn } from '@/utils/cn'

dayjs.extend(relativeTime)
dayjs.locale(es)

// ── Visual maps ───────────────────────────────────────────────────────────────
const PRIORITY_BORDER = {
  [PRIORITY.URGENTE]: 'border-l-[3px] border-l-danger',
  [PRIORITY.ALTA]:    'border-l-[3px] border-l-accent',
  [PRIORITY.MEDIA]:   'border-l-[3px] border-l-warning',
  [PRIORITY.BAJA]:    'border-l-[3px] border-l-gray-300 dark:border-l-gray-600',
}

const PRIORITY_PILL = {
  [PRIORITY.URGENTE]: 'bg-danger-light text-danger font-semibold',
  [PRIORITY.ALTA]:    'bg-accent-50 text-accent font-semibold',
  [PRIORITY.MEDIA]:   'bg-warning-light text-warning',
  [PRIORITY.BAJA]:    'bg-gray-100 text-text-muted dark:bg-surface-dark-elevated dark:text-text-dark-secondary',
}

const PRIORITY_LABEL = {
  [PRIORITY.URGENTE]: '🔴 Urgente',
  [PRIORITY.ALTA]:    '🟠 Alta',
  [PRIORITY.MEDIA]:   '🟡 Media',
  [PRIORITY.BAJA]:    '⚪ Baja',
}

const STATUS_PILL = {
  [DENUNCIA_STATUS.PENDIENTE]:  'bg-warning-light text-warning',
  [DENUNCIA_STATUS.EN_PROCESO]: 'bg-primary-100 text-primary-700 dark:bg-primary-700/20 dark:text-primary',
}

const STATUS_LABEL = {
  [DENUNCIA_STATUS.PENDIENTE]:  'Pendiente',
  [DENUNCIA_STATUS.EN_PROCESO]: 'En proceso',
}

const STATS_CONFIG = [
  { key: 'pendientes', label: 'Pendientes',  icon: Clock,         color: 'text-warning', bg: 'bg-warning-light'  },
  { key: 'enProceso',  label: 'En proceso',  icon: ClipboardList, color: 'text-primary',  bg: 'bg-primary-100'   },
  { key: 'resueltas',  label: 'Atendidas',   icon: CheckCircle,   color: 'text-success',  bg: 'bg-success-light' },
  { key: 'urgentes',   label: 'Urgentes',    icon: AlertTriangle, color: 'text-danger',   bg: 'bg-danger-light'  },
]

const STATUS_FILTERS = [
  { value: '',                          label: 'Todos'      },
  { value: DENUNCIA_STATUS.PENDIENTE,   label: 'Pendientes' },
  { value: DENUNCIA_STATUS.EN_PROCESO,  label: 'En proceso' },
]

const PRIORITY_FILTERS = [
  { value: '',               label: 'Toda urgencia' },
  { value: PRIORITY.URGENTE, label: '🔴 Urgente'    },
  { value: PRIORITY.ALTA,    label: '🟠 Alta'        },
  { value: PRIORITY.MEDIA,   label: '🟡 Media'       },
  { value: PRIORITY.BAJA,    label: '⚪ Baja'        },
]

const PRIO_ORDER = [PRIORITY.URGENTE, PRIORITY.ALTA, PRIORITY.MEDIA, PRIORITY.BAJA]

// ── Component ─────────────────────────────────────────────────────────────────
export default function CampoHome() {
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const { denuncias, stats } = useDenuncias()

  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const headerRef = useRef(null)
  const statsRef  = useRef(null)
  const listRef   = useRef(null)

  // Show only active denuncias (campo doesn't see closed ones by default)
  const activeDenuncias = useMemo(
    () => denuncias.filter(
      (d) => d.estado === DENUNCIA_STATUS.PENDIENTE || d.estado === DENUNCIA_STATUS.EN_PROCESO
    ),
    [denuncias]
  )

  const filtered = useMemo(() => {
    let res = [...activeDenuncias]
    if (statusFilter)   res = res.filter((d) => d.estado    === statusFilter)
    if (priorityFilter) res = res.filter((d) => d.prioridad === priorityFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      res = res.filter(
        (d) =>
          d.titulo?.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.direccion?.toLowerCase().includes(q)
      )
    }
    res.sort((a, b) => {
      const pa = PRIO_ORDER.indexOf(a.prioridad)
      const pb = PRIO_ORDER.indexOf(b.prioridad)
      if (pa !== pb) return pa - pb
      return new Date(b.fecha) - new Date(a.fecha)
    })
    return res
  }, [activeDenuncias, statusFilter, priorityFilter, search])

  // Entry animation
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      [headerRef.current, statsRef.current],
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
    )
  }, [])

  // Re-animate cards when list changes
  useEffect(() => {
    if (!listRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cards = listRef.current.querySelectorAll('[data-card]')
    if (!cards.length) return
    gsap.fromTo(
      cards,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
    )
  }, [filtered])

  const hasFilters = search || statusFilter || priorityFilter
  const clearFilters = () => { setSearch(''); setStatusFilter(''); setPriorityFilter('') }

  return (
    <div className="mx-auto max-w-2xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div ref={headerRef} className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
          Propuestas del área
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary dark:text-text-dark-secondary">
            {user?.name}
          </span>
          {user?.area && (
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-700/20 dark:text-primary">
              {user.area}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Aquí ves las denuncias derivadas al área a la que perteneces. Puedes decidir cuáles atender.
        </p>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div ref={statsRef} className="mb-5 grid grid-cols-4 gap-2">
        {STATS_CONFIG.map(({ key, label, icon: Icon, color, bg }) => (
          <div
            key={key}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-gray-100 bg-surface-card p-3 dark:border-gray-800 dark:bg-surface-dark-card"
          >
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', bg)}>
              <Icon className={cn('h-4 w-4', color)} />
            </div>
            <span className="text-xl font-bold tabular-nums leading-none text-text-primary dark:text-text-dark-primary">
              {stats[key]}
            </span>
            <span className="text-center text-[10px] leading-tight text-text-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, título o dirección..."
          className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-text-muted hover:text-text-primary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Filtros (scroll horizontal en móvil) ───────────────────────────── */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || 'all-status'}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200 dark:bg-surface-dark-elevated dark:text-text-dark-secondary dark:hover:bg-gray-700'
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="mx-1 self-stretch w-px bg-gray-200 dark:bg-gray-700" />
          {PRIORITY_FILTERS.map((f) => (
            <button
              key={f.value || 'all-prio'}
              onClick={() => setPriorityFilter(f.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                priorityFilter === f.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200 dark:bg-surface-dark-elevated dark:text-text-dark-secondary dark:hover:bg-gray-700'
              )}
            >
              {f.label}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 whitespace-nowrap rounded-full bg-danger-light px-3 py-1.5 text-sm font-medium text-danger"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Count ──────────────────────────────────────────────────────────── */}
      <p className="mb-3 text-xs text-text-muted">
        {filtered.length} denuncia{filtered.length !== 1 && 's'}{' '}
        {hasFilters ? 'con estos filtros' : 'activas'}
      </p>

      {/* ── Lista ──────────────────────────────────────────────────────────── */}
      <div ref={listRef} className="space-y-2.5">
        {filtered.length === 0 ? (
          <EmptyState hasFilters={!!hasFilters} onClear={clearFilters} />
        ) : (
          filtered.map((d) => (
            <DenunciaCard
              key={d.id}
              denuncia={d}
              onClick={() => navigate(`/campo/${d.id}`)}
            />
          ))
        )}
      </div>

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DenunciaCard({ denuncia: d, onClick }) {
  return (
    <button
      data-card
      onClick={onClick}
      className={cn(
        'group w-full cursor-pointer rounded-2xl border border-gray-100 bg-surface-card p-4 text-left shadow-sm',
        'transition-all duration-150 hover:border-primary/30 hover:shadow-md active:scale-[0.985]',
        'dark:border-gray-800 dark:bg-surface-dark-card',
        PRIORITY_BORDER[d.prioridad]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {/* Pills row */}
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] font-medium text-text-muted">{d.id}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs', PRIORITY_PILL[d.prioridad])}>
              {PRIORITY_LABEL[d.prioridad]}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_PILL[d.estado])}>
              {STATUS_LABEL[d.estado]}
            </span>
          </div>

          {/* Title */}
          <p className="font-semibold leading-snug text-text-primary dark:text-text-dark-primary">
            {d.titulo}
          </p>

          {/* Address */}
          {d.direccion && (
            <p className="mt-1 flex items-center gap-1 text-sm text-text-secondary dark:text-text-dark-secondary">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <span className="line-clamp-1">{d.direccion}</span>
            </p>
          )}

          {/* Meta */}
          <p className="mt-1.5 text-[11px] text-text-muted">
            {d.categoria} · {dayjs(d.fecha).fromNow()}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-primary dark:text-gray-600" />
      </div>
    </button>
  )
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-surface-dark-elevated">
        <Inbox className="h-8 w-8 text-gray-400" />
      </div>
      <p className="font-semibold text-text-primary dark:text-text-dark-primary">
        {hasFilters ? 'Sin resultados' : 'Todo al día'}
      </p>
      <p className="mt-1 text-sm text-text-muted">
        {hasFilters ? 'No hay denuncias con esos filtros.' : 'No tienes denuncias activas en este momento.'}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="mt-4 text-sm font-medium text-primary hover:underline">
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import {
  Filter, List, ChevronUp, MapPin, Flame, CircleDot, Loader2,
} from 'lucide-react'
import gsap from 'gsap'
import { Button, Select } from '@/components/ui'
import StatusBadge from '@/components/shared/StatusBadge'
import { useDenuncias } from '@/context/DenunciasContext'
import complaintService from '@/services/complaintService'
import { DENUNCIA_STATUS, PRIORITY } from '@/utils/constants'
import { cn } from '@/utils/cn'

import 'leaflet/dist/leaflet.css'

// Fix default marker icons in Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Constants ──────────────────────────────────────────────────────────────────
const CENTER = [-17.3895, -66.1568]  // Cochabamba, Bolivia

const STATUS_MARKER_COLORS = {
  [DENUNCIA_STATUS.PENDIENTE]:  '#f59e0b',
  [DENUNCIA_STATUS.EN_PROCESO]: '#4ac1e0',
  [DENUNCIA_STATUS.RESUELTA]:   '#22c55e',
  [DENUNCIA_STATUS.RECHAZADA]:  '#ef4444',
}

const STATUS_LABELS = {
  [DENUNCIA_STATUS.PENDIENTE]:  'Pendiente',
  [DENUNCIA_STATUS.EN_PROCESO]: 'En proceso',
  [DENUNCIA_STATUS.RESUELTA]:   'Resuelta',
  [DENUNCIA_STATUS.RECHAZADA]:  'Rechazada',
}

// Weights for heatmap intensity: urgente punishes more heat
const PRIORITY_WEIGHT = {
  [PRIORITY.URGENTE]: 1.0,
  [PRIORITY.ALTA]:    0.65,
  [PRIORITY.MEDIA]:   0.35,
  [PRIORITY.BAJA]:    0.15,
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function createColoredIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;
      background:${color};
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
    "></div>`,
    iconSize:    [28, 28],
    iconAnchor:  [14, 14],
    popupAnchor: [0, -16],
  })
}

// ── FitBounds ──────────────────────────────────────────────────────────────────
function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] })
    }
  }, [positions, map])
  return null
}

// ── FocusController ────────────────────────────────────────────────────────────
function FocusController({ target, onFocusHandled }) {
  const map = useMap()
  useEffect(() => {
    if (target && target.lat != null && target.lng != null) {
      const lat = parseFloat(target.lat)
      const lng = parseFloat(target.lng)
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        map.flyTo([lat, lng], target.zoom || 17, { duration: 1.5 })
        if (onFocusHandled && target.selectedId) {
          onFocusHandled(target.selectedId)
        }
      }
    }
  }, [target, map, onFocusHandled])
  return null
}

// ── HeatmapLayer ───────────────────────────────────────────────────────────────
function HeatmapLayer({ points }) {
  const map      = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    // Remove previous layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    if (!points.length) return

    layerRef.current = L.heatLayer(points, {
      radius:  38,
      blur:    22,
      maxZoom: 17,
      max:     1.0,
      gradient: { 0.25: '#60a5fa', 0.5: '#34d399', 0.75: '#fbbf24', 1.0: '#ef4444' },
    }).addTo(map)

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, points])

  return null
}

// ── ViewToggle ─────────────────────────────────────────────────────────────────
function ViewToggle({ value, onChange }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => onChange('markers')}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors',
          value === 'markers'
            ? 'bg-primary text-white'
            : 'bg-white text-text-muted hover:bg-gray-50 dark:bg-surface-dark-elevated dark:hover:bg-gray-700'
        )}
      >
        <CircleDot className="h-3.5 w-3.5" />
        Marcadores
      </button>
      <button
        onClick={() => onChange('heatmap')}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 border-l border-gray-200 px-3 py-1.5 text-xs font-semibold transition-colors dark:border-gray-700',
          value === 'heatmap'
            ? 'bg-primary text-white'
            : 'bg-white text-text-muted hover:bg-gray-50 dark:bg-surface-dark-elevated dark:hover:bg-gray-700'
        )}
      >
        <Flame className="h-3.5 w-3.5" />
        Calor
      </button>
    </div>
  )
}

// ── Time period options for heatmap ────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { value: 'year',  label: 'Este año'    },
  { value: 'month', label: 'Este mes'    },
  { value: 'week',  label: 'Esta semana' },
  { value: 'today', label: 'Hoy'         },
]

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MapView() {
  const navigate = useNavigate()
  const location = useLocation()
  const focusTarget = location.state
  const { denuncias } = useDenuncias()

  const [statusFilter,   setStatusFilter]   = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [viewMode,       setViewMode]       = useState('markers') // 'markers' | 'heatmap'
  const [panelOpen,      setPanelOpen]      = useState(true)
  const [heatPeriod,     setHeatPeriod]     = useState('year')
  const [apiHeatPoints,  setApiHeatPoints]  = useState(null)   // null = not loaded yet
  const [heatLoading,    setHeatLoading]    = useState(false)
  const [selectedId,     setSelectedId]     = useState(focusTarget?.selectedId || null)
  const [activeFlyTarget, setActiveFlyTarget] = useState(
    focusTarget ? { lat: focusTarget.lat, lng: focusTarget.lng, zoom: 17, selectedId: focusTarget.selectedId } : null
  )

  const panelRef   = useRef(null)
  const mapAreaRef = useRef(null)
  const markerRefs = useRef({})

  useEffect(() => {
    if (focusTarget && focusTarget.lat != null && focusTarget.lng != null) {
      setActiveFlyTarget({
        lat: focusTarget.lat,
        lng: focusTarget.lng,
        zoom: 17,
        selectedId: focusTarget.selectedId
      })
      if (focusTarget.selectedId) {
        setSelectedId(focusTarget.selectedId)
      }
    }
  }, [focusTarget])

  // ── Fetch heatmap from API when mode switches or period changes ──────────────
  const fetchHeatmap = useCallback(async () => {
    setHeatLoading(true)
    try {
      const year = new Date().getFullYear()
      const raw = await complaintService.getHeatmap(year)
      const filtered = raw.filter((p) => {
        if (!p.lat || !p.lng) return false
        return true
      })
      setApiHeatPoints(filtered.map((p) => [p.lat, p.lng, p.weight ?? 1]))
    } catch {
      setApiHeatPoints(null)
    } finally {
      setHeatLoading(false)
    }
  }, [])

  useEffect(() => {
    if (viewMode === 'heatmap') fetchHeatmap()
  }, [viewMode, fetchHeatmap])

  // ── Panel slide animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!panelRef.current || !panelOpen) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      panelRef.current,
      { x: -320, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out' }
    )
  }, [panelOpen])

  // ── View mode transition ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapAreaRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(mapAreaRef.current, { opacity: 0.6 }, { opacity: 1, duration: 0.35, ease: 'power2.out' })
  }, [viewMode])

  // ── Filtering and Coordinate Normalization ───────────────────────────────
  const filtered = useMemo(() => {
    let data = [...denuncias]
    if (statusFilter)   data = data.filter((d) => d.estado    === statusFilter)
    if (categoryFilter) data = data.filter((d) => d.categoria === categoryFilter)
    return data
  }, [denuncias, statusFilter, categoryFilter])

  const validComplaints = useMemo(() => {
    return filtered
      .map((d) => {
        const lat = parseFloat(d.lat ?? d.latitude)
        const lng = parseFloat(d.lng ?? d.longitude)
        return {
          ...d,
          latNum: !isNaN(lat) && lat !== 0 ? lat : null,
          lngNum: !isNaN(lng) && lng !== 0 ? lng : null,
        }
      })
      .filter((d) => d.latNum !== null && d.lngNum !== null)
  }, [filtered])

  const positions = useMemo(
    () => validComplaints.map((d) => [d.latNum, d.lngNum]),
    [validComplaints]
  )

  // Auto-abrir popup cuando cambia la denuncia seleccionada
  useEffect(() => {
    if (selectedId && markerRefs.current[selectedId]) {
      markerRefs.current[selectedId].openPopup()
    }
  }, [selectedId, validComplaints])

  const handleSelectComplaintFromList = (d) => {
    const idKey = d.id || d._id
    setSelectedId(idKey)
    const lat = d.latNum ?? parseFloat(d.lat ?? d.latitude)
    const lng = d.lngNum ?? parseFloat(d.lng ?? d.longitude)
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      setActiveFlyTarget({ lat, lng, zoom: 16, selectedId: idKey })
    }
    if (markerRefs.current[idKey]) {
      markerRefs.current[idKey].openPopup()
    }
  }

  // Heatmap points: prefer API data (PostGIS aggregated), fallback to local denuncias
  const heatPoints = useMemo(() => {
    if (apiHeatPoints) return apiHeatPoints
    return filtered
      .filter((d) => d.lat && d.lng)
      .map((d) => [d.lat, d.lng, PRIORITY_WEIGHT[d.prioridad] ?? 0.3])
  }, [apiHeatPoints, filtered])

  const statusOptions = [
    { value: DENUNCIA_STATUS.PENDIENTE,  label: 'Pendiente'  },
    { value: DENUNCIA_STATUS.EN_PROCESO, label: 'En Proceso' },
    { value: DENUNCIA_STATUS.RESUELTA,   label: 'Resuelta'   },
    { value: DENUNCIA_STATUS.RECHAZADA,  label: 'Rechazada'  },
  ]

  // Categorías derivadas de las denuncias cargadas (evita lista estática)
  const categoryOptions = useMemo(() => {
    const cats = [...new Set(denuncias.map((d) => d.categoria).filter(Boolean))]
    return cats.map((c) => ({ value: c, label: c }))
  }, [denuncias])

  const hasFilters = statusFilter || categoryFilter

  const clearFilters = () => {
    setStatusFilter('')
    setCategoryFilter('')
  }

  return (
    <div className="space-y-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary">
            Mapa de Denuncias
          </h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
            {filtered.length} denuncia{filtered.length !== 1 && 's'} en el mapa
          </p>
        </div>
        <Button
          variant={panelOpen ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setPanelOpen(!panelOpen)}
          className="hidden md:inline-flex"
        >
          <List className="h-4 w-4" />
          Panel
        </Button>
      </div>

      {/* ── Map + Panel container ───────────────────────────────────────────── */}
      <div
        className="relative flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
        style={{ height: 'calc(100dvh - 12rem)' }}
      >

        {/* ── Side Panel (desktop) ─────────────────────────────────────────── */}
        {panelOpen && (
          <div
            ref={panelRef}
            className="hidden w-80 shrink-0 flex-col border-r border-gray-200 bg-surface-card md:flex dark:border-gray-700 dark:bg-surface-dark-card"
          >
            {/* Filters */}
            <div className="space-y-3 border-b border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary dark:text-text-dark-primary">
                  <Filter className="h-4 w-4 text-primary" />
                  Filtros
                </h3>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="cursor-pointer text-xs font-medium text-primary hover:text-primary-dark"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <Select
                placeholder="Todos los estados"
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
              <Select
                placeholder="Todas las categorías"
                options={categoryOptions}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>

            {/* View Toggle */}
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Vista</p>
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>

            {/* Legend — changes based on view mode */}
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              {viewMode === 'heatmap' ? (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Período
                  </p>
                  <div className="mb-3 grid grid-cols-2 gap-1">
                    {PERIOD_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setHeatPeriod(p.value)}
                        className={cn(
                          'rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                          heatPeriod === p.value
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-text-secondary hover:bg-gray-200 dark:bg-surface-dark-elevated dark:text-text-dark-secondary'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {heatLoading ? (
                    <div className="flex items-center justify-center gap-2 py-2 text-xs text-text-muted">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Cargando datos…
                    </div>
                  ) : (
                    <>
                      <div
                        className="h-3 w-full rounded-full"
                        style={{ background: 'linear-gradient(to right, #60a5fa, #34d399, #fbbf24, #ef4444)' }}
                      />
                      <div className="mt-1.5 flex justify-between text-[10px] text-text-muted">
                        <span>Baja densidad</span>
                        <span>Alta densidad</span>
                      </div>
                      <p className="mt-2 text-[10px] text-text-muted">
                        {apiHeatPoints ? `${apiHeatPoints.length} zonas` : `${heatPoints.length} puntos (locales)`}
                      </p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Leyenda</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-2">
                    {Object.entries(STATUS_MARKER_COLORS).map(([status, color]) => (
                      <div key={status} className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-3 w-3 rounded-full border-2 border-white shadow-sm"
                          style={{ background: color }}
                        />
                        <span className="text-xs capitalize text-text-secondary dark:text-text-dark-secondary">
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Denuncia list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-sm text-text-muted">
                  No hay denuncias con estos filtros.
                </div>
              ) : (
                filtered.map((d) => (
                  <div
                    key={d.id || d._id}
                    onClick={() => handleSelectComplaintFromList(d)}
                    className={cn(
                      'cursor-pointer border-b border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-surface-dark-elevated',
                      (selectedId === d.id || selectedId === d._id) && 'bg-primary-50/70 border-l-4 border-l-primary dark:bg-primary-900/20'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-primary-600">{d.id}</p>
                        <p className="mt-0.5 truncate text-sm font-medium text-text-primary dark:text-text-dark-primary">
                          {d.titulo}
                        </p>
                      </div>
                      <StatusBadge status={d.estado} size="sm" />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-text-muted">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{d.direccion}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/denuncias/${d.id}`)
                        }}
                        className="shrink-0 text-[11px] font-semibold text-primary hover:underline"
                      >
                        Ver detalle &rarr;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Map ──────────────────────────────────────────────────────────── */}
        <div ref={mapAreaRef} className="relative flex-1">
          <MapContainer
            center={CENTER}
            zoom={14}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {positions.length > 0 && <FitBounds positions={positions} />}

            <FocusController
              target={activeFlyTarget}
              onFocusHandled={(targetId) => setSelectedId(targetId)}
            />

            {/* Markers — only when in markers mode */}
            {viewMode === 'markers' && validComplaints.map((d) => (
              <Marker
                key={d.id || d._id}
                ref={(ref) => {
                  if (ref) {
                    if (d.id) markerRefs.current[d.id] = ref
                    if (d._id) markerRefs.current[d._id] = ref
                  }
                }}
                position={[d.latNum, d.lngNum]}
                icon={createColoredIcon(STATUS_MARKER_COLORS[d.estado] || '#6b7280')}
              >
                <Popup>
                  <div className="min-w-52 p-3.5">
                    <p className="font-mono text-[11px] font-medium text-gray-400">{d.id}</p>
                    <p className="mt-0.5 text-[13px] font-semibold leading-snug text-gray-900">{d.titulo}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{d.direccion}</span>
                    </div>
                    <div className="mt-2.5">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                        style={{ background: STATUS_MARKER_COLORS[d.estado] }}
                      >
                        {STATUS_LABELS[d.estado]}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/denuncias/${d.id}`)}
                      className="mt-3 w-full cursor-pointer rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                      Ver detalle
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Heatmap — only when in heatmap mode */}
            {viewMode === 'heatmap' && <HeatmapLayer points={heatPoints} />}
          </MapContainer>

          {/* Mobile panel */}
          <MobilePanel
            filtered={filtered}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            statusOptions={statusOptions}
            categoryOptions={categoryOptions}
            viewMode={viewMode}
            setViewMode={setViewMode}
            heatPeriod={heatPeriod}
            setHeatPeriod={setHeatPeriod}
            navigate={navigate}
          />
        </div>
      </div>
    </div>
  )
}

// ── MobilePanel ────────────────────────────────────────────────────────────────
function MobilePanel({
  filtered,
  statusFilter, setStatusFilter,
  categoryFilter, setCategoryFilter,
  statusOptions,
  categoryOptions,
  viewMode, setViewMode,
  heatPeriod, setHeatPeriod,
  navigate,
}) {
  const [expanded, setExpanded] = useState(false)
  const sheetRef = useRef(null)

  useEffect(() => {
    if (!sheetRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.to(sheetRef.current, {
      y: expanded ? 0 : '70%',
      duration: 0.3,
      ease: 'power2.out',
    })
  }, [expanded])

  return (
    <div
      ref={sheetRef}
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t border-gray-200 bg-surface-card shadow-modal md:hidden dark:border-gray-700 dark:bg-surface-dark-card"
      style={{ height: '62%', transform: 'translateY(70%)' }}
    >
      {/* Handle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center justify-center py-2"
        aria-label={expanded ? 'Cerrar panel' : 'Abrir panel'}
      >
        <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
      </button>

      {/* Summary bar */}
      <div className="flex items-center justify-between px-4 pb-2">
        <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">
          {filtered.length} denuncia{filtered.length !== 1 && 's'}
        </p>
        <ChevronUp
          className={cn(
            'h-4 w-4 text-text-muted transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mb-3 space-y-2">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          {viewMode === 'heatmap' ? (
            <div className="grid grid-cols-2 gap-1">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setHeatPeriod(p.value)}
                  className={cn(
                    'rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                    heatPeriod === p.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text-secondary dark:bg-surface-dark-elevated dark:text-text-dark-secondary'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          ) : (
            <>
              <Select
                placeholder="Todos los estados"
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
              <Select
                placeholder="Todas las categorías"
                options={categoryOptions}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </>
          )}
        </div>
        <div className="space-y-2">
          {filtered.map((d) => (
            <div
              key={d.id}
              onClick={() => navigate(`/denuncias/${d.id}`)}
              className="cursor-pointer rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-primary-600">{d.id}</p>
                  <p className="mt-0.5 text-sm font-medium text-text-primary dark:text-text-dark-primary">
                    {d.titulo}
                  </p>
                </div>
                <StatusBadge status={d.estado} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

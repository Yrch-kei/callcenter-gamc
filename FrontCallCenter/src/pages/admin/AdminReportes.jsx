import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { FileSpreadsheet, FileText, Loader2, RefreshCw, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'
import {
  MOCK_EFFICIENCY,
  MOCK_REPORT_BY_STATUS_FULL,
  MOCK_REPORT_BY_CATEGORY_FULL,
  MOCK_REPORT_BY_OFFICE,
  MOCK_REPORT_BY_RECEPTIONIST,
  MOCK_REPORT_BY_DISTRICT,
} from '@/services/mockData'

// ── Color palette ──────────────────────────────────────────────────────────────
const COLORS = [
  '#4ac1e0', '#ea537c', '#22c55e', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#f97316', '#6b7280',
  '#10b981', '#ef4444',
]

// ── Custom tooltip ──────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-surface-dark-card">
      {label && <p className="mb-1.5 text-xs font-semibold text-text-primary dark:text-text-dark-primary">{label}</p>}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color ?? entry.fill }} />
          <span className="text-text-secondary dark:text-text-dark-secondary">{entry.name ?? 'Total'}:</span>
          <span className="font-semibold text-text-primary dark:text-text-dark-primary">
            {entry.value} {entry.payload?.percentage != null ? `(${entry.payload.percentage}%)` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Export buttons (Excel + PDF) ────────────────────────────────────────────────
function ExportButtons({ type, exporting, onExport }) {
  const xlKey = `${type}_excel`
  const pdKey = `${type}_pdf`
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onExport(type, 'excel')}
        disabled={exporting[xlKey]}
        title="Exportar Excel"
        className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-900/20"
      >
        {exporting[xlKey]
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <FileSpreadsheet className="h-3 w-3" />}
        Excel
      </button>
      <button
        onClick={() => onExport(type, 'pdf')}
        disabled={exporting[pdKey]}
        title="Exportar PDF"
        className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-900/20"
      >
        {exporting[pdKey]
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <FileText className="h-3 w-3" />}
        PDF
      </button>
    </div>
  )
}

// ── ReportCard ──────────────────────────────────────────────────────────────────
function ReportCard({ title, subtitle, loading, error, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface-card dark:border-gray-700 dark:bg-surface-dark-card">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <p className="font-semibold text-text-primary dark:text-text-dark-primary">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Cargando…</span>
          </div>
        ) : error ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-danger">{error}</p>
          </div>
        ) : children}
      </div>
    </div>
  )
}

// ── Horizontal bar list (for simple ranked lists) ──────────────────────────────
function RankedList({ data }) {
  const max = data[0]?.count ?? 1
  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div key={item.name}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-sm text-text-primary dark:text-text-dark-primary">{item.name}</span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-text-secondary dark:text-text-dark-secondary">
              {item.count} <span className="font-normal text-text-muted">({item.percentage}%)</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-surface-dark-elevated">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.count / max) * 100}%`,
                background: COLORS[i % COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
      {data.length === 0 && (
        <p className="py-8 text-center text-sm text-text-muted">Sin datos para este período.</p>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminReportes() {
  const navigate   = useNavigate()
  const containerRef = useRef(null)
  const currentYear  = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  // Efficiency stats
  const [efficiency, setEfficiency] = useState({ loading: true, data: null })

  // Each report section has its own loading/error/data state
  const [byStatus,      setByStatus]      = useState({ loading: true, error: null, data: null })
  const [byCategory,    setByCategory]    = useState({ loading: true, error: null, data: null })
  const [byOffice,      setByOffice]      = useState({ loading: true, error: null, data: null })
  const [byReceptionist,setByReceptionist]= useState({ loading: true, error: null, data: null })
  const [byDistrict,    setByDistrict]    = useState({ loading: true, error: null, data: null })

  const load = async () => {
    setEfficiency({ loading: true, data: null })
    setByStatus((p)       => ({ ...p, loading: true, error: null }))
    setByCategory((p)     => ({ ...p, loading: true, error: null }))
    setByOffice((p)       => ({ ...p, loading: true, error: null }))
    setByReceptionist((p) => ({ ...p, loading: true, error: null }))
    setByDistrict((p)     => ({ ...p, loading: true, error: null }))

    await new Promise((r) => setTimeout(r, 400))

    setEfficiency({ loading: false, data: MOCK_EFFICIENCY })
    setByStatus(      { loading: false, error: null, data: MOCK_REPORT_BY_STATUS_FULL })
    setByCategory(    { loading: false, error: null, data: MOCK_REPORT_BY_CATEGORY_FULL })
    setByOffice(      { loading: false, error: null, data: MOCK_REPORT_BY_OFFICE })
    setByReceptionist({ loading: false, error: null, data: MOCK_REPORT_BY_RECEPTIONIST })
    setByDistrict(    { loading: false, error: null, data: MOCK_REPORT_BY_DISTRICT })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(containerRef.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' })
  }, [])

  const [exporting, setExporting] = useState({})

  const handleExport = async (type, format) => {
    toast('Exportación no disponible en modo demo', { icon: 'ℹ️' })
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div ref={containerRef} className="space-y-6">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm text-text-muted">
        <button onClick={() => navigate('/admin')} className="cursor-pointer transition-colors hover:text-primary">
          Administración
        </button>
        <span>/</span>
        <span className="font-medium text-text-primary dark:text-text-dark-primary">Reportes</span>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
            Reportes y Estadísticas
          </h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
            Análisis de denuncias del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => load()}
            className="cursor-pointer rounded-lg border border-gray-300 p-2 text-text-muted transition-colors hover:border-primary hover:text-primary dark:border-gray-600"
            title="Actualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Efficiency metrics ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Índice de resolución */}
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-surface-card p-4 dark:border-gray-700 dark:bg-surface-dark-card">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success-light dark:bg-success/10">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Índice de resolución</p>
            {efficiency.loading
              ? <div className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              : <p className="text-2xl font-bold tabular-nums text-success">
                  {efficiency.data?.resolutionIndex ?? '—'}<span className="text-sm font-normal">%</span>
                </p>
            }
          </div>
        </div>

        {/* Tiempo promedio de respuesta */}
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-surface-card p-4 dark:border-gray-700 dark:bg-surface-dark-card">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-700/20">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Tiempo promedio de respuesta</p>
            {efficiency.loading
              ? <div className="mt-1 h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              : <p className="text-2xl font-bold tabular-nums text-text-primary dark:text-text-dark-primary">
                  {efficiency.data?.averageResponseTimeSeconds
                    ? `${Math.round(efficiency.data.averageResponseTimeSeconds / 3600)}h`
                    : '—'}
                </p>
            }
          </div>
        </div>

        {/* Top categoría */}
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-surface-card p-4 dark:border-gray-700 dark:bg-surface-dark-card">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent/10">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-muted">Categoría más frecuente</p>
            {efficiency.loading
              ? <div className="mt-1 h-7 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              : <p className="truncate text-sm font-bold text-text-primary dark:text-text-dark-primary">
                  {efficiency.data?.topCategories?.[0]?.name ?? '—'}
                  {efficiency.data?.topCategories?.[0]?.count
                    ? <span className="ml-1 font-normal text-text-muted">({efficiency.data.topCategories[0].count})</span>
                    : null}
                </p>
            }
          </div>
        </div>
      </div>

      {/* ── Summary totals ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total denuncias',    value: byStatus.data?.total            ?? '—' },
          { label: 'Categorías activas', value: byCategory.data?.results?.length ?? '—' },
          { label: 'Áreas operativas',   value: byOffice.data?.results?.length  ?? '—' },
          { label: 'Distritos activos',  value: byDistrict.data?.results?.length ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-surface-card p-4 text-center dark:border-gray-700 dark:bg-surface-dark-card">
            <p className="text-3xl font-bold tabular-nums text-text-primary dark:text-text-dark-primary">{value}</p>
            <p className="mt-1 text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Row 1: Status (pie) + Category (bar) ────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* By status — pie */}
        <ReportCard
          title="Denuncias por estado"
          subtitle={`Distribución general — ${year}`}
          loading={byStatus.loading}
          error={byStatus.error}
        >
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs text-text-muted">
              Total: <strong>{byStatus.data?.total ?? 0}</strong>
            </span>
            <ExportButtons type="status" exporting={exporting} onExport={handleExport} />
          </div>
          {byStatus.data?.results?.length ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus.data.results}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {byStatus.data.results.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="py-8 text-center text-sm text-text-muted">Sin datos.</p>}
        </ReportCard>

        {/* By category — horizontal ranked list */}
        <ReportCard
          title="Denuncias por categoría"
          subtitle={`Top categorías — ${year}`}
          loading={byCategory.loading}
          error={byCategory.error}
        >
          <div className="flex justify-end pb-2">
            <ExportButtons type="category" exporting={exporting} onExport={handleExport} />
          </div>
          <div className="max-h-64 overflow-y-auto pr-1">
            <RankedList data={byCategory.data?.results ?? []} />
          </div>
        </ReportCard>

      </div>

      {/* ── Row 2: Office (bar) ──────────────────────────────────────────────── */}
      <ReportCard
        title="Denuncias por área operativa"
        subtitle={`Carga de trabajo por unidad — ${year}`}
        loading={byOffice.loading}
        error={byOffice.error}
      >
        <div className="flex justify-end pb-2">
          <ExportButtons type="office" exporting={exporting} onExport={handleExport} />
        </div>
        {byOffice.data?.results?.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byOffice.data.results}
                layout="vertical"
                barSize={16}
                margin={{ left: 8, right: 32, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" strokeOpacity={0.6} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  width={140}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(74,193,224,0.06)' }} />
                <Bar dataKey="count" name="Denuncias" radius={[0, 6, 6, 0]}>
                  {byOffice.data.results.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="py-8 text-center text-sm text-text-muted">Sin datos.</p>}
      </ReportCard>

      {/* ── Row 3: Receptionist + District ──────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        <ReportCard
          title="Denuncias por operador"
          subtitle={`Recepcionistas del call center — ${year}`}
          loading={byReceptionist.loading}
          error={byReceptionist.error}
        >
          <div className="flex justify-end pb-2">
            <ExportButtons type="receptionist" exporting={exporting} onExport={handleExport} />
          </div>
          <div className="max-h-64 overflow-y-auto pr-1">
            <RankedList data={byReceptionist.data?.results ?? []} />
          </div>
        </ReportCard>

        <ReportCard
          title="Denuncias por distrito"
          subtitle={`Distribución territorial — ${year}`}
          loading={byDistrict.loading}
          error={byDistrict.error}
        >
          <div className="flex justify-end pb-2">
            <ExportButtons type="district" exporting={exporting} onExport={handleExport} />
          </div>
          {byDistrict.data?.results?.length ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDistrict.data.results} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.6} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dx={-4} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(74,193,224,0.06)' }} />
                  <Bar dataKey="count" name="Denuncias" radius={[6, 6, 0, 0]}>
                    {byDistrict.data.results.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="py-8 text-center text-sm text-text-muted">Sin datos.</p>}
        </ReportCard>

      </div>

    </div>
  )
}

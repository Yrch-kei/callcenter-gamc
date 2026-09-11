import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Clock,
  RotateCw,
  CheckCircle2,
  FileText,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import gsap from 'gsap'
import { useAuth } from '@/context/AuthContext'
import { useDenuncias } from '@/context/DenunciasContext'
import { Card, CardHeader, CardTitle } from '@/components/ui'
import StatCard from '@/components/shared/StatCard'
import StatusBadge from '@/components/shared/StatusBadge'
import PriorityIndicator from '@/components/shared/PriorityIndicator'
import { MOCK_REPORT_BY_CATEGORY, MOCK_REPORT_BY_STATUS } from '@/services/mockData'
import dayjs from 'dayjs'

const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6', '#f97316', '#14b8a6']

const BAR_COLORS = {
  Pendiente: '#f59e0b',
  Derivada: '#8b5cf6',
  'En proceso': '#06b6d4',
  Resuelta: '#22c55e',
  Cancelada: '#ef4444',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const title = label ?? payload[0]?.name ?? payload[0]?.payload?.categoria ?? 'Detalle'
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-card-hover dark:border-gray-700 dark:bg-surface-dark-card">
      <p className="mb-1.5 text-xs font-semibold text-text-primary dark:text-text-dark-primary">{title}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-secondary dark:text-text-dark-secondary">{entry.name}:</span>
          <span className="font-semibold text-text-primary dark:text-text-dark-primary">
            {entry.value}
            {entry.payload?.percentage != null ? ` (${Number(entry.payload.percentage).toFixed(1)}%)` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { stats, denuncias, refetch } = useDenuncias()
  const statsRef = useRef(null)
  const contentRef = useRef(null)

  const [chartCategorias, setChartCategorias] = useState([])
  const [chartSemanal,    setChartSemanal]    = useState([])

  useEffect(() => {
    refetch()

    // Gráfica circular: por categoría
    setChartCategorias(
      MOCK_REPORT_BY_CATEGORY.results.map((r) => ({
        categoria:  r.name,
        cantidad:   r.count,
        percentage: r.percentage,
      }))
    )

    // Gráfica de barras: por estado
    setChartSemanal(
      MOCK_REPORT_BY_STATUS.results.map((r) => ({
        dia:        r.name,
        denuncias:  r.count,
        porcentaje: r.percentage,
      }))
    )
  }, [refetch])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const cards = statsRef.current?.children
    if (cards) {
      gsap.fromTo(cards,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' }
      )
    }

    if (contentRef.current) {
      gsap.fromTo(contentRef.current.children,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.25, stagger: 0.1, ease: 'power3.out' }
      )
    }
  }, [])

  const recientes = [...denuncias]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] px-6 py-6 shadow-lg lg:px-8 lg:py-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Resumen de actividad — {dayjs().format('dddd, D [de] MMMM')}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div ref={statsRef} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard title="Urgentes"   value={stats.urgentes}   icon={AlertTriangle} color="danger"  trend={12} />
        <StatCard title="Pendientes" value={stats.pendientes} icon={Clock}         color="warning"           />
        <StatCard title="En Proceso" value={stats.enProceso}  icon={RotateCw}      color="primary" trend={-5} />
        <StatCard title="Resueltas"  value={stats.resueltas}  icon={CheckCircle2}  color="success" trend={8}  />
      </div>

      {/* Charts */}
      <div ref={contentRef} className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Denuncias por estado — {new Date().getFullYear()}</CardTitle>
            <span className="text-xs text-text-muted">Total registradas</span>
          </CardHeader>
          <div className="h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartSemanal} barGap={6} barSize={window.innerWidth < 640 ? 18 : 28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.6} />
                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dx={-4} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(74, 193, 224, 0.06)' }} />
                <Bar dataKey="denuncias" name="Denuncias" radius={[6, 6, 0, 0]}>
                  {chartSemanal.map((entry, index) => (
                    <Cell key={index} fill={BAR_COLORS[entry.dia] || '#4ac1e0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Por categoría</CardTitle>
          </CardHeader>
          <div className="h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartCategorias}
                  cx="50%"
                  cy="42%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="cantidad"
                  nameKey="categoria"
                  paddingAngle={3}
                  stroke="none"
                >
                  {chartCategorias.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: '11px', lineHeight: '18px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent complaints */}
        <Card className="lg:col-span-3 overflow-hidden" padding={false}>
          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 pt-5 pb-4 dark:border-gray-700 dark:from-surface-dark-card dark:to-surface-dark-elevated lg:px-6 lg:pt-6">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-teal-600 shadow-sm">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  Denuncias recientes
                </span>
              </CardTitle>
              <button
                onClick={() => navigate('/denuncias')}
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-100 dark:bg-primary-700/15 dark:hover:bg-primary-700/25"
              >
                Ver todas <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </CardHeader>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-gray-100 dark:border-gray-700">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted lg:px-6">Código</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted lg:px-6">Título</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted lg:px-6">Categoría</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted lg:px-6">Prioridad</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted lg:px-6">Estado</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted lg:px-6">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/denuncias/${d.id}`)}
                    className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-primary-50/30 dark:border-gray-800 dark:hover:bg-primary-700/5"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-primary-600 lg:px-6">{d.id}</td>
                    <td className="px-5 py-3.5 font-medium text-text-primary lg:px-6 dark:text-text-dark-primary">{d.titulo}</td>
                    <td className="px-5 py-3.5 text-text-secondary lg:px-6 dark:text-text-dark-secondary">{d.categoria}</td>
                    <td className="px-5 py-3.5 lg:px-6"><PriorityIndicator priority={d.prioridad} /></td>
                    <td className="px-5 py-3.5 lg:px-6"><StatusBadge status={d.estado} size="sm" /></td>
                    <td className="px-5 py-3.5 tabular-nums text-text-muted lg:px-6">{dayjs(d.fecha).format('DD/MM/YY HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 md:hidden dark:divide-gray-800">
            {recientes.map((d) => (
              <div
                key={d.id}
                onClick={() => navigate(`/denuncias/${d.id}`)}
                className="cursor-pointer px-5 py-3.5 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-surface-dark-elevated"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-primary-600">{d.id}</p>
                    <p className="mt-0.5 text-sm font-medium text-text-primary dark:text-text-dark-primary">{d.titulo}</p>
                  </div>
                  <StatusBadge status={d.estado} size="sm" />
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                  <span>{d.categoria}</span>
                  <PriorityIndicator priority={d.prioridad} />
                  <span className="tabular-nums">{dayjs(d.fecha).format('DD/MM HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

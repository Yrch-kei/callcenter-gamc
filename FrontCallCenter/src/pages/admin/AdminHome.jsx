import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Tag, BarChart2, HardHat } from 'lucide-react'
import gsap from 'gsap'
import { useAuth } from '@/context/AuthContext'
import { useUsers } from '@/context/UsersContext'
import unitService from '@/services/unitService'
import catalogService from '@/services/catalogService'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'

const MODULES = [
  {
    icon:  Users,
    title: 'Gestión de Usuarios',
    desc:  'Crear, editar y asignar roles a operadores y personal de campo.',
    route: '/admin/usuarios',
    ready: true,
    color: 'bg-primary-100 dark:bg-primary-700/20',
    iconColor: 'text-primary',
  },
  {
    icon:  Tag,
    title: 'Áreas y Categorías',
    desc:  'Configuración de áreas operativas y tipos de denuncia.',
    route: '/admin/areas',
    ready: true,
    color: 'bg-accent-50 dark:bg-accent/10',
    iconColor: 'text-accent',
  },
  {
    icon:  BarChart2,
    title: 'Reportes Globales',
    desc:  'Estadísticas y exportación de datos del sistema.',
    route: '/admin/reportes',
    ready: true,
    color: 'bg-success-light dark:bg-success/10',
    iconColor: 'text-success',
  },
]

export default function AdminHome() {
  const navigate      = useNavigate()
  const { user }      = useAuth()
  const { users }     = useUsers()
  const containerRef  = useRef(null)

  const [totalAreas, setTotalAreas] = useState(0)
  const [totalCats,  setTotalCats]  = useState(0)

  useEffect(() => {
    unitService.getAll().then((u) => setTotalAreas(u.length)).catch(() => {})
    catalogService.getCategories().then((c) => setTotalCats(c.length)).catch(() => {})
  }, [])

  const activeUsers = users.filter((u) => u.active).length

  const STATS = [
    { label: 'Usuarios activos',  value: activeUsers               },
    { label: 'Total usuarios',    value: users.length              },
    { label: 'Áreas operativas',  value: totalAreas                },
    { label: 'Categorías',        value: totalCats                 },
  ]

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const els = containerRef.current?.querySelectorAll('[data-animate]')
    if (els?.length) {
      gsap.fromTo(els,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out' }
      )
    }
  }, [])

  return (
    <div ref={containerRef} className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div data-animate className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary">
            Panel de Administración
          </h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
            Bienvenido, <span className="font-semibold">{user?.name}</span> — gestiona los recursos del sistema.
          </p>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div data-animate className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map(({ label, value }) => (
          <Card key={label} className="p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-text-primary dark:text-text-dark-primary">
              {value}
            </p>
            <p className="mt-1 text-xs text-text-muted">{label}</p>
          </Card>
        ))}
      </div>

      {/* ── Modules ─────────────────────────────────────────────────────────── */}
      <div data-animate>
        <h2 className="mb-3 text-base font-semibold text-text-primary dark:text-text-dark-primary">
          Módulos disponibles
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map(({ icon: Icon, title, desc, route, color, iconColor }) => (
            <Card
              key={title}
              className="group relative flex cursor-pointer flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              onClick={() => navigate(route)}
            >
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
                <Icon className={cn('h-5 w-5', iconColor)} />
              </div>
              <div>
                <p className="font-semibold text-text-primary dark:text-text-dark-primary">{title}</p>
                <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">{desc}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(route) }}
                className="mt-auto cursor-pointer self-start rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-primary/90"
              >
                Acceder
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Quick info ──────────────────────────────────────────────────────── */}
      <div data-animate className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-text-muted dark:border-gray-700">
        <HardHat className="h-4 w-4 shrink-0" />
        Accede aquí a los módulos administrativos disponibles del sistema.
      </div>

    </div>
  )
}

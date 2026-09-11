import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  Map,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Tag,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/context/AuthContext'
import { ROLES } from '@/utils/constants'

const NAV_BY_ROLE = {
  [ROLES.OPERADOR]: [
    { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/denuncias',       icon: FileText,         label: 'Denuncias' },
    { to: '/denuncias/nueva', icon: FilePlus,         label: 'Nueva Denuncia' },
    { to: '/mapa',            icon: Map,              label: 'Mapa' },
  ],
  [ROLES.PERSONAL_CAMPO]: [
    { to: '/tecnico', icon: Smartphone,    label: 'Técnico Móvil' },
    { to: '/campo',   icon: ClipboardList, label: 'Mis Denuncias' },
  ],
  [ROLES.ADMINISTRADOR]: [
    { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard'       },
    { to: '/denuncias',      icon: FileText,         label: 'Denuncias'       },
    { to: '/denuncias/nueva', icon: FilePlus,         label: 'Nueva Denuncia' },
    { to: '/tecnico',        icon: Smartphone,       label: 'Técnico Móvil'   },
    { to: '/mapa',           icon: Map,              label: 'Mapa'            },
    { to: '/admin',          icon: Settings,         label: 'Administración', end: true },
    { to: '/admin/usuarios', icon: Users,            label: 'Usuarios',       sub: true },
    { to: '/admin/areas',    icon: Tag,              label: 'Áreas',          sub: true },
    { to: '/admin/reportes', icon: ClipboardList,    label: 'Reportes Globales', sub: true },
  ],
}

function NavItem({ to, icon: Icon, label, collapsed, end: endProp, sub }) {
  return (
    <NavLink
      to={to}
      end={endProp ?? to === '/denuncias'}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
          sub ? 'py-2 pl-8 pr-3' : 'px-3 py-2.5',
          isActive
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-700/20 dark:text-primary'
            : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary dark:text-text-dark-secondary dark:hover:bg-surface-dark-elevated dark:hover:text-text-dark-primary',
          collapsed && 'justify-center px-0 pl-0'
        )
      }
    >
      <Icon className={cn('shrink-0', sub ? 'h-4 w-4' : 'h-5 w-5')} />
      {!collapsed && <span className="truncate">{label}</span>}

      {/* Tooltip en modo colapsado */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-text-primary px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700">
          {label}
        </span>
      )}
    </NavLink>
  )
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth()
  const navItems = NAV_BY_ROLE[user?.role] ?? NAV_BY_ROLE[ROLES.OPERADOR]

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-30 hidden h-[calc(100dvh-4rem)] flex-col border-r border-gray-200 bg-surface-card transition-[width] duration-300 ease-out md:flex',
        'dark:border-gray-700 dark:bg-surface-dark-card',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} end={item.end} sub={item.sub} />
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="flex cursor-pointer items-center justify-center border-t border-gray-200 p-3 text-text-muted transition-colors hover:bg-gray-50 hover:text-text-primary dark:border-gray-700 dark:hover:bg-surface-dark-elevated dark:hover:text-text-dark-primary"
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}

export function BottomNav() {
  const { user } = useAuth()
  const navItems = (NAV_BY_ROLE[user?.role] ?? NAV_BY_ROLE[ROLES.OPERADOR]).filter((i) => !i.sub)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-gray-200 bg-surface-card px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-sm md:hidden dark:border-gray-700 dark:bg-surface-dark-card">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/denuncias'}
          className={({ isActive }) =>
            cn(
              'flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors',
              isActive
                ? 'text-primary-700 dark:text-primary'
                : 'text-text-muted hover:text-text-primary dark:hover:text-text-dark-primary'
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

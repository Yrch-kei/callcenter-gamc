import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, LogOut, User, ChevronDown } from 'lucide-react'
import gsap from 'gsap'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { ROLE_CONFIG } from '@/utils/constants'
import { cn } from '@/utils/cn'

export default function Topbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const dropdownRef = useRef(null)

  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : null

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!dropdownRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (menuOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { autoAlpha: 0, y: -8, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [menuOpen])

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])

  return (
    <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-surface-card px-4 backdrop-blur-sm lg:px-6 dark:border-gray-700 dark:bg-surface-dark-card">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white shadow-sm">
          DM
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold tracking-tight text-text-primary dark:text-text-dark-primary">
            Denuncias Municipales
          </h1>
          <p className="text-[11px] text-text-muted">Sistema de Gestión</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="cursor-pointer rounded-lg p-2.5 text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-text-dark-secondary dark:hover:bg-surface-dark-elevated"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>


        {/* Menú de usuario */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:hover:bg-surface-dark-elevated"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-200 to-primary-100 text-sm font-semibold text-primary-700">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden flex-col items-start md:flex">
              <span className="text-sm font-medium leading-tight text-text-primary dark:text-text-dark-primary">
                {user?.name}
              </span>
              {/* Badge de rol */}
              {roleConfig && (
                <span className={cn('rounded-full px-1.5 py-px text-[10px] font-semibold leading-tight', roleConfig.bg, roleConfig.color)}>
                  {roleConfig.label}
                </span>
              )}
            </div>
            <ChevronDown className={cn('hidden h-3.5 w-3.5 text-text-muted transition-transform duration-200 md:block', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-surface-card py-1 shadow-card-hover dark:border-gray-700 dark:bg-surface-dark-card"
            >
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">{user?.name}</p>
                <p className="mt-0.5 text-xs text-text-muted">{user?.email}</p>
                {roleConfig && (
                  <span className={cn('mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold', roleConfig.bg, roleConfig.color)}>
                    {roleConfig.label}
                  </span>
                )}
                {user?.area && (
                  <p className="mt-1 text-[11px] text-text-muted">Área: {user.area}</p>
                )}
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setMenuOpen(false); navigate('/perfil') }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-gray-50 hover:text-text-primary dark:text-text-dark-secondary dark:hover:bg-surface-dark-elevated dark:hover:text-text-dark-primary"
                >
                  <User className="h-4 w-4" />
                  Mi Perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger-light/50"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

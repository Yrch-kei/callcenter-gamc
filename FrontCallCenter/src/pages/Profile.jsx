import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Check } from 'lucide-react'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { ROLE_CONFIG } from '@/utils/constants'
import { cn } from '@/utils/cn'

import { authService } from '@/services/authService'

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatNewPassword, setRepeatNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const [saving, setSaving] = useState(false)

  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : null

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(containerRef.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' })
  }, [])

  // Password strength checks
  const checks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  }
  const allValid = Object.values(checks).every(Boolean)
  const passwordsMatch = newPassword === repeatNewPassword && repeatNewPassword.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allValid || !passwordsMatch) {
      toast.error('Revisa los requisitos de la contraseña')
      return
    }
    setSaving(true)
    try {
      await authService.changePassword(currentPassword, newPassword)
      toast.success('Contraseña actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setRepeatNewPassword('')
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Error al cambiar contraseña')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary'

  return (
    <div ref={containerRef} className="mx-auto max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
          Mi Perfil
        </h1>
        <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
          Información de tu cuenta y cambio de contraseña.
        </p>
      </div>

      {/* User info card */}
      <div className="rounded-xl border border-gray-200 bg-surface-card p-6 dark:border-gray-700 dark:bg-surface-dark-card">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-200 to-primary-100 text-lg font-bold text-primary-700">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">{user?.name}</p>
            <p className="text-sm text-text-muted">{user?.email}</p>
            {roleConfig && (
              <span className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold', roleConfig.bg, roleConfig.color)}>
                {roleConfig.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-gray-200 bg-surface-card p-6 dark:border-gray-700 dark:bg-surface-dark-card">
        <div className="mb-5 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">Cambiar Contraseña</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                required
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text-primary">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text-primary">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength indicators */}
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1">
                {[
                  [checks.length, '8 caracteres mínimo'],
                  [checks.upper, 'Una letra mayúscula'],
                  [checks.lower, 'Una letra minúscula'],
                  [checks.number, 'Un número'],
                ].map(([ok, text], i) => (
                  <p key={i} className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-success' : 'text-text-muted')}>
                    <Check className={cn('h-3 w-3', !ok && 'opacity-30')} />
                    {text}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Repeat new password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary dark:text-text-dark-secondary">
              Repetir nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showRepeat ? 'text' : 'password'}
                value={repeatNewPassword}
                onChange={(e) => setRepeatNewPassword(e.target.value)}
                className={inputClass}
                required
              />
              <button type="button" onClick={() => setShowRepeat(!showRepeat)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text-primary">
                {showRepeat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {repeatNewPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-danger">Las contraseñas no coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !allValid || !passwordsMatch || !currentPassword}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Guardando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

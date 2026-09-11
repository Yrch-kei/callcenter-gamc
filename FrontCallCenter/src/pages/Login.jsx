import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, Shield } from 'lucide-react'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { Button, Input } from '@/components/ui'
import api from '@/services/api'
import escudo from '@/assets/escudo-GAMC-vertical.png'

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida').min(6, 'Mínimo 6 caracteres'),
})

export default function Login() {
  const { login, loading, isAuthenticated, homeRoute } = useAuth()
  const navigate = useNavigate()
  const formRef = useRef(null)

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Redirige si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) navigate(homeRoute, { replace: true })
  }, [isAuthenticated, homeRoute, navigate])

  // Animación de entrada
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(formRef.current,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    )
  }, [])

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password)
    if (result.success) {
      navigate(result.homeRoute, { replace: true })
    } else {
      setError('root', { message: result.error })
    }
  }

  return (
    <div ref={formRef}>
      {/* Branding solo móvil */}
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <img src={escudo} alt="Escudo GAMC" className="h-11 w-auto" />
        <div>
          <span className="block text-lg font-bold text-text-primary dark:text-text-dark-primary">
            Denuncias Municipales
          </span>
          <span className="block text-[11px] text-text-muted uppercase tracking-wider">Gobierno Municipal</span>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-600 shadow-lg shadow-primary/20">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
          Iniciar Sesión
        </h2>
        <p className="mt-1.5 text-[15px] text-text-secondary dark:text-text-dark-secondary">
          Ingresa tus credenciales para acceder al sistema
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {errors.root && (
          <div
            className="flex items-center gap-2.5 rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm font-medium text-danger"
            role="alert"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/10 text-xs">!</span>
            {errors.root.message}
          </div>
        )}

        <Input
          label="Correo electrónico"
          type="email"
          placeholder="operador@municipio.gob"
          autoComplete="email"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          required
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-dark-secondary">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            Recordarme
          </label>
          <Link
            to="/forgot-password"
            className="cursor-pointer text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          <LogIn className="h-4 w-4" />
          Iniciar Sesión
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-muted">
        ¿Eres ciudadano?{' '}
        <a href="/seguimiento" className="font-medium text-primary hover:text-primary-dark">
          Consulta tu denuncia aquí
        </a>
      </p>

      {/* Modal de recuperación de contraseña */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-surface-dark-card">
            <h3 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">
              Recuperar Contraseña
            </h3>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
              Ingresa tu correo electrónico y te enviaremos una nueva contraseña temporal.
            </p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => { setShowForgot(false); setForgotEmail('') }}
                className="flex-1 cursor-pointer rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-surface-dark-elevated"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={forgotLoading || !forgotEmail.trim()}
                onClick={async () => {
                  setForgotLoading(true)
                  try {
                    const { data } = await api.post('/auth/forgot-password', { email: forgotEmail })
                    toast.success(data.message || 'Contraseña enviada a tu correo')
                    setShowForgot(false)
                    setForgotEmail('')
                  } catch (err) {
                    toast.error(err?.response?.data?.message || 'Error al recuperar contraseña')
                  } finally {
                    setForgotLoading(false)
                  }
                }}
                className="flex-1 cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {forgotLoading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

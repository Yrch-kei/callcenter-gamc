import { useState, useRef, useEffect } from 'react'
import { Search, ArrowLeft, Calendar, Tag, AlertCircle, FileSearch } from 'lucide-react'
import gsap from 'gsap'
import dayjs from 'dayjs'
import { Button, Card } from '@/components/ui'
import StatusBadge from '@/components/shared/StatusBadge'
import ProgressTracker from '@/components/shared/ProgressTracker'
import complaintService, { STATUS_BACKEND_TO_FRONT } from '@/services/complaintService'
import { cn } from '@/utils/cn'

export default function CitizenPortal() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const resultRef = useRef(null)
  const searchRef = useRef(null)

  // Entry animation
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!searchRef.current) return
    gsap.fromTo(searchRef.current,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    )
  }, [])

  // Result animation
  useEffect(() => {
    if (!searched || !resultRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.fromTo(resultRef.current.children,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }
    )
  }, [searched, result])

  const handleSearch = async (e) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()

    if (!trimmed) {
      setError('Ingresa un código de denuncia')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setSearched(false)

    try {
      const data = await complaintService.getPublicStatus(trimmed)
      // Normalizar a modelo frontend
      setResult({
        id:        data.code,
        titulo:    data.incident,
        estado:    STATUS_BACKEND_TO_FRONT[data.status] ?? 'pendiente',
        categoria: data.categoryName ?? '—',
        fecha:     data.registerDate,
      })
    } catch (err) {
      const status = err?.response?.status
      if (status === 404) {
        setError('No se encontró ninguna denuncia con ese código.')
      } else {
        setError('Error al consultar la denuncia. Intenta de nuevo.')
      }
    }

    setSearched(true)
    setLoading(false)
  }

  const handleReset = () => {
    setResult(null)
    setError('')
    setSearched(false)
    setCode('')
  }

  return (
    <div className="py-4">
      {/* Search section */}
      {!result && (
        <div ref={searchRef} className="mx-auto max-w-lg">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
              <FileSearch className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
              Consulta tu denuncia
            </h2>
            <p className="mt-2 text-sm text-text-secondary dark:text-text-dark-secondary">
              Ingresa el código único que recibiste al registrar tu denuncia para consultar su estado actual.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label
                htmlFor="codigo"
                className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-dark-primary"
              >
                Código de denuncia
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id="codigo"
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value)
                      if (error) setError('')
                    }}
                    placeholder="Ej: DEN-2026-001"
                    autoComplete="off"
                    className={cn(
                      'w-full rounded-lg border border-gray-300 bg-white py-3 pr-4 pl-10 text-sm text-text-primary placeholder-text-muted transition-colors',
                      'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                      'dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary',
                      error && 'border-danger focus:border-danger focus:ring-danger/20'
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  loading={loading}
                  className="shrink-0"
                >
                  Buscar
                </Button>
              </div>
              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-danger-light p-3" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <div>
                    <p className="text-sm font-medium text-danger">{error}</p>
                    <p className="mt-0.5 text-xs text-red-600/70">
                      Verifica que el código sea correcto e intenta de nuevo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>

          <div className="mt-6 rounded-lg bg-primary-50 p-4 dark:bg-primary-700/20">
            <p className="text-xs leading-relaxed text-text-secondary dark:text-text-dark-secondary">
              <strong className="text-text-primary dark:text-text-dark-primary">¿No tienes tu código?</strong>{' '}
              El código fue proporcionado al momento del registro de tu denuncia. Si lo perdiste, comunícate con la línea de atención municipal para recuperarlo.
            </p>
          </div>
        </div>
      )}

      {/* Result section */}
      {result && (
        <div ref={resultRef} className="mx-auto max-w-lg space-y-5">
          {/* Back + code header */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="cursor-pointer rounded-lg p-2 text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary dark:hover:bg-surface-dark-elevated"
              aria-label="Nueva consulta"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs text-text-muted">Seguimiento de denuncia</p>
              <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">
                {result.id}
              </h2>
            </div>
          </div>

          {/* General info card */}
          <Card>
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">
                {result.titulo}
              </h3>
              <StatusBadge status={result.estado} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoItem icon={Tag} label="Categoría" value={result.categoria} />
              <InfoItem
                icon={Calendar}
                label="Fecha de registro"
                value={dayjs(result.fecha).format('DD/MM/YYYY')}
              />
            </div>
          </Card>

          {/* Progress tracker */}
          <Card>
            <h3 className="mb-5 text-sm font-semibold text-text-primary dark:text-text-dark-primary">
              Progreso de tu denuncia
            </h3>
            <ProgressTracker status={result.estado} />
          </Card>

          {/* Help text */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center dark:border-gray-700 dark:bg-surface-dark-card">
            <p className="text-sm text-text-muted">
              ¿Tienes dudas sobre tu denuncia? Contacta la línea de atención municipal.
            </p>
            <button
              onClick={handleReset}
              className="mt-3 cursor-pointer text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
            >
              Consultar otra denuncia
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ icon: Icon, label, value, className }) {
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">{value}</p>
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import gsap from 'gsap'
import { cn } from '@/utils/cn'

const STEPS = [
  { key: 'registrada', label: 'Registrada' },
  { key: 'revision', label: 'En Revisión' },
  { key: 'proceso', label: 'En Proceso' },
  { key: 'finalizada', label: 'Finalizada' },
]

// Maps denuncia status to step index
const STATUS_TO_STEP = {
  pendiente: 0,
  en_proceso: 2,
  resuelta: 3,
  rechazada: -1,
}

export default function ProgressTracker({ status }) {
  const stepsRef = useRef(null)
  const activeStep = STATUS_TO_STEP[status] ?? 0
  const isRejected = status === 'rechazada'

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!stepsRef.current) return

    const nodes = stepsRef.current.querySelectorAll('[data-step]')
    gsap.fromTo(nodes,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
    )
  }, [status])

  if (isRejected) {
    return (
      <div className="rounded-xl border border-danger-light bg-danger-light/50 p-4 text-center">
        <p className="text-sm font-semibold text-danger">Denuncia rechazada</p>
        <p className="mt-1 text-xs text-red-600/70">
          Esta denuncia fue revisada y no procede. Puedes comunicarte con la municipalidad para más información.
        </p>
      </div>
    )
  }

  return (
    <div ref={stepsRef} className="w-full">
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-start justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < activeStep
          const isCurrent = index === activeStep
          const isPending = index > activeStep

          return (
            <div key={step.key} data-step className="flex flex-1 flex-col items-center relative">
              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className="absolute top-4 left-1/2 w-full h-0.5"
                  style={{ zIndex: 0 }}
                >
                  <div
                    className={cn(
                      'h-full transition-colors duration-300',
                      isCompleted ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                </div>
              )}

              {/* Circle */}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300',
                  isCompleted && 'border-primary bg-primary text-white',
                  isCurrent && 'border-primary bg-primary-50 text-primary-700 dark:bg-primary-700/20 dark:text-primary-light',
                  isPending && 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-surface-dark-card'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <p
                className={cn(
                  'mt-2 text-center text-xs font-medium',
                  isCompleted && 'text-primary-700 dark:text-primary-light',
                  isCurrent && 'text-primary-700 font-semibold dark:text-primary-light',
                  isPending && 'text-text-muted'
                )}
              >
                {step.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="flex flex-col gap-0 sm:hidden">
        {STEPS.map((step, index) => {
          const isCompleted = index < activeStep
          const isCurrent = index === activeStep
          const isPending = index > activeStep

          return (
            <div key={step.key} data-step className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted && 'border-primary bg-primary text-white',
                    isCurrent && 'border-primary bg-primary-50 text-primary-700',
                    isPending && 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-surface-dark-card'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-8 w-0.5',
                      isCompleted ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}
              </div>
              <div className="pt-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    (isCompleted || isCurrent) && 'text-text-primary dark:text-text-dark-primary',
                    isPending && 'text-text-muted'
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

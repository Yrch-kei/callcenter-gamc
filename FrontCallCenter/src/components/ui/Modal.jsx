import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import gsap from 'gsap'

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  className,
}) {
  const overlayRef = useRef(null)
  const panelRef = useRef(null)

  const animateIn = useCallback(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    gsap.fromTo(
      overlayRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.2, ease: 'power2.out' }
    )
    gsap.fromTo(
      panelRef.current,
      { autoAlpha: 0, scale: 0.95, y: 10 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }
    )
  }, [])

  const animateOut = useCallback(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      onClose()
      return
    }

    gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.15 })
    gsap.to(panelRef.current, {
      autoAlpha: 0,
      scale: 0.95,
      duration: 0.15,
      onComplete: onClose,
    })
  }, [onClose])

  useEffect(() => {
    if (open) {
      animateIn()
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, animateIn])

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') animateOut()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, animateOut])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50"
        onClick={animateOut}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full rounded-2xl bg-surface-card p-6 shadow-modal',
          'dark:bg-surface-dark-card',
          sizes[size],
          className
        )}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">
              {title}
            </h2>
            <button
              onClick={animateOut}
              className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-surface-dark-elevated"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import gsap from 'gsap'
import { cn } from '@/utils/cn'

const colorMap = {
  primary: {
    bg: 'bg-primary-50 dark:bg-primary-700/15',
    icon: 'text-primary-600 dark:text-primary',
    value: 'text-primary-700 dark:text-primary',
    border: 'from-cyan-400 to-blue-500',
  },
  accent: {
    bg: 'bg-accent-50 dark:bg-accent-700/15',
    icon: 'text-accent-600 dark:text-accent',
    value: 'text-accent-700 dark:text-accent',
    border: 'from-purple-400 to-pink-500',
  },
  success: {
    bg: 'bg-success-light dark:bg-green-700/15',
    icon: 'text-green-600 dark:text-green-400',
    value: 'text-green-700 dark:text-green-400',
    border: 'from-emerald-400 to-green-500',
  },
  warning: {
    bg: 'bg-warning-light dark:bg-amber-700/15',
    icon: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-400',
    border: 'from-amber-400 to-orange-500',
  },
  danger: {
    bg: 'bg-danger-light dark:bg-red-700/15',
    icon: 'text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-400',
    border: 'from-red-400 to-rose-500',
  },
}

export default function StatCard({ title, value, icon: Icon, color = 'primary', trend, className }) {
  const valueRef = useRef(null)
  const colors = colorMap[color] || colorMap.primary

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const obj = { val: 0 }
    gsap.to(obj, {
      val: value,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        if (valueRef.current) {
          valueRef.current.textContent = Math.round(obj.val).toLocaleString()
        }
      },
    })
  }, [value])

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-gray-200 bg-surface-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        'dark:border-gray-700 dark:bg-surface-dark-card',
        className
      )}
    >
      {/* Top gradient border */}
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', colors.border)} />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-text-secondary dark:text-text-dark-secondary">
            {title}
          </p>
          <p ref={valueRef} className={cn('text-3xl font-bold tracking-tight tabular-nums', colors.value)}>
            {value}
          </p>
          {trend !== undefined && trend !== null && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
            )}>
              {trend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>{Math.abs(trend)}% vs semana anterior</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('rounded-xl p-2.5 transition-transform duration-200 group-hover:scale-105', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.icon)} />
          </div>
        )}
      </div>
    </div>
  )
}

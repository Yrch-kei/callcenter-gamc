import { cn } from '@/utils/cn'

export default function Card({ children, className, hoverable = false, padding = true, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-surface-card shadow-card',
        'dark:border-gray-700 dark:bg-surface-dark-card',
        padding && 'p-5 lg:p-6',
        hoverable && 'cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-card-hover dark:hover:border-gray-600',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-base font-semibold text-text-primary lg:text-lg dark:text-text-dark-primary', className)}>
      {children}
    </h3>
  )
}

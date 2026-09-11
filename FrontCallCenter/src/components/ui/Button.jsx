import { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:
    'bg-primary text-white hover:bg-primary-dark active:bg-primary-700 focus-visible:ring-primary',
  accent:
    'bg-accent text-white hover:bg-accent-dark active:bg-accent-700 focus-visible:ring-accent',
  outline:
    'border border-gray-300 bg-white text-text-primary hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-primary dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary dark:hover:bg-surface-dark-elevated',
  ghost:
    'text-text-secondary hover:bg-gray-100 hover:text-text-primary active:bg-gray-200 focus-visible:ring-primary dark:text-text-dark-secondary dark:hover:bg-surface-dark-elevated',
  danger:
    'bg-danger text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-danger',
}

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    children,
    className,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})

export default Button

import { cn } from '@/utils/cn'

const colorMap = {
  primary: 'bg-primary-100 text-primary-700',
  accent: 'bg-accent-100 text-accent-700',
  success: 'bg-success-light text-green-700',
  warning: 'bg-warning-light text-amber-700',
  danger: 'bg-danger-light text-red-700',
  info: 'bg-primary-100 text-primary-700',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
}

export default function Badge({
  children,
  color = 'primary',
  size = 'md',
  dot = false,
  className,
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        colorMap[color],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-primary-600': color === 'primary' || color === 'info',
            'bg-accent-600': color === 'accent',
            'bg-green-600': color === 'success',
            'bg-amber-600': color === 'warning',
            'bg-red-600': color === 'danger',
            'bg-gray-500': color === 'gray',
          })}
        />
      )}
      {children}
    </span>
  )
}

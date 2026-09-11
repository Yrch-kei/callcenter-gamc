import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const Input = forwardRef(function Input(
  { label, error, helper, type = 'text', className, id, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-dark-primary"
        >
          {label}
          {props.required && <span className="ml-0.5 text-accent">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={cn(
          'block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors duration-150',
          'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60',
          'dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary dark:placeholder-text-dark-secondary dark:focus:border-primary',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-text-muted">
          {helper}
        </p>
      )}
    </div>
  )
})

export default Input

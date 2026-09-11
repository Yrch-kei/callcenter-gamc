import { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(function Select(
  { label, error, helper, options = [], placeholder, className, id, ...props },
  ref
) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-dark-primary"
        >
          {label}
          {props.required && <span className="ml-0.5 text-accent">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'block w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pr-10 pl-3.5 text-sm text-text-primary transition-colors duration-150',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60',
            'dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary dark:focus:border-primary',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const value = typeof opt === 'string' ? opt : opt.value
            const optLabel = typeof opt === 'string' ? opt : opt.label
            return (
              <option key={value} value={value}>
                {optLabel}
              </option>
            )
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="mt-1.5 text-sm text-text-muted">{helper}</p>
      )}
    </div>
  )
})

export default Select

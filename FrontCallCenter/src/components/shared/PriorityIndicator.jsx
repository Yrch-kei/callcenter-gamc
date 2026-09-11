import { PRIORITY_CONFIG } from '@/utils/constants'
import { cn } from '@/utils/cn'

export default function PriorityIndicator({ priority }) {
  const config = PRIORITY_CONFIG[priority]
  if (!config) return null

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', config.color)}>
      {priority === 'urgente' && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
        </span>
      )}
      {config.label}
    </span>
  )
}

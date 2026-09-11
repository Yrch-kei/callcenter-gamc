import { Badge } from '@/components/ui'
import { STATUS_CONFIG } from '@/utils/constants'

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status]
  if (!config) return null

  const colorMap = {
    warning: 'warning',
    info: 'info',
    success: 'success',
    danger: 'danger',
  }

  return (
    <Badge color={colorMap[config.color] || 'gray'} size={size} dot>
      {config.label}
    </Badge>
  )
}

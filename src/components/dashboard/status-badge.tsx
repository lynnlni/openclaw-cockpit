import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusType = 'online' | 'offline' | 'not-deployed'

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusConfig: Record<StatusType, { label: string; dotClass: string; badgeClass: string }> = {
  online: {
    label: '在线',
    dotClass: 'bg-emerald-500',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  },
  offline: {
    label: '离线',
    dotClass: 'bg-red-500',
    badgeClass: 'border-red-500/30 text-red-400 bg-red-500/10',
  },
  'not-deployed': {
    label: '未部署',
    dotClass: 'bg-zinc-500',
    badgeClass: 'border-zinc-500/30 text-zinc-400 bg-zinc-500/10',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={cn(config.badgeClass, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </Badge>
  )
}

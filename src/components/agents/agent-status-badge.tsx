import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AgentRunStatus } from '@/hooks/use-agent-status'

const statusConfig: Record<AgentRunStatus, { label: string; dotClass: string; badgeClass: string }> = {
  running: {
    label: '运行中',
    dotClass: 'bg-emerald-500',
    badgeClass: 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400',
  },
  stopped: {
    label: '已停止',
    dotClass: 'bg-zinc-400',
    badgeClass: 'border-zinc-300/50 text-zinc-500 bg-zinc-100 dark:border-zinc-700/50 dark:text-zinc-400 dark:bg-zinc-800/40',
  },
  unknown: {
    label: '未知',
    dotClass: 'bg-zinc-300',
    badgeClass: 'border-zinc-200/50 text-zinc-400 bg-zinc-50 dark:border-zinc-700/30 dark:text-zinc-500 dark:bg-zinc-800/20',
  },
}

export function AgentStatusBadge({
  status,
  className,
}: {
  status: AgentRunStatus
  className?: string
}) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </Badge>
  )
}

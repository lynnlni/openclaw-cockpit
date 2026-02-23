'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Play, Square, RotateCw, Loader2 } from 'lucide-react'

interface ServiceControlsProps {
  machineId: string
  running: boolean
  onStatusChange: () => void
}

type Action = 'start' | 'stop' | 'restart'

const actionConfig: Record<Action, { label: string; icon: typeof Play; variant: 'default' | 'destructive' | 'outline' }> = {
  start: { label: '启动', icon: Play, variant: 'default' },
  stop: { label: '停止', icon: Square, variant: 'destructive' },
  restart: { label: '重启', icon: RotateCw, variant: 'outline' },
}

export function ServiceControls({ machineId, running, onStatusChange }: ServiceControlsProps) {
  const [pending, setPending] = useState<Action | null>(null)

  const executeAction = useCallback(
    async (action: Action) => {
      setPending(action)
      try {
        const res = await fetch(`/api/deploy/${machineId}/service`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        if (res.ok) {
          onStatusChange()
        }
      } catch {
        // handled by caller
      } finally {
        setPending(null)
      }
    },
    [machineId, onStatusChange]
  )

  const availableActions: Action[] = running
    ? ['restart', 'stop']
    : ['start']

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          running ? 'bg-emerald-500' : 'bg-zinc-500',
        )}
      />
      <span className="text-sm text-muted-foreground">
        {running ? '运行中' : '已停止'}
      </span>
      <div className="ml-2 flex gap-1">
        {availableActions.map((action) => {
          const config = actionConfig[action]
          const Icon = config.icon
          const isLoading = pending === action
          return (
            <Button
              key={action}
              variant={config.variant}
              size="sm"
              disabled={pending !== null}
              onClick={() => executeAction(action)}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {config.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

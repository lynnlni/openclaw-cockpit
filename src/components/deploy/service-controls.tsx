'use client'

import { useState, useCallback } from 'react'
import { Loader2, Play, RotateCw, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ServiceControlsProps {
  machineId: string
  running: boolean
  onStatusChange: () => Promise<unknown> | void
  compact?: boolean
  showStartWhenStopped?: boolean
  forceRestartStop?: boolean
  disableRestart?: boolean
  disableStop?: boolean
}

type Action = 'start' | 'stop' | 'restart'

export function ServiceControls({
  machineId,
  running,
  onStatusChange,
  compact = false,
  showStartWhenStopped = true,
  forceRestartStop = false,
  disableRestart = false,
  disableStop = false,
}: ServiceControlsProps) {
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
        if (res.ok) await onStatusChange()
      } catch {
        // handled by caller
      } finally {
        setPending(null)
      }
    },
    [machineId, onStatusChange]
  )

  const iconClassName = 'h-3.5 w-3.5'
  const buttonClassName = compact
    ? 'h-8 w-8 rounded-full border p-0'
    : 'h-7 w-7 rounded-full border p-0'

  const iconFor = (action: Action) => {
    if (pending === action) {
      return <Loader2 className={cn(iconClassName, 'animate-spin')} />
    }

    switch (action) {
      case 'start':
        return <Play className={iconClassName} />
      case 'stop':
        return <Square className={iconClassName} />
      case 'restart':
        return <RotateCw className={iconClassName} />
    }
  }

  const renderAction = (
    action: Action,
    className: string,
    tooltip: string,
    disabledByProp = false
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={pending !== null || disabledByProp}
          onClick={() => executeAction(action)}
          className={cn(
            buttonClassName,
            className,
            'transition-colors',
            disabledByProp && 'opacity-45 cursor-not-allowed'
          )}
        >
          {iconFor(action)}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )

  const showRestartStop = forceRestartStop || running

  return (
    <div className={cn('flex items-center gap-1.5', compact && 'gap-2')}>
      {showRestartStop ? (
        <>
          {renderAction(
            'restart',
            'border-zinc-700/70 bg-zinc-900/30 text-muted-foreground hover:bg-zinc-800/70 hover:text-foreground',
            disableRestart ? '重启（不可用）' : '重启',
            disableRestart
          )}
          {renderAction(
            'stop',
            'border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15 hover:text-rose-200',
            disableStop ? '停止（不可用）' : '停止',
            disableStop
          )}
        </>
      ) : (
        showStartWhenStopped &&
        renderAction(
          'start',
          'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 hover:text-emerald-200',
          '启动'
        )
      )}
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Play, Square, RotateCw, Loader2 } from 'lucide-react'

interface ServiceControlsProps {
  machineId: string
  running: boolean
  onStatusChange: () => void
}

type Action = 'start' | 'stop' | 'restart'

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
        if (res.ok) onStatusChange()
      } catch {
        // handled by caller
      } finally {
        setPending(null)
      }
    },
    [machineId, onStatusChange]
  )

  const isLoading = (action: Action) =>
    pending === action ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null

  return (
    <div className="flex items-center gap-0.5">
      {running ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                disabled={pending !== null}
                onClick={() => executeAction('restart')}
              >
                {isLoading('restart') ?? <RotateCw className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>重启</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                disabled={pending !== null}
                onClick={() => executeAction('stop')}
              >
                {isLoading('stop') ?? <Square className="h-3.5 w-3.5 text-destructive" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>停止</p></TooltipContent>
          </Tooltip>
        </>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={pending !== null}
              onClick={() => executeAction('start')}
            >
              {isLoading('start') ?? <Play className="h-3.5 w-3.5 text-emerald-400" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>启动</p></TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

'use client'

import type { Machine, MachineStatus } from '@/lib/machines/types'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { cn } from '@/lib/utils'
import { Server } from 'lucide-react'

interface MachineCardProps {
  machine: Machine
  status?: MachineStatus
  statusLoading?: boolean
}

function deriveStatusType(status?: MachineStatus) {
  if (!status) return 'offline' as const
  if (!status.openclawInstalled) return 'not-deployed' as const
  return status.online ? ('online' as const) : ('offline' as const)
}

export function MachineCard({ machine, status, statusLoading }: MachineCardProps) {
  const statusType = deriveStatusType(status)

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md',
              statusType === 'online' ? 'bg-emerald-500/10' : 'bg-muted',
            )}
          >
            <Server className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">{machine.name}</h3>
            <p className="text-xs text-muted-foreground">{machine.host}:{machine.port}</p>
          </div>
        </div>
        {statusLoading ? (
          <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
        ) : (
          <StatusBadge status={statusType} />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {status?.openclawVersion && (
            <span>v{status.openclawVersion}</span>
          )}
          {status?.openclawRunning && (
            <span className="text-emerald-400">运行中</span>
          )}
        </div>
        <QuickActions machineId={machine.id} />
      </div>
    </div>
  )
}

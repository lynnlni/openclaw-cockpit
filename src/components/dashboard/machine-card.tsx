'use client'

import type { Machine, MachineStatus } from '@/lib/machines/types'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { cn } from '@/lib/utils'
import { Server, Wifi } from 'lucide-react'

interface MachineCardProps {
  machine: Machine
  status?: MachineStatus
  statusLoading?: boolean
  statusRefreshing?: boolean
  onRefreshStatus?: () => Promise<MachineStatus | undefined>
}

function deriveStatusType(status?: MachineStatus) {
  if (!status) return 'offline' as const
  if (!status.openclawInstalled) return 'not-deployed' as const
  return status.online ? ('online' as const) : ('offline' as const)
}

function formatPushTime(isoStr?: string): string {
  if (!isoStr) return '从未推送'
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) return isoStr
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MachineCard({ machine, status, statusLoading, statusRefreshing, onRefreshStatus }: MachineCardProps) {
  const isPush = machine.connectionType === 'push'
  const statusType = deriveStatusType(status)

  if (isPush) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-sky-500/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-500/10">
              <Wifi className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">{machine.name}</h3>
              <p className="text-xs text-sky-400/70">推送接入</p>
            </div>
          </div>
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-400">
            推送
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>最近推送：{formatPushTime(machine.lastPushAt)}</span>
            {machine.lastPushVersion && (
              <span className="text-muted-foreground/70">v{machine.lastPushVersion}</span>
            )}
          </div>
          <QuickActions machine={machine} onRefreshStatus={onRefreshStatus} statusRefreshing={statusRefreshing} />
        </div>
      </div>
    )
  }

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
        <QuickActions machine={machine} onRefreshStatus={onRefreshStatus} statusRefreshing={statusRefreshing} />
      </div>
    </div>
  )
}

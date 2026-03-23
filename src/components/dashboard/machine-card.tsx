'use client'

import { useCallback, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import type { Machine, MachineStatus } from '@/lib/machines/types'
import type { VersionInfo } from '@/lib/deploy/types'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ServiceControls } from '@/components/deploy/service-controls'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { fetcher } from '@/hooks/fetcher'
import { cn } from '@/lib/utils'
import { ArrowUp, Download, Loader2, Server, Wifi } from 'lucide-react'

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
  if (Number.isNaN(date.getTime())) return isoStr
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMaskedHost(host: string): string {
  const parts = host.split('.')
  const isIpv4 = parts.length === 4 && parts.every((part) => /^\d+$/.test(part))

  if (!isIpv4) return host

  return `${parts[0]}.${parts[1]}.*.*`
}

function formatLobsterVersion(version?: string): string {
  if (!version) return '—'
  return `🦞${version.replace(/^OpenClaw\s+/, '')}`
}

function VersionUpdateTag({ versionData }: { versionData?: VersionInfo }) {
  if (!versionData?.latest) return null

  return (
    <HoverCard openDelay={250}>
      <HoverCardTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
            versionData.updateAvailable
              ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
              : 'border-zinc-700/70 bg-zinc-900/40 text-muted-foreground/60'
          )}
        >
          {versionData.updateAvailable ? '可更新' : '已最新'}
        </span>
      </HoverCardTrigger>
      {versionData.updateAvailable && (
        <HoverCardContent side="top" align="start" className="w-[320px] p-0">
          <div className="space-y-2 px-3 py-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground">更新检测</span>
              <span className="text-muted-foreground/70">{formatLobsterVersion(versionData.latest)}</span>
            </div>
            <p className="text-muted-foreground">发现新版本，可直接在卡片中更新。</p>
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  )
}

export function MachineCard({ machine, status, statusLoading, statusRefreshing, onRefreshStatus }: MachineCardProps) {
  const statusType = deriveStatusType(status)
  const isInstalled = Boolean(status?.openclawInstalled)
  const shouldCheckVersion = machine.connectionType === 'ssh' && isInstalled
  const [pendingAction, setPendingAction] = useState<'install' | 'upgrade' | null>(null)

  const {
    data: versionData,
    mutate: refreshVersion,
  } = useSWR<VersionInfo>(
    shouldCheckVersion ? `/api/deploy/${machine.id}/upgrade` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const handleInstall = useCallback(async () => {
    setPendingAction('install')
    try {
      const res = await fetch(`/api/deploy/${machine.id}/install`, { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.success) {
        throw new Error(body.error ?? '安装失败')
      }
      await onRefreshStatus?.()
      toast.success('安装已完成')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '安装失败')
    } finally {
      setPendingAction(null)
    }
  }, [machine.id, onRefreshStatus])

  const handleUpgrade = useCallback(async () => {
    setPendingAction('upgrade')
    try {
      const res = await fetch(`/api/deploy/${machine.id}/upgrade`, { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.success) {
        throw new Error(body.error ?? '更新失败')
      }
      await Promise.all([onRefreshStatus?.(), refreshVersion()])
      toast.success('更新已完成')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败')
    } finally {
      setPendingAction(null)
    }
  }, [machine.id, onRefreshStatus, refreshVersion])

  if (machine.connectionType === 'push') {
    return (
      <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-sky-500/30">
        <div className="flex items-start justify-between gap-3">
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
              <span className="text-muted-foreground/70">{formatLobsterVersion(machine.lastPushVersion)}</span>
            )}
          </div>
          <QuickActions machine={machine} onRefreshStatus={onRefreshStatus} statusRefreshing={statusRefreshing} />
        </div>
      </div>
    )
  }

  const updateAvailable = Boolean(versionData?.updateAvailable)
  const actionBusy = pendingAction !== null

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md',
              statusType === 'online' ? 'bg-emerald-500/10' : 'bg-muted'
            )}
          >
            <Server className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">{machine.name}</h3>
            <p className="text-xs text-muted-foreground">
              {formatMaskedHost(machine.host)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusLoading ? (
            <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
          ) : (
            <StatusBadge status={statusType} />
          )}
          <QuickActions machine={machine} onRefreshStatus={onRefreshStatus} statusRefreshing={statusRefreshing} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">版本</span>
          <span className="min-w-0 font-mono text-foreground">
            {status?.openclawVersion ? formatLobsterVersion(status.openclawVersion) : '—'}
          </span>
          <VersionUpdateTag versionData={versionData} />
        </div>

        <div className="flex items-center gap-2">
          {isInstalled ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-8 w-8 rounded-full border border-amber-500/25 bg-amber-500/10 p-0 text-amber-300 hover:bg-amber-500/15 hover:text-amber-200"
                  disabled={actionBusy || !updateAvailable}
                  onClick={handleUpgrade}
                >
                  {pendingAction === 'upgrade' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{updateAvailable ? '更新' : '已最新'}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-8 w-8 rounded-full border border-emerald-500/25 bg-emerald-500/10 p-0 text-emerald-300 hover:bg-emerald-500/15 hover:text-emerald-200"
                  disabled={actionBusy}
                  onClick={handleInstall}
                >
                  {pendingAction === 'install' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>安装</p>
              </TooltipContent>
            </Tooltip>
          )}

          <ServiceControls
            machineId={machine.id}
            running={status?.openclawRunning ?? false}
            onStatusChange={async () => {
              await onRefreshStatus?.()
            }}
            compact
            showStartWhenStopped={false}
            forceRestartStop
            disableRestart={!isInstalled}
            disableStop={!isInstalled}
          />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { useMachine } from '@/store/machine-context'
import { useMachines } from '@/hooks/use-machines'
import { useMachineStatus } from '@/hooks/use-machine-status'
import { useDeployLog } from '@/hooks/use-deploy-log'
import { DeployWizard } from '@/components/deploy/deploy-wizard'
import { DeployLogViewer } from '@/components/deploy/deploy-log-viewer'
import { ServiceControls } from '@/components/deploy/service-controls'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'
import { ArrowUp, ArrowUpRight, ChevronRight, Loader2, RefreshCw, Server, Wifi } from 'lucide-react'
import type { VersionInfo } from '@/lib/deploy/types'

interface VersionNotes {
  version: string
  name: string
  notes: string
  publishedAt: string
  url: string
  matched: boolean
}

function jsonFetcher<T>(url: string): Promise<T> {
  return fetch(url).then((r) => r.json()).then((b) => b.data as T)
}

export default function DeployPage() {
  const { selectedMachineId } = useMachine()
  const { data: machines } = useMachines()
  const { data: status, isLoading: statusLoading, mutate: refreshStatus } = useMachineStatus(selectedMachineId ?? undefined)
  const { data: logData } = useDeployLog(selectedMachineId ?? undefined)

  const isInstalled = status?.openclawInstalled ?? false

  // Version check — fires once on mount when installed; manual revalidation via mutate
  const {
    data: versionData,
    isLoading: checkingVersion,
    isValidating: revalidatingVersion,
    mutate: refreshVersion,
  } = useSWR<VersionInfo>(
    isInstalled && selectedMachineId
      ? `/api/deploy/${selectedMachineId}/upgrade`
      : null,
    jsonFetcher<VersionInfo>,
    { revalidateOnFocus: false }
  )

  // Release notes — fetched from GitHub, only when update is available
  const { data: notesData, isLoading: loadingNotes } = useSWR<VersionNotes>(
    versionData?.updateAvailable && versionData.latest
      ? `/api/deploy/version-notes?version=${versionData.latest}`
      : null,
    jsonFetcher<VersionNotes>,
    { revalidateOnFocus: false }
  )

  const [showWizard, setShowWizard] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  const selectedMachine = machines?.find((m) => m.id === selectedMachineId)

  const handleUpgrade = useCallback(async () => {
    if (!selectedMachineId) return
    setUpgrading(true)
    try {
      await fetch(`/api/deploy/${selectedMachineId}/upgrade`, { method: 'POST' })
      await Promise.all([refreshStatus(), refreshVersion()])
    } catch {
      // handled by UI
    } finally {
      setUpgrading(false)
    }
  }, [selectedMachineId, refreshStatus, refreshVersion])

  const handleWizardComplete = useCallback(() => {
    setShowWizard(false)
    refreshStatus()
  }, [refreshStatus])

  const handleStatusChange = useCallback(() => {
    refreshStatus()
  }, [refreshStatus])

  if (!selectedMachineId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Server className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">请先在侧边栏选择一台机器</p>
      </div>
    )
  }

  if (statusLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner text="检查部署状态..." />
      </div>
    )
  }

  if (selectedMachine?.connectionType === 'push') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Wifi className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm font-medium text-foreground">推送接入机器</p>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          此机器通过推送接入，OpenClaw 运行在远程设备上，无需通过 Dashboard 部署或管理服务。
          <br />
          如需安装或更新，请在远程设备上运行 Skill 脚本。
        </p>
      </div>
    )
  }

  if (!isInstalled || showWizard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">部署管理</h1>
          <p className="text-sm text-muted-foreground">安装和配置 OpenClaw</p>
        </div>
        <DeployWizard
          machineId={selectedMachineId}
          onComplete={handleWizardComplete}
        />
      </div>
    )
  }

  const versionSpinning = checkingVersion || revalidatingVersion

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">部署管理</h1>
        <p className="text-sm text-muted-foreground">管理 OpenClaw 服务</p>
      </div>

      {/* Compact info card */}
      <div className="rounded-lg border border-border bg-card divide-y divide-border">

        {/* Version row */}
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-muted-foreground">版本</span>
            <span className="font-mono text-foreground">
              {status?.openclawVersion ? `v${status.openclawVersion}` : '—'}
            </span>
            {versionData?.latest && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                <span className={cn(
                  'font-mono',
                  versionData.updateAvailable ? 'text-amber-400' : 'text-muted-foreground/50'
                )}>
                  v{versionData.latest}
                </span>
                {versionData?.updateAvailable && (
                  <HoverCard openDelay={300}>
                    <HoverCardTrigger asChild>
                      <span className="cursor-default rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-400">
                        可更新
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent side="top" align="start" className="w-[640px]">
                      <VersionNotesCard
                        notes={notesData}
                        loading={loadingNotes}
                        latestVersion={versionData.latest}
                      />
                    </HoverCardContent>
                  </HoverCard>
                )}
              </>
            )}
            {versionSpinning && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={versionSpinning}
                  onClick={() => refreshVersion()}
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', versionSpinning && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>检查更新</p></TooltipContent>
            </Tooltip>
            {versionData?.updateAvailable && (
              <Button
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleUpgrade}
                disabled={upgrading}
              >
                <ArrowUp className="h-3 w-3" />
                {upgrading ? '升级中…' : '升级'}
              </Button>
            )}
          </div>
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-muted-foreground">状态</span>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                'h-1.5 w-1.5 rounded-full',
                status?.openclawRunning ? 'bg-emerald-500' : 'bg-zinc-500'
              )} />
              <span className="text-foreground">
                {status?.openclawRunning ? '运行中' : '已停止'}
              </span>
            </div>
          </div>
          <ServiceControls
            machineId={selectedMachineId}
            running={status?.openclawRunning ?? false}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Environment row */}
        {status?.nodeVersion && (
          <div className="flex items-center px-4 py-3 text-sm">
            <span className="w-14 shrink-0 text-muted-foreground">环境</span>
            <span className="font-mono text-muted-foreground/70">
              Node {status.nodeVersion}
            </span>
          </div>
        )}
      </div>

      {/* Re-install link */}
      <div className="text-right">
        <button
          type="button"
          onClick={() => setShowWizard(true)}
          className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          重新安装
        </button>
      </div>

      {/* Logs */}
      {logData?.logs && logData.logs.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">运行日志</h3>
          <DeployLogViewer logs={logData.logs} />
        </div>
      )}
    </div>
  )
}

// ─── Version notes hover card ────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// If the body contains a Chinese-language section (header in Chinese or ≥30% CJK chars),
// extract and return it; otherwise return the original body unchanged.
function extractDisplayContent(body: string): { content: string; isChinese: boolean } {
  // Look for a Chinese-labeled top-level section
  const lines = body.split('\n')
  const zhHeaderIdx = lines.findIndex((l) =>
    /^#{1,3}\s*(中文|变更日志|更新说明|中文版|Chinese|ZH[-_]CN)/i.test(l)
  )
  if (zhHeaderIdx >= 0) {
    const nextSection = lines.findIndex(
      (l, i) => i > zhHeaderIdx && /^#{1,3}\s/.test(l)
    )
    const section =
      nextSection > 0
        ? lines.slice(zhHeaderIdx, nextSection)
        : lines.slice(zhHeaderIdx)
    return { content: section.join('\n'), isChinese: true }
  }

  // If the body itself is predominantly Chinese (>30% CJK)
  const cjk = (body.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? []).length
  const total = body.replace(/\s/g, '').length
  if (total > 0 && cjk / total > 0.3) {
    return { content: body, isChinese: true }
  }

  return { content: body, isChinese: false }
}

function renderNotes(raw: string): React.ReactNode[] {
  return raw.split('\n').map((line, i) => {
    const trimmed = line.trimEnd()
    if (/^#{1,3}\s/.test(trimmed)) {
      return (
        <p key={i} className="font-semibold text-foreground mt-3 first:mt-0">
          {trimmed.replace(/^#{1,3}\s/, '')}
        </p>
      )
    }
    if (/^[-*]\s/.test(trimmed)) {
      return (
        <p key={i} className="flex gap-1.5 text-muted-foreground">
          <span className="shrink-0 text-muted-foreground/40 select-none">•</span>
          <span>{trimmed.replace(/^[-*]\s/, '')}</span>
        </p>
      )
    }
    if (trimmed === '') return <div key={i} className="h-1.5" />
    return <p key={i} className="text-muted-foreground">{trimmed}</p>
  })
}

function VersionNotesCard({
  notes,
  loading,
  latestVersion,
}: {
  notes: VersionNotes | undefined
  loading: boolean
  latestVersion: string | null
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        加载更新说明…
      </div>
    )
  }

  if (!notes) {
    return (
      <div className="px-4 py-4 text-xs text-muted-foreground">
        暂无更新说明
      </div>
    )
  }

  const { content, isChinese } = extractDisplayContent(notes.notes)

  return (
    <div className="text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{notes.name || `v${latestVersion}`}</span>
          <span className="text-muted-foreground/50">{formatDate(notes.publishedAt)}</span>
          {!isChinese && notes.notes && (
            <span className="text-[10px] text-muted-foreground/40">EN</span>
          )}
        </div>
        <a
          href={notes.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 text-muted-foreground/50 hover:text-foreground transition-colors"
          title="在 GitHub 查看"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
      {/* Body */}
      <div className="max-h-[500px] overflow-y-auto px-4 py-3 space-y-0.5 leading-[1.6]">
        {content ? renderNotes(content) : (
          <p className="text-muted-foreground/50">暂无详细说明</p>
        )}
      </div>
    </div>
  )
}

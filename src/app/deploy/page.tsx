'use client'

import { useState, useCallback } from 'react'
import { useMachine } from '@/store/machine-context'
import { useMachineStatus } from '@/hooks/use-machine-status'
import { useDeployLog } from '@/hooks/use-deploy-log'
import { DeployWizard } from '@/components/deploy/deploy-wizard'
import { DeployLogViewer } from '@/components/deploy/deploy-log-viewer'
import { VersionInfoDisplay } from '@/components/deploy/version-info'
import { ServiceControls } from '@/components/deploy/service-controls'
import { InitConfigForm } from '@/components/deploy/init-config-form'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Rocket, Server } from 'lucide-react'
import type { VersionInfo } from '@/lib/deploy/types'

export default function DeployPage() {
  const { selectedMachineId } = useMachine()
  const { data: status, isLoading: statusLoading, mutate: refreshStatus } = useMachineStatus(selectedMachineId ?? undefined)
  const { data: logData } = useDeployLog(selectedMachineId ?? undefined)
  const [showWizard, setShowWizard] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  const handleUpgrade = useCallback(async () => {
    if (!selectedMachineId) return
    setUpgrading(true)
    try {
      await fetch(`/api/deploy/${selectedMachineId}/upgrade`, { method: 'POST' })
      await refreshStatus()
    } catch {
      // handled by UI
    } finally {
      setUpgrading(false)
    }
  }, [selectedMachineId, refreshStatus])

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

  const isInstalled = status?.openclawInstalled ?? false

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

  const versionInfo: VersionInfo = {
    current: status?.openclawVersion ?? null,
    latest: null,
    updateAvailable: false,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">部署管理</h1>
        <p className="text-sm text-muted-foreground">管理 OpenClaw 服务</p>
      </div>

      <VersionInfoDisplay
        versionInfo={versionInfo}
        onUpgrade={handleUpgrade}
        upgrading={upgrading}
      />

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">服务控制</h3>
        <ServiceControls
          machineId={selectedMachineId}
          running={status?.openclawRunning ?? false}
          onStatusChange={handleStatusChange}
        />
      </div>

      {logData?.logs && logData.logs.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">运行日志</h3>
          <DeployLogViewer logs={logData.logs} />
        </div>
      )}
    </div>
  )
}

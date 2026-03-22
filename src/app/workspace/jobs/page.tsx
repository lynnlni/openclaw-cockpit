'use client'

import { Server } from 'lucide-react'

import { useMachine } from '@/store/machine-context'
import { FileEditorPanel } from '@/components/shared/file-editor-panel'
import { SSH_REMOTE_ACCESS_ENABLED } from '@/lib/ssh/feature'

export default function JobsPage() {
  const { selectedMachineId } = useMachine()

  if (!SSH_REMOTE_ACCESS_ENABLED) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Server className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">SSH 远程访问已暂时关闭</p>
      </div>
    )
  }

  if (!selectedMachineId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Server className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">请先在侧边栏选择一台机器</p>
      </div>
    )
  }

  return (
    <div className="-m-6" style={{ height: 'calc(100% + 48px)' }}>
      <FileEditorPanel machineId={selectedMachineId} filePath="cron/jobs.json" />
    </div>
  )
}

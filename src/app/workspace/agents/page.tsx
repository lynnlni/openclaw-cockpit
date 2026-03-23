'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Server } from 'lucide-react'

import { useMachine } from '@/store/machine-context'
import { FileEditorPanel } from '@/components/shared/file-editor-panel'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { SSH_REMOTE_ACCESS_ENABLED } from '@/lib/ssh/feature'

const MAIN_AGENT_FILE = 'workspace/AGENTS.md'

function AgentsContent({ machineId }: { machineId: string }) {
  const searchParams = useSearchParams()
  const filePath = searchParams.get('file') ?? MAIN_AGENT_FILE

  return (
    <div className="-m-6" style={{ height: 'calc(100% + 48px)' }}>
      <FileEditorPanel key={filePath} machineId={machineId} filePath={filePath} />
    </div>
  )
}

export default function AgentsPage() {
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
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner text="加载中..." />
      </div>
    }>
      <AgentsContent machineId={selectedMachineId} />
    </Suspense>
  )
}

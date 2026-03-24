'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Server, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { useMachine } from '@/store/machine-context'
import { FileEditorPanel } from '@/components/shared/file-editor-panel'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { SSH_REMOTE_ACCESS_ENABLED } from '@/lib/ssh/feature'
import { cn } from '@/lib/utils'

const MAIN_AGENT_FILE = 'workspace/AGENTS.md'

const AGENT_FILES = ['IDENTITY.md', 'SOUL.md']

function AgentsContent({ machineId }: { machineId: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const filePath = searchParams.get('file') ?? MAIN_AGENT_FILE
  const workspace = searchParams.get('workspace')

  const fromAgentsList = !!workspace

  return (
    <div className="-m-6 flex flex-col" style={{ height: 'calc(100% + 48px)' }}>
      {fromAgentsList && (
        <div className="flex items-center gap-3 border-b border-border px-4 py-2 shrink-0 bg-card">
          <Link
            href="/agents"
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回代理列表
          </Link>
          <span className="text-muted-foreground/30">|</span>
          <div className="flex items-center gap-1">
            {AGENT_FILES.map((fname) => {
              const href = `/workspace/agents?workspace=${encodeURIComponent(workspace)}&file=${encodeURIComponent(workspace + '/' + fname)}`
              const isActive = filePath === workspace + '/' + fname
              return (
                <Link
                  key={fname}
                  href={href}
                  className={cn(
                    'rounded px-2.5 py-1 text-[12px] transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  {fname}
                </Link>
              )
            })}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <FileEditorPanel key={filePath} machineId={machineId} filePath={filePath} />
      </div>
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

import { Bot, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { AgentStatusBadge } from './agent-status-badge'
import type { AgentConfig } from '@/lib/config/types'
import type { AgentSummary } from '@/hooks/use-agents-summary'

type AgentRunStatus = AgentSummary['status']

interface AgentCardProps {
  agent: AgentConfig
  identityLine?: string
  soulLine?: string
  identityLoading?: boolean
  soulLoading?: boolean
  status: AgentRunStatus
  statusLoading?: boolean
}

function Skeleton({ className }: { className?: string }) {
  return <span className={cn('inline-block animate-pulse rounded bg-muted', className)} />
}

function InfoRow({
  label,
  value,
  loading,
  mono,
}: {
  label: string
  value?: string
  loading?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2 text-[12px]">
      <span className="w-14 shrink-0 text-muted-foreground/60">{label}</span>
      {loading ? (
        <Skeleton className="h-3.5 w-32 mt-0.5" />
      ) : (
        <span className={cn('min-w-0 truncate text-foreground/80', mono && 'font-mono')}>
          {value || '—'}
        </span>
      )}
    </div>
  )
}

export function AgentCard({
  agent,
  identityLine,
  soulLine,
  identityLoading,
  soulLoading,
  status,
  statusLoading,
}: AgentCardProps) {
  const workspace = agent.workspace ?? agent.agentDir
  const fileHref = workspace
    ? `/workspace/agents?workspace=${encodeURIComponent(workspace)}&file=${encodeURIComponent(workspace + '/IDENTITY.md')}`
    : '/workspace/agents'

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-semibold text-foreground">
              {agent.name ?? agent.id ?? '未命名'}
            </h3>
            {agent.id && (
              <p className="font-mono text-[11px] text-muted-foreground/60">{agent.id}</p>
            )}
          </div>
        </div>
        {statusLoading ? (
          <Skeleton className="h-5 w-14 rounded-full" />
        ) : (
          <AgentStatusBadge status={status} />
        )}
      </div>

      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
        <InfoRow label="身份" value={identityLine} loading={identityLoading} />
        <InfoRow label="性格" value={soulLine} loading={soulLoading} />
        {workspace && (
          <div className="flex items-start gap-2 text-[12px]">
            <span className="w-14 shrink-0 text-muted-foreground/60">路径</span>
            <span className="min-w-0 truncate font-mono text-[11px] text-muted-foreground/50">
              {workspace}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end border-t border-border pt-3">
        <Link
          href={fileHref}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          查看文件
        </Link>
      </div>
    </div>
  )
}

'use client'

import { Bot, Server } from 'lucide-react'

import { useMachine } from '@/store/machine-context'
import { useConfig } from '@/hooks/use-config'
import { useAgentsSummary } from '@/hooks/use-agents-summary'
import { AgentCard } from '@/components/agents/agent-card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { SSH_REMOTE_ACCESS_ENABLED } from '@/lib/ssh/feature'
import type { AgentConfig } from '@/lib/config/types'
import type { AgentSummary } from '@/hooks/use-agents-summary'

function AgentCardWithData({
  agent,
  summary,
  summaryLoading,
}: {
  agent: AgentConfig
  summary?: AgentSummary
  summaryLoading: boolean
}) {
  return (
    <AgentCard
      agent={agent}
      identityLine={summary?.identityLine || undefined}
      soulLine={summary?.soulLine || undefined}
      identityLoading={summaryLoading}
      soulLoading={summaryLoading}
      status={summary?.status ?? 'unknown'}
      statusLoading={summaryLoading}
    />
  )
}

export default function AgentsPage() {
  const { selectedMachineId } = useMachine()
  const { data: config, isLoading } = useConfig(selectedMachineId ?? undefined)

  const agents = (config?.agents?.list ?? []).filter((a) => a.id !== 'main')
  const { data: summaries, isLoading: summaryLoading } = useAgentsSummary(
    selectedMachineId ?? undefined,
    agents,
  )

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner text="加载中..." />
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Bot className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">暂无子代理配置</p>
        <p className="text-xs text-muted-foreground/60">在核心配置中添加 agents.list 后刷新</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">代理列表</h1>
        <p className="text-sm text-muted-foreground">共 {agents.length} 个子代理</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCardWithData
            key={agent.id ?? agent.name}
            agent={agent}
            summary={agent.id ? summaries[agent.id] : undefined}
            summaryLoading={summaryLoading}
          />
        ))}
      </div>
    </div>
  )
}

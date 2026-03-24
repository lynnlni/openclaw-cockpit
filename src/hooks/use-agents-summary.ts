'use client'

import useSWR from 'swr'
import type { AgentConfig } from '@/lib/config/types'
import type { AgentSummary } from '@/app/api/instances/[machineId]/agents-summary/route'

export type { AgentSummary }

async function fetchAgentsSummary(
  machineId: string,
  agents: Array<{ id: string; workspace?: string }>,
): Promise<Record<string, AgentSummary>> {
  const res = await fetch(`/api/instances/${machineId}/agents-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agents }),
  })
  if (!res.ok) return {}
  const body = await res.json().catch(() => null)
  return (body?.data ?? {}) as Record<string, AgentSummary>
}

export function useAgentsSummary(
  machineId: string | undefined,
  agents: AgentConfig[],
) {
  const agentInputs = agents
    .filter((a) => a.id)
    .map((a) => ({ id: a.id!, workspace: a.workspace ?? a.agentDir }))

  const key =
    machineId && agentInputs.length > 0
      ? `agents-summary:${machineId}:${agentInputs.map((a) => a.id).join(',')}`
      : null

  const { data, isLoading } = useSWR<Record<string, AgentSummary>>(
    key,
    () => fetchAgentsSummary(machineId!, agentInputs),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  return { data: data ?? {}, isLoading }
}

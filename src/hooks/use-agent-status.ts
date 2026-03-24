'use client'

import useSWR from 'swr'

export type AgentRunStatus = 'running' | 'stopped' | 'unknown'

const SAFE_ID = /^[a-zA-Z0-9_-]+$/

async function fetchAgentStatus(
  machineId: string,
  agentId: string,
): Promise<AgentRunStatus> {
  if (!SAFE_ID.test(agentId)) return 'unknown'
  try {
    const res = await fetch(`/api/machines/${machineId}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: `pgrep -f 'openclaw.*${agentId}' > /dev/null 2>&1 && echo running || echo stopped`,
      }),
    })
    if (!res.ok) return 'unknown'
    const body = await res.json().catch(() => null)
    if (!body?.success) return 'unknown'
    const stdout: string = body.data?.stdout ?? ''
    return stdout.trim() === 'running' ? 'running' : 'stopped'
  } catch {
    return 'unknown'
  }
}

export function useAgentStatus(
  machineId: string | undefined,
  agentId: string | undefined,
) {
  const key = machineId && agentId ? `exec:${machineId}:agent:${agentId}` : null

  const { data, isLoading } = useSWR<AgentRunStatus>(
    key,
    () => fetchAgentStatus(machineId!, agentId!),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  return { status: data ?? 'unknown' as AgentRunStatus, isLoading }
}

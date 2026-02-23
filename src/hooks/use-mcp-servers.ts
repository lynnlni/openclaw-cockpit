'use client'

import useSWR from 'swr'
import type { MCPServerConfig } from '@/lib/config/types'
import { fetcher } from './fetcher'

export function useMcpServers(machineId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<
    Record<string, MCPServerConfig>
  >(machineId ? `/api/instances/${machineId}/mcp` : null, fetcher)

  return { data, error, isLoading, mutate }
}

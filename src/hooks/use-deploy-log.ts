'use client'

import useSWR from 'swr'
import { useState, useCallback } from 'react'
import { fetcher } from './fetcher'

interface DeployLogResponse {
  logs: string[]
  isRunning: boolean
}

const POLL_INTERVAL_MS = 2_000

export function useDeployLog(
  machineId: string | undefined,
  action?: string
) {
  const [polling, setPolling] = useState(false)

  const params = action ? `?action=${encodeURIComponent(action)}` : ''
  const key =
    machineId && polling
      ? `/api/deploy/${machineId}/logs${params}`
      : null

  const { data, error, isLoading, mutate } = useSWR<DeployLogResponse>(
    key,
    fetcher,
    {
      refreshInterval: polling ? POLL_INTERVAL_MS : 0,
      revalidateOnFocus: false,
    }
  )

  const startPolling = useCallback(() => setPolling(true), [])
  const stopPolling = useCallback(() => setPolling(false), [])

  return {
    data,
    error,
    isLoading,
    mutate,
    polling,
    startPolling,
    stopPolling,
  }
}

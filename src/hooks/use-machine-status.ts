'use client'

import useSWR from 'swr'
import type { MachineStatus } from '@/lib/machines/types'
import { fetcher } from './fetcher'

const REFRESH_INTERVAL_MS = 30_000

export function useMachineStatus(machineId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<MachineStatus>(
    machineId ? `/api/machines/${machineId}/status` : null,
    fetcher,
    { refreshInterval: REFRESH_INTERVAL_MS }
  )

  return { data, error, isLoading, mutate }
}

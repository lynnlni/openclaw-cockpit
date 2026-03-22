'use client'

import useSWR from 'swr'
import type { AnalyticsData } from '@/lib/analytics/types'
import { fetcher } from './fetcher'

const REFRESH_INTERVAL_MS = 30_000

export function useAnalytics(machineId: string | undefined, windowMinutes = 180) {
  const url = machineId
    ? `/api/instances/${machineId}/analytics?window=${windowMinutes}`
    : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<AnalyticsData>(
    url,
    fetcher,
    { refreshInterval: REFRESH_INTERVAL_MS }
  )

  return { data, error, isLoading, isValidating, mutate }
}

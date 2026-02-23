'use client'

import useSWR from 'swr'
import type { DiscoveredSkill } from '@/lib/skills/types'
import { fetcher } from './fetcher'

export function useSkillDiscovery(machineId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<DiscoveredSkill[]>(
    '/api/skills/discover',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
    }
  )

  return { data, error, isLoading, mutate }
}

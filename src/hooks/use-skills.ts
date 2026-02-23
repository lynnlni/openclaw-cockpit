'use client'

import useSWR from 'swr'
import type { InstalledSkill } from '@/lib/skills/types'
import { fetcher } from './fetcher'

export function useSkills(machineId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<InstalledSkill[]>(
    machineId ? `/api/instances/${machineId}/skills` : null,
    fetcher
  )

  return { data, error, isLoading, mutate }
}

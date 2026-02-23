'use client'

import useSWR from 'swr'
import type { SkillRepo } from '@/lib/skills/types'
import { fetcher } from './fetcher'

export function useSkillRepos(machineId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<SkillRepo[]>(
    '/api/skills/repos',
    fetcher
  )

  return { data, error, isLoading, mutate }
}

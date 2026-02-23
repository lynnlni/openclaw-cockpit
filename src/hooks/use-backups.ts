'use client'

import useSWR from 'swr'
import type { BackupSnapshot } from '@/lib/backup/types'
import { fetcher } from './fetcher'

export function useBackups(machineId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<BackupSnapshot[]>(
    machineId ? `/api/backups/${machineId}/snapshots` : null,
    fetcher
  )

  return { data, error, isLoading, mutate }
}

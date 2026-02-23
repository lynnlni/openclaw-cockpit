'use client'

import useSWR from 'swr'
import type { FileEntry } from '@/lib/ssh/types'
import { fetcher } from './fetcher'

export function useWorkspaceFiles(
  machineId: string | undefined,
  path?: string
) {
  const params = path ? `?path=${encodeURIComponent(path)}` : ''
  const key = machineId
    ? `/api/instances/${machineId}/files${params}`
    : null

  const { data, error, isLoading, mutate } = useSWR<FileEntry[]>(key, fetcher)

  return { data, error, isLoading, mutate }
}

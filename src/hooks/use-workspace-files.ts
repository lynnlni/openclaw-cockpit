'use client'

import useSWR from 'swr'
import type { FileEntry } from '@/lib/ssh/types'
import { fetcher } from './fetcher'

export function useWorkspaceFiles(
  machineId: string | undefined,
  path?: string,
  recursive?: boolean,
  exclude?: string[]
) {
  const qs = new URLSearchParams()
  if (path) qs.set('path', path)
  if (recursive) qs.set('recursive', 'true')
  if (exclude?.length) qs.set('exclude', exclude.join(','))
  const queryStr = qs.toString() ? `?${qs.toString()}` : ''
  const key = machineId
    ? `/api/instances/${machineId}/files${queryStr}`
    : null

  const { data, error, isLoading, mutate } = useSWR<FileEntry[]>(key, fetcher, {
    revalidateOnFocus: false,
  })

  return { data, error, isLoading, mutate }
}

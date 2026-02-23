'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { fetcher } from './fetcher'

interface FileContentResponse {
  path: string
  content: string
}

function buildFileUrl(machineId: string, filePath: string): string {
  const segments = filePath.split('/').filter(Boolean)
  return `/api/instances/${machineId}/files/${segments.map(encodeURIComponent).join('/')}`
}

export function useFileContent(
  machineId: string | undefined,
  filePath: string | undefined
) {
  const key =
    machineId && filePath
      ? buildFileUrl(machineId, filePath)
      : null

  const { data, error, isLoading, mutate } = useSWR<FileContentResponse>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  )

  return { data, error, isLoading, mutate }
}

async function saveFileFetcher(
  url: string,
  { arg }: { arg: { content: string } }
) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Failed to save file')
  }
  const body = await res.json()
  return body.data
}

export function useSaveFile(
  machineId: string | undefined,
  filePath: string | undefined
) {
  const key =
    machineId && filePath
      ? buildFileUrl(machineId, filePath)
      : null

  const { trigger, isMutating, error } = useSWRMutation<
    FileContentResponse,
    Error,
    string | null,
    { content: string }
  >(key, saveFileFetcher)

  return { trigger, isMutating, error }
}

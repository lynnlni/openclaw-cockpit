'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type { Machine } from '@/lib/machines/types'
import { fetcher } from './fetcher'

export function useMachines() {
  const { data, error, isLoading, mutate } = useSWR<Machine[]>(
    '/api/machines',
    fetcher
  )

  return { data, error, isLoading, mutate }
}

async function createMachineFetcher(
  url: string,
  { arg }: { arg: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'> }
) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  if (!res.ok) throw new Error('Failed to create machine')
  const body = await res.json()
  return body.data
}

export function useCreateMachine() {
  const { trigger, isMutating, error } = useSWRMutation<
    Machine,
    Error,
    string,
    Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>
  >('/api/machines', createMachineFetcher)

  return { trigger, isMutating, error }
}

async function deleteMachineFetcher(
  url: string,
  { arg }: { arg: { id: string } }
) {
  const res = await fetch(`${url}/${arg.id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete machine')
  const body = await res.json()
  return body.data
}

export function useDeleteMachine() {
  const { trigger, isMutating, error } = useSWRMutation<
    void,
    Error,
    string,
    { id: string }
  >('/api/machines', deleteMachineFetcher)

  return { trigger, isMutating, error }
}

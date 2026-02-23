'use client'

import useSWR from 'swr'
import type {
  OpenClawConfig,
  ProviderConfig,
  ChannelConfig,
} from '@/lib/config/types'
import { fetcher } from './fetcher'

export function useConfig(machineId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<OpenClawConfig>(
    machineId ? `/api/instances/${machineId}/config` : null,
    fetcher
  )

  return { data, error, isLoading, mutate }
}

export function useProviders(machineId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<
    Record<string, ProviderConfig>
  >(machineId ? `/api/instances/${machineId}/config/providers` : null, fetcher)

  return { data, error, isLoading, mutate }
}

export function useChannels(machineId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<ChannelConfig[]>(
    machineId ? `/api/instances/${machineId}/config/channels` : null,
    fetcher
  )

  return { data, error, isLoading, mutate }
}

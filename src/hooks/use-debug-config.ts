import useSWR from 'swr'
import type { DebugConfigState } from '@/app/api/instances/[machineId]/analytics/debug-config/route'

async function fetcher(url: string): Promise<DebugConfigState> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json() as { data: DebugConfigState }
  return json.data
}

export function useDebugConfig(machineId?: string) {
  const url = machineId
    ? `/api/instances/${machineId}/analytics/debug-config`
    : null

  const { data, error, isLoading, mutate } = useSWR<DebugConfigState>(url, fetcher, {
    revalidateOnFocus: false,
  })

  const toggle = async (patch: Partial<DebugConfigState>) => {
    if (!machineId) return
    const res = await fetch(`/api/instances/${machineId}/analytics/debug-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text)
    }
    await mutate()
  }

  return { data, error, isLoading, toggle }
}

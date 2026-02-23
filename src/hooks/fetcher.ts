'use client'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(
      (body as ApiResponse<T>)?.error ?? `Request failed: ${res.status}`
    )
  }
  const body: ApiResponse<T> = await res.json()
  if (!body.success) {
    throw new Error(body.error ?? 'Request failed')
  }
  return body.data as T
}

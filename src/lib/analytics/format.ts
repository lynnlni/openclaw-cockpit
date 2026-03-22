export function fmtMs(ms: number): string {
  if (ms === 0) return '0s'
  if (ms < 1000) return `${ms}ms`
  return `${Math.round(ms / 100) / 10}s`
}

export function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}

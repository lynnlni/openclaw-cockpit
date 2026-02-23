import type { DailyMemory } from './types'

const DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})/

export function parseDailyMemoryFilename(
  filename: string
): string | null {
  const match = filename.match(DATE_PATTERN)
  return match ? match[1] : null
}

export function sortDailyMemories(memories: DailyMemory[]): DailyMemory[] {
  return [...memories].sort((a, b) => b.date.localeCompare(a.date))
}

import type { VersionInfo } from './types'

export function getLocalVersionCommand(): string {
  return 'openclaw --version 2>/dev/null || echo none'
}

export function getLatestVersionCommand(): string {
  return 'npm view openclaw version'
}

export function parseVersions(localOutput: string, remoteOutput: string): VersionInfo {
  const current = parseVersionString(localOutput)
  const latest = parseVersionString(remoteOutput)

  return {
    current,
    latest,
    updateAvailable: isUpdateAvailable(current, latest),
  }
}

function parseVersionString(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === 'none') return null

  const cleaned = trimmed.startsWith('v') ? trimmed.slice(1) : trimmed
  const match = cleaned.match(/^(\d+\.\d+\.\d+)/)
  return match ? match[1] : null
}

function isUpdateAvailable(current: string | null, latest: string | null): boolean {
  if (!current || !latest) return false
  return compareSemver(current, latest) < 0
}

function compareSemver(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0)
    if (diff !== 0) return diff
  }

  return 0
}

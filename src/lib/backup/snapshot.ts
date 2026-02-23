import { getSnapshotDir } from './exporter'
import { shellEscape, shellEscapePath } from '@/lib/ssh/shell-escape'
import type { BackupSnapshot } from './types'

export function getListSnapshotsCommand(openclawPath: string): string {
  const backupsDir = getSnapshotDir(openclawPath)
  // Use stat for machine-readable timestamps; fall back to ls
  return `find ${shellEscapePath(backupsDir)} -maxdepth 1 -name "*.tar.gz" -printf "%T@ %s %f\\n" 2>/dev/null | sort -rn || ls -lh ${shellEscapePath(backupsDir)} 2>/dev/null || echo ""`
}

export function parseSnapshotList(output: string): BackupSnapshot[] {
  if (!output.trim()) {
    return []
  }

  const lines = output.trim().split('\n').filter(Boolean)

  // Check if output is from `find -printf` format: "timestamp size filename"
  const firstLine = lines[0] ?? ''
  const isFindFormat = /^\d+\.\d+ \d+ .+\.tar\.gz$/.test(firstLine)

  if (isFindFormat) {
    return lines
      .filter((line) => line.endsWith('.tar.gz'))
      .map((line) => {
        const parts = line.split(' ')
        const timestamp = parseFloat(parts[0] ?? '0')
        const sizeBytes = parseInt(parts[1] ?? '0', 10)
        const fileName = parts.slice(2).join(' ')
        const name = fileName.replace('.tar.gz', '')

        return {
          name,
          createdAt: new Date(timestamp * 1000).toISOString(),
          size: formatBytes(sizeBytes),
          path: fileName,
          type: name.includes('workspace') ? 'workspace' as const : 'full' as const,
        }
      })
  }

  // Fallback: parse ls -lh output
  return lines
    .filter((line) => line.endsWith('.tar.gz'))
    .map((line) => {
      const parts = line.split(/\s+/)
      const fileName = parts[parts.length - 1] ?? ''
      const size = parts[4] ?? '0'
      const dateStr = [parts[5], parts[6], parts[7]].join(' ')

      return {
        name: fileName.replace('.tar.gz', ''),
        createdAt: dateStr,
        size,
        path: fileName,
        type: fileName.includes('workspace') ? 'workspace' as const : 'full' as const,
      }
    })
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function getDeleteSnapshotCommand(
  openclawPath: string,
  name: string
): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error('Invalid snapshot name')
  }

  const backupsDir = getSnapshotDir(openclawPath)
  const target = `${backupsDir}/${name}.tar.gz`
  return `rm -f ${shellEscapePath(target)}`
}

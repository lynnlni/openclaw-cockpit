import { getSnapshotDir } from './exporter'
import { shellEscape, shellEscapePath } from '@/lib/ssh/shell-escape'
import type { BackupSnapshot } from './types'

export function getListSnapshotsCommand(openclawPath: string): string {
  const backupsDir = getSnapshotDir(openclawPath)
  const dir = shellEscapePath(backupsDir)
  // GNU find -printf is Linux-only; BSD find (macOS) doesn't support it.
  // Capture find output into a variable so we can test whether it worked,
  // rather than relying on exit code (which gets masked by the pipe to sort).
  return [
    `_d=${dir}`,
    `if [ ! -d "$_d" ]; then echo ""; exit 0; fi`,
    `_gnu=$(find "$_d" -maxdepth 1 -name "*.tar.gz" -printf "%T@ %s %f\\n" 2>/dev/null | sort -rn)`,
    `if [ -n "$_gnu" ]; then`,
    `  echo "$_gnu"`,
    `else`,
    `  for _f in "$_d"/*.tar.gz; do`,
    `    [ -f "$_f" ] || continue`,
    `    _mt=$(stat -f "%m" "$_f" 2>/dev/null || stat -c "%Y" "$_f" 2>/dev/null || echo 0)`,
    `    _sz=$(stat -f "%z" "$_f" 2>/dev/null || stat -c "%s" "$_f" 2>/dev/null || echo 0)`,
    `    _bn=$(basename "$_f")`,
    `    echo "$_mt.0 $_sz $_bn"`,
    `  done | sort -rn`,
    `fi`,
  ].join('\n')
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
          type: inferSnapshotType(name),
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
      const name = fileName.replace('.tar.gz', '')

      return {
        name,
        createdAt: dateStr,
        size,
        path: fileName,
        type: inferSnapshotType(name),
      }
    })
}

export function inferSnapshotType(name: string): 'full' | 'workspace' {
  // New naming convention: snapshot-ws-* = workspace, snapshot-full-* = full
  if (name.startsWith('snapshot-ws-')) return 'workspace'
  if (name.startsWith('snapshot-full-')) return 'full'
  // Legacy fallback: any name containing 'workspace' was a workspace backup
  return name.includes('workspace') ? 'workspace' : 'full'
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

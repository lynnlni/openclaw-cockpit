import { getSnapshotDir } from './exporter'
import { shellEscapePath } from '@/lib/ssh/shell-escape'

export function getImportCommand(
  openclawPath: string,
  backupPath: string
): string {
  return `tar -xzf ${shellEscapePath(backupPath)} -C ${shellEscapePath(openclawPath)}`
}

export function getPreRestoreSnapshotCommand(
  openclawPath: string
): string {
  const backupsDir = getSnapshotDir(openclawPath)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const snapshotName = `pre-restore-${timestamp}`
  const target = `${backupsDir}/${snapshotName}.tar.gz`

  return `mkdir -p ${shellEscapePath(backupsDir)} && tar -czf ${shellEscapePath(target)} --exclude=./backups -C ${shellEscapePath(openclawPath)} .`
}

import { shellEscape, shellEscapePath } from '@/lib/ssh/shell-escape'

export function getExportCommand(
  openclawPath: string,
  backupName: string,
  type: 'full' | 'workspace'
): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(backupName)) {
    throw new Error('Invalid backup name')
  }

  const backupsDir = getSnapshotDir(openclawPath)
  const target = `${backupsDir}/${backupName}.tar.gz`
  const source = type === 'full' ? openclawPath : `${openclawPath}/workspace`

  // Exclude the backups directory itself to avoid "file changed as we read it"
  // when the tar output is inside the source tree
  const exclude = type === 'full' ? ' --exclude=./backups' : ''
  return `mkdir -p ${shellEscapePath(backupsDir)} && tar -czf ${shellEscapePath(target)}${exclude} -C ${shellEscapePath(source)} .`
}

export function getSnapshotDir(openclawPath: string): string {
  return `${openclawPath}/backups`
}

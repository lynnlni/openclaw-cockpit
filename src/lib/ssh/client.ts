import path from 'node:path'

import { getConnection, execWithRetry } from './connection-pool'
import type { FileEntry, SSHConnectionConfig, SSHExecResult } from './types'

function validatePath(remotePath: string): void {
  const normalized = path.posix.normalize(remotePath)
  if (normalized.includes('..')) {
    throw new Error(`Path traversal detected: ${remotePath}`)
  }
}

function expandHome(remotePath: string): string {
  if (remotePath.startsWith('~/')) {
    return `$HOME/${remotePath.slice(2)}`
  }
  if (remotePath === '~') {
    return '$HOME'
  }
  return remotePath
}

export async function exec(
  machineId: string,
  config: SSHConnectionConfig,
  command: string,
): Promise<SSHExecResult> {
  return execWithRetry(machineId, config, command)
}

export async function readFile(
  machineId: string,
  config: SSHConnectionConfig,
  remotePath: string,
): Promise<string> {
  validatePath(remotePath)
  const expanded = expandHome(remotePath)
  const result = await exec(machineId, config, `cat "${expanded}"`)

  if (result.code !== 0) {
    throw new Error(`Failed to read ${remotePath}: ${result.stderr}`)
  }

  return result.stdout
}

export async function writeFile(
  machineId: string,
  config: SSHConnectionConfig,
  remotePath: string,
  content: string,
): Promise<void> {
  validatePath(remotePath)
  const expanded = expandHome(remotePath)
  const tmpPath = `${expanded}.tmp.${Date.now()}`
  const escapedContent = content.replace(/'/g, "'\\''")

  const dirResult = await exec(
    machineId,
    config,
    `mkdir -p "$(dirname "${expanded}")"`,
  )

  const writeResult = await exec(
    machineId,
    config,
    `printf '%s' '${escapedContent}' > "${tmpPath}"`,
  )

  if (writeResult.code !== 0) {
    throw new Error(`Failed to write temp file: ${writeResult.stderr}`)
  }

  const mvResult = await exec(
    machineId,
    config,
    `mv "${tmpPath}" "${expanded}"`,
  )

  if (mvResult.code !== 0) {
    await exec(machineId, config, `rm -f "${tmpPath}"`)
    throw new Error(`Failed to move temp file to ${remotePath}: ${mvResult.stderr}`)
  }
}

export async function fileExists(
  machineId: string,
  config: SSHConnectionConfig,
  remotePath: string,
): Promise<boolean> {
  validatePath(remotePath)
  const expanded = expandHome(remotePath)
  const result = await exec(
    machineId,
    config,
    `test -e "${expanded}" && echo "exists"`,
  )
  return result.stdout.trim() === 'exists'
}

function parseListEntry(line: string, basePath: string): FileEntry | null {
  const parts = line.split(/\s+/)
  if (parts.length < 9) return null

  const permissions = parts[0] ?? ''
  const size = parseInt(parts[4] ?? '0', 10)
  const dateStr = `${parts[5]} ${parts[6]} ${parts[7]}`
  const name = parts.slice(8).join(' ')

  if (name === '.' || name === '..') return null

  return {
    name,
    path: path.posix.join(basePath, name),
    type: permissions.startsWith('d') ? 'directory' : 'file',
    size,
    modifiedAt: dateStr,
  }
}

export async function listDir(
  machineId: string,
  config: SSHConnectionConfig,
  remotePath: string,
  recursive = false,
): Promise<FileEntry[]> {
  validatePath(remotePath)
  const expanded = expandHome(remotePath)

  const result = await exec(
    machineId,
    config,
    `ls -la "${expanded}"`,
  )

  if (result.code !== 0) {
    throw new Error(`Failed to list ${remotePath}: ${result.stderr}`)
  }

  const lines = result.stdout.split('\n').filter((l) => l.trim().length > 0)
  const entries: FileEntry[] = []

  for (const line of lines) {
    const entry = parseListEntry(line, remotePath)
    if (!entry) continue

    if (recursive && entry.type === 'directory') {
      const children = await listDir(machineId, config, entry.path, true)
      entries.push({ ...entry, children })
    } else {
      entries.push(entry)
    }
  }

  return entries
}

export async function uploadFile(
  machineId: string,
  config: SSHConnectionConfig,
  localPath: string,
  remotePath: string,
): Promise<void> {
  validatePath(remotePath)
  const ssh = await getConnection(machineId, config)

  try {
    await ssh.putFile(localPath, remotePath)
  } catch (error) {
    throw new Error(
      `Failed to upload ${localPath} to ${remotePath}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export async function downloadFile(
  machineId: string,
  config: SSHConnectionConfig,
  remotePath: string,
  localPath: string,
): Promise<void> {
  validatePath(remotePath)
  const ssh = await getConnection(machineId, config)

  try {
    await ssh.getFile(localPath, remotePath)
  } catch (error) {
    throw new Error(
      `Failed to download ${remotePath} to ${localPath}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import type { BackupSnapshot, PendingRestore } from './types'
import { inferSnapshotType } from './snapshot'

const PUSH_BACKUPS_DIR = path.join(os.homedir(), '.openclaw-cockpit', 'push-backups')
const PENDING_RESTORE_FILENAME = '.pending-restore.json'

function getMachineDir(machineId: string): string {
  return path.join(PUSH_BACKUPS_DIR, machineId)
}

function ensureMachineDir(machineId: string): string {
  const dir = getMachineDir(machineId)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

function safeFilePath(base: string, filename: string): string {
  const resolved = path.resolve(base, filename)
  if (!resolved.startsWith(path.resolve(base) + path.sep) && resolved !== path.resolve(base)) {
    throw new Error('Path traversal detected')
  }
  return resolved
}

export function savePushBackup(
  machineId: string,
  name: string,
  buffer: Buffer
): void {
  const dir = ensureMachineDir(machineId)
  const filePath = safeFilePath(dir, `${name}.tar.gz`)
  fs.writeFileSync(filePath, buffer)
}

export function listPushBackups(machineId: string): BackupSnapshot[] {
  const dir = getMachineDir(machineId)
  if (!fs.existsSync(dir)) {
    return []
  }

  try {
    const files = fs.readdirSync(dir)
    return files
      .filter((f) => f.endsWith('.tar.gz'))
      .map((f) => {
        const name = f.replace(/\.tar\.gz$/, '')
        const filePath = path.join(dir, f)
        const stat = fs.statSync(filePath)
        const bytes = stat.size
        const size = formatBytes(bytes)
        return {
          name,
          createdAt: stat.mtime.toISOString(),
          size,
          path: filePath,
          type: inferSnapshotType(name),
          source: 'push' as const,
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

export function deletePushBackup(machineId: string, name: string): void {
  const dir = getMachineDir(machineId)
  const filePath = safeFilePath(dir, `${name}.tar.gz`)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

export function readPushBackup(machineId: string, name: string): Buffer {
  const dir = getMachineDir(machineId)
  const filePath = safeFilePath(dir, `${name}.tar.gz`)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Push backup not found: ${name}`)
  }
  return fs.readFileSync(filePath)
}

export function pruneOldBackups(machineId: string, retainDays: number): void {
  const dir = getMachineDir(machineId)
  if (!fs.existsSync(dir)) {
    return
  }

  const cutoff = Date.now() - retainDays * 24 * 60 * 60 * 1000

  try {
    const files = fs.readdirSync(dir)
    for (const f of files) {
      if (!f.endsWith('.tar.gz')) continue
      const filePath = path.join(dir, f)
      const stat = fs.statSync(filePath)
      if (stat.mtime.getTime() < cutoff) {
        fs.unlinkSync(filePath)
      }
    }
  } catch {
    // Best-effort pruning; ignore errors
  }
}

export function setPendingRestore(
  machineId: string,
  snapshotName: string
): void {
  const dir = ensureMachineDir(machineId)
  const pending: PendingRestore = {
    snapshotName,
    requestedAt: new Date().toISOString(),
  }
  fs.writeFileSync(
    path.join(dir, PENDING_RESTORE_FILENAME),
    JSON.stringify(pending, null, 2),
    'utf8'
  )
}

export function getPendingRestore(machineId: string): PendingRestore | null {
  const dir = getMachineDir(machineId)
  const filePath = path.join(dir, PENDING_RESTORE_FILENAME)
  if (!fs.existsSync(filePath)) {
    return null
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(raw) as PendingRestore
  } catch {
    return null
  }
}

export function clearPendingRestore(machineId: string): void {
  const dir = getMachineDir(machineId)
  const filePath = path.join(dir, PENDING_RESTORE_FILENAME)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

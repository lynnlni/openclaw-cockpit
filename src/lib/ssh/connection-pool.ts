import { NodeSSH } from 'node-ssh'

import type { SSHConnectionConfig } from './types'

const CONNECTION_TIMEOUT_MS = 15_000
const KEEPALIVE_INTERVAL_MS = 10_000
const MAX_IDLE_MS = 5 * 60_000
const MAX_RETRIES = 2

interface PoolEntry {
  connection: NodeSSH
  config: SSHConnectionConfig
  lastUsedAt: number
}

const pool: Map<string, PoolEntry> = new Map()

function buildConnectOptions(config: SSHConnectionConfig) {
  return {
    host: config.host,
    port: config.port,
    username: config.username,
    readyTimeout: CONNECTION_TIMEOUT_MS,
    keepaliveInterval: KEEPALIVE_INTERVAL_MS,
    keepaliveCountMax: 3,
    ...(config.authType === 'password'
      ? { password: config.password }
      : {
          privateKeyPath: config.privateKeyPath,
          passphrase: config.passphrase,
        }),
  }
}

async function createConnection(
  machineId: string,
  config: SSHConnectionConfig,
): Promise<NodeSSH> {
  const ssh = new NodeSSH()
  const options = buildConnectOptions(config)

  try {
    await ssh.connect(options)
  } catch (error) {
    throw new Error(
      `SSH connection to ${config.host}:${config.port} failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  pool.set(machineId, {
    connection: ssh,
    config: { ...config },
    lastUsedAt: Date.now(),
  })
  return ssh
}

function isAlive(entry: PoolEntry): boolean {
  if (!entry.connection.isConnected()) return false
  if (Date.now() - entry.lastUsedAt > MAX_IDLE_MS) return false
  return true
}

async function ensureConnection(
  machineId: string,
  config: SSHConnectionConfig,
): Promise<NodeSSH> {
  const entry = pool.get(machineId)

  if (entry && isAlive(entry)) {
    entry.lastUsedAt = Date.now()
    return entry.connection
  }

  // Dispose stale connection
  if (entry) {
    try { entry.connection.dispose() } catch { /* ignore */ }
    pool.delete(machineId)
  }

  return createConnection(machineId, config)
}

export async function getConnection(
  machineId: string,
  config: SSHConnectionConfig,
): Promise<NodeSSH> {
  return ensureConnection(machineId, config)
}

/**
 * Execute a command with automatic reconnect on failure.
 * If the first attempt fails with a connection-related error,
 * dispose the stale connection and retry with a fresh one.
 */
export async function execWithRetry(
  machineId: string,
  config: SSHConnectionConfig,
  command: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const ssh = await ensureConnection(machineId, config)
      const result = await ssh.execCommand(command)

      // Update last used time on success
      const entry = pool.get(machineId)
      if (entry) {
        entry.lastUsedAt = Date.now()
      }

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.code ?? -1,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Force remove stale connection before retry
      const entry = pool.get(machineId)
      if (entry) {
        try { entry.connection.dispose() } catch { /* ignore */ }
        pool.delete(machineId)
      }

      // Don't retry on the last attempt
      if (attempt === MAX_RETRIES) break
    }
  }

  throw lastError ?? new Error('SSH command failed after retries')
}

export function closeConnection(machineId: string): void {
  const entry = pool.get(machineId)
  if (entry) {
    try { entry.connection.dispose() } catch { /* ignore */ }
    pool.delete(machineId)
  }
}

export function closeAll(): void {
  for (const [id, entry] of pool) {
    try { entry.connection.dispose() } catch { /* ignore */ }
    pool.delete(id)
  }
}

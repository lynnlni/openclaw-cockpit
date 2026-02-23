import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import type { SSHConnectionConfig } from '../ssh/types'
import type { Machine } from './types'
import type { CreateMachineInput, UpdateMachineInput } from './schema'

const CONFIG_DIR = path.join(os.homedir(), '.openclaw-cockpit')
const CONFIG_FILE = path.join(CONFIG_DIR, 'machines.json')
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY
  if (envKey) {
    return crypto.scryptSync(envKey, 'openclaw-salt', 32)
  }
  return crypto.scryptSync('openclaw-default-key', 'openclaw-salt', 32)
}

function encrypt(text: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

function decrypt(encoded: string): string {
  const key = getEncryptionKey()
  const buffer = Buffer.from(encoded, 'base64')

  const iv = buffer.subarray(0, IV_LENGTH)
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return decipher.update(encrypted) + decipher.final('utf8')
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function readConfig(): Machine[] {
  ensureConfigDir()
  if (!fs.existsSync(CONFIG_FILE)) {
    return []
  }

  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    return JSON.parse(raw) as Machine[]
  } catch {
    throw new Error('Failed to read machines config file')
  }
}

function writeConfig(machines: Machine[]): void {
  ensureConfigDir()
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(machines, null, 2), 'utf8')
  } catch {
    throw new Error('Failed to write machines config file')
  }
}

export function getMachines(): Machine[] {
  return readConfig().map((m) => ({ ...m }))
}

export function getMachine(id: string): Machine | null {
  const machine = readConfig().find((m) => m.id === id)
  return machine ? { ...machine } : null
}

export function addMachine(data: CreateMachineInput): Machine {
  const machines = readConfig()
  const now = new Date().toISOString()

  const machine: Machine = {
    id: crypto.randomUUID(),
    name: data.name,
    host: data.host,
    port: data.port ?? 22,
    username: data.username,
    authType: data.authType,
    encryptedPassword: data.password && data.password.length > 0 ? encrypt(data.password) : undefined,
    privateKeyPath: data.privateKeyPath,
    passphrase: data.passphrase,
    openclawPath: data.openclawPath ?? '~/.openclaw',
    createdAt: now,
    updatedAt: now,
  }

  writeConfig([...machines, machine])
  return { ...machine }
}

export function updateMachine(id: string, data: UpdateMachineInput): Machine {
  const machines = readConfig()
  const index = machines.findIndex((m) => m.id === id)

  if (index === -1) {
    throw new Error(`Machine not found: ${id}`)
  }

  const existing = machines[index]!
  const updated: Machine = {
    ...existing,
    ...(data.name !== undefined && { name: data.name }),
    ...(data.host !== undefined && { host: data.host }),
    ...(data.port !== undefined && { port: data.port }),
    ...(data.username !== undefined && { username: data.username }),
    ...(data.authType !== undefined && { authType: data.authType }),
    ...(data.password !== undefined && data.password.length > 0 && { encryptedPassword: encrypt(data.password) }),
    ...(data.privateKeyPath !== undefined && { privateKeyPath: data.privateKeyPath }),
    ...(data.passphrase !== undefined && { passphrase: data.passphrase }),
    ...(data.openclawPath !== undefined && { openclawPath: data.openclawPath }),
    updatedAt: new Date().toISOString(),
  }

  const newMachines = machines.map((m, i) => (i === index ? updated : m))
  writeConfig(newMachines)
  return { ...updated }
}

export function deleteMachine(id: string): void {
  const machines = readConfig()
  const filtered = machines.filter((m) => m.id !== id)

  if (filtered.length === machines.length) {
    throw new Error(`Machine not found: ${id}`)
  }

  writeConfig(filtered)
}

export function getDecryptedConfig(machine: Machine): SSHConnectionConfig {
  return {
    host: machine.host,
    port: machine.port,
    username: machine.username,
    authType: machine.authType,
    ...(machine.encryptedPassword && {
      password: decrypt(machine.encryptedPassword),
    }),
    ...(machine.privateKeyPath && {
      privateKeyPath: machine.privateKeyPath,
    }),
    ...(machine.passphrase && {
      passphrase: machine.passphrase,
    }),
  }
}

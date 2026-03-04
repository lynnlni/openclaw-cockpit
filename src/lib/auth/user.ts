import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import os from 'node:os'

import { AUTH_CONFIG, type User, type AuthState, type LoginAttempt } from './config-shared'
import { hashPassword } from './password'

const AUTH_DIR = path.join(os.homedir(), '.openclaw-cockpit')
const AUTH_FILE = path.join(AUTH_DIR, 'auth.json')

/**
 * Ensure auth directory exists
 */
function ensureAuthDir(): void {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true, mode: 0o700 })
  }
}

/**
 * Read auth state from file
 */
function readAuthState(): AuthState {
  ensureAuthDir()

  if (!fs.existsSync(AUTH_FILE)) {
    // Initialize with default admin
    return initializeDefaultAdmin()
  }

  try {
    const raw = fs.readFileSync(AUTH_FILE, 'utf8')
    const state = JSON.parse(raw) as AuthState

    // Ensure loginAttempts exists
    if (!state.loginAttempts) {
      state.loginAttempts = {}
    }

    return state
  } catch {
    // If file is corrupted, reinitialize
    console.error('[AUTH] Failed to read auth file, reinitializing')
    return initializeDefaultAdmin()
  }
}

/**
 * Write auth state to file
 */
function writeAuthState(state: AuthState): void {
  ensureAuthDir()
  fs.writeFileSync(AUTH_FILE, JSON.stringify(state, null, 2), { mode: 0o600 })
}

/**
 * Initialize default admin user
 */
function initializeDefaultAdmin(): AuthState {
  const now = new Date().toISOString()

  const adminUser: User = {
    id: crypto.randomUUID(),
    username: AUTH_CONFIG.DEFAULT_ADMIN.username,
    // Hash will be calculated below
    passwordHash: '',
    role: 'admin',
    createdAt: now,
    updatedAt: now,
    requirePasswordChange: true,
  }

  // We'll hash the password synchronously for initialization
  // Using a simple approach since this is just for initialization
  const bcrypt = require('bcryptjs')
  adminUser.passwordHash = bcrypt.hashSync(AUTH_CONFIG.DEFAULT_ADMIN.password, 12)

  const state: AuthState = {
    users: [adminUser],
    loginAttempts: {},
  }

  writeAuthState(state)

  console.log('[AUTH] Initialized default admin user')
  console.log(`[AUTH] Username: ${AUTH_CONFIG.DEFAULT_ADMIN.username}`)
  console.log(`[AUTH] Password: ${AUTH_CONFIG.DEFAULT_ADMIN.password} (must change on first login)`)

  return state
}

/**
 * Find user by username
 */
export function findUserByUsername(username: string): User | null {
  const state = readAuthState()
  const user = state.users.find((u) => u.username === username)
  return user ? { ...user } : null
}

/**
 * Find user by ID
 */
export function findUserById(id: string): User | null {
  const state = readAuthState()
  const user = state.users.find((u) => u.id === id)
  return user ? { ...user } : null
}

/**
 * Update user
 */
export function updateUser(id: string, updates: Partial<User>): User | null {
  const state = readAuthState()
  const index = state.users.findIndex((u) => u.id === id)

  if (index === -1) {
    return null
  }

  state.users[index] = {
    ...state.users[index]!,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  writeAuthState(state)
  return { ...state.users[index]! }
}

/**
 * Record login attempt
 */
export function recordLoginAttempt(username: string, success: boolean, ip: string): void {
  const state = readAuthState()

  if (!state.loginAttempts[username]) {
    state.loginAttempts[username] = []
  }

  state.loginAttempts[username]!.push({
    timestamp: Date.now(),
    success,
    ip,
  })

  // Keep only last 20 attempts per user
  if (state.loginAttempts[username]!.length > 20) {
    state.loginAttempts[username] = state.loginAttempts[username]!.slice(-20)
  }

  writeAuthState(state)
}

/**
 * Check if user is rate limited
 */
export function isRateLimited(username: string): { limited: boolean; remainingTime?: number } {
  const state = readAuthState()
  const attempts = state.loginAttempts[username] || []

  const windowStart = Date.now() - AUTH_CONFIG.RATE_LIMIT_WINDOW_MS
  const recentAttempts = attempts.filter(
    (a) => a.timestamp > windowStart && !a.success
  )

  if (recentAttempts.length >= AUTH_CONFIG.RATE_LIMIT_MAX_ATTEMPTS) {
    const oldestAttempt = recentAttempts[0]!
    const remainingTime = AUTH_CONFIG.RATE_LIMIT_WINDOW_MS - (Date.now() - oldestAttempt.timestamp)
    return { limited: true, remainingTime }
  }

  return { limited: false }
}

/**
 * Update last login time
 */
export function updateLastLogin(id: string): void {
  updateUser(id, { lastLoginAt: new Date().toISOString() })
}

/**
 * Change password
 */
export async function changePassword(id: string, newPassword: string): Promise<boolean> {
  const user = findUserById(id)
  if (!user) {
    return false
  }

  const passwordHash = await hashPassword(newPassword)

  updateUser(id, {
    passwordHash,
    requirePasswordChange: false,
  })

  return true
}

/**
 * Check if this is the first login (only one user with default password)
 */
export function isFirstLogin(): boolean {
  const state = readAuthState()

  if (state.users.length !== 1) {
    return false
  }

  const admin = state.users[0]!
  return admin.username === AUTH_CONFIG.DEFAULT_ADMIN.username && admin.requirePasswordChange
}

/**
 * Get all users (for admin)
 */
export function getAllUsers(): User[] {
  const state = readAuthState()
  return state.users.map((u) => ({ ...u }))
}

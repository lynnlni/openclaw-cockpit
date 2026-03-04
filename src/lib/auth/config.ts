import path from 'node:path'
import os from 'node:os'

// Re-export shared config
export * from './config-shared'

// File paths - server-side only
export const AUTH_PATHS = {
  AUTH_DIR: path.join(os.homedir(), '.openclaw-cockpit'),
  AUTH_FILE: path.join(os.homedir(), '.openclaw-cockpit', 'auth.json'),
} as const

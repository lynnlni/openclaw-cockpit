import bcrypt from 'bcryptjs'
import { AUTH_CONFIG } from './config-shared'

const SALT_ROUNDS = 12

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`,
    }
  }

  // Check for common weak passwords
  const commonPasswords = ['123456', 'password', 'qwerty', 'admin123', 'letmein']
  if (commonPasswords.includes(password.toLowerCase())) {
    return {
      valid: false,
      error: 'Password is too common, please choose a stronger password',
    }
  }

  return { valid: true }
}

/**
 * Check if password needs to be changed (default password check)
 */
export function isDefaultPassword(password: string): boolean {
  return password === AUTH_CONFIG.DEFAULT_ADMIN.password
}

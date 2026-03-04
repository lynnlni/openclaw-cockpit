// Shared auth configuration - safe for Edge Runtime
// This file does NOT import any Node.js modules

export const AUTH_CONFIG = {
  // JWT configuration
  get JWT_SECRET() {
    const envSecret = process.env.JWT_SECRET
    if (envSecret) {
      return envSecret
    }
    // Generate a warning if using default secret
    console.warn('[AUTH] Warning: Using default JWT secret. Set JWT_SECRET env var for production.')
    return 'openclaw-cockpit-default-secret-key-change-in-production'
  },
  JWT_EXPIRES_IN: '24h',
  JWT_ALGORITHM: 'HS256' as const,

  // Cookie configuration
  COOKIE_NAME: 'openclaw_session',
  COOKIE_MAX_AGE: 24 * 60 * 60, // 24 hours in seconds

  // Password requirements
  PASSWORD_MIN_LENGTH: 6,

  // Rate limiting
  RATE_LIMIT_MAX_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW_MS: 5 * 60 * 1000, // 5 minutes

  // Captcha configuration
  CAPTCHA_LENGTH: 6,
  CAPTCHA_EXPIRES_IN: 5 * 60, // 5 minutes in seconds
  CAPTCHA_WIDTH: 150,
  CAPTCHA_HEIGHT: 50,

  // Default admin credentials (only for first initialization)
  DEFAULT_ADMIN: {
    username: 'admin',
    password: 'admin123',
  },
} as const

// Role types
export type UserRole = 'admin'

// User interface
export interface User {
  id: string
  username: string
  passwordHash: string
  role: UserRole
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  requirePasswordChange: boolean
}

// Auth state interface
export interface AuthState {
  users: User[]
  loginAttempts: Record<string, LoginAttempt[]>
}

// Login attempt tracking
export interface LoginAttempt {
  timestamp: number
  success: boolean
  ip: string
}

// Session payload
export interface SessionPayload {
  userId: string
  username: string
  role: UserRole
  iat: number
  exp: number
}

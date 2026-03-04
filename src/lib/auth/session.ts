import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { AUTH_CONFIG, type SessionPayload, type UserRole } from './config-shared'

/**
 * Create a new JWT session
 */
export async function createSession(userId: string, username: string, role: UserRole): Promise<string> {
  const secret = new TextEncoder().encode(AUTH_CONFIG.JWT_SECRET)
  const now = Math.floor(Date.now() / 1000)

  const payload: Omit<SessionPayload, 'iat' | 'exp'> = {
    userId,
    username,
    role,
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: AUTH_CONFIG.JWT_ALGORITHM })
    .setIssuedAt(now)
    .setExpirationTime(AUTH_CONFIG.JWT_EXPIRES_IN)
    .sign(secret)

  return token
}

/**
 * Verify a JWT session
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secret = new TextEncoder().encode(AUTH_CONFIG.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [AUTH_CONFIG.JWT_ALGORITHM],
    })

    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_CONFIG.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AUTH_CONFIG.COOKIE_MAX_AGE,
    path: '/',
  })
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_CONFIG.COOKIE_NAME)
}

/**
 * Get current session from cookie
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_CONFIG.COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    return verifySession(token)
  } catch {
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession()
  return session !== null
}

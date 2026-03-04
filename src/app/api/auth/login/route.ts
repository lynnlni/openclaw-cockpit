import { NextRequest, NextResponse } from 'next/server'

import { verifyPassword } from '@/lib/auth/password'
import { createSession, setSessionCookie } from '@/lib/auth/session'
import { verifyCaptcha } from '@/lib/auth/captcha'
import {
  findUserByUsername,
  recordLoginAttempt,
  isRateLimited,
  updateLastLogin,
} from '@/lib/auth/user'
import { AUTH_CONFIG } from '@/lib/auth/config-shared'

interface LoginRequest {
  username: string
  password: string
  captchaId: string
  captchaCode: string
}

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as LoginRequest
    const { username, password, captchaId, captchaCode } = body

    // Validate required fields
    if (!username || !password || !captchaId || !captchaCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Check rate limiting
    const rateLimit = isRateLimited(username)
    if (rateLimit.limited) {
      const minutes = Math.ceil((rateLimit.remainingTime || 0) / 60000)
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Please try again in ${minutes} minute(s).`,
        },
        { status: 429 }
      )
    }

    // Verify captcha
    if (!verifyCaptcha(captchaId, captchaCode)) {
      recordLoginAttempt(username, false, ip)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired captcha',
        },
        { status: 400 }
      )
    }

    // Find user
    const user = findUserByUsername(username)
    if (!user) {
      recordLoginAttempt(username, false, ip)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid username or password',
        },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      recordLoginAttempt(username, false, ip)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid username or password',
        },
        { status: 401 }
      )
    }

    // Record successful login
    recordLoginAttempt(username, true, ip)
    updateLastLogin(user.id)

    // Create session
    const token = await createSession(user.id, user.username, user.role)
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          requirePasswordChange: user.requirePasswordChange,
        },
      },
    })
  } catch (error) {
    console.error('[Login] Login failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed. Please try again.',
      },
      { status: 500 }
    )
  }
}

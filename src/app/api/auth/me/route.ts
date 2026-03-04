import { NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/auth/user'

/**
 * GET /api/auth/me
 * Get current user info
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      )
    }

    const user = findUserById(session.userId)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          requirePasswordChange: user.requirePasswordChange,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
      },
    })
  } catch (error) {
    console.error('[Auth] Failed to get user info:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user info',
      },
      { status: 500 }
    )
  }
}

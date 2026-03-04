import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth/session'

/**
 * POST /api/auth/logout
 * Clear user session
 */
export async function POST(): Promise<NextResponse> {
  try {
    await clearSessionCookie()

    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    })
  } catch (error) {
    console.error('[Logout] Logout failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
      },
      { status: 500 }
    )
  }
}

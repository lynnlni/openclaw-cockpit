import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth/session'
import { changePassword, findUserById } from '@/lib/auth/user'
import { validatePassword, verifyPassword } from '@/lib/auth/password'

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/**
 * POST /api/auth/change-password
 * Change user password
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

    const body = (await request.json()) as ChangePasswordRequest
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Current password and new password are required',
        },
        { status: 400 }
      )
    }

    // Validate new password
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      )
    }

    // Get user
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

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isCurrentValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Current password is incorrect',
        },
        { status: 400 }
      )
    }

    // Change password
    const success = await changePassword(session.userId, newPassword)
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to change password',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Password changed successfully' },
    })
  } catch (error) {
    console.error('[Auth] Failed to change password:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to change password',
      },
      { status: 500 }
    )
  }
}

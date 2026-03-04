import { NextResponse } from 'next/server'
import { createCaptcha } from '@/lib/auth/captcha'

/**
 * GET /api/auth/captcha
 * Generate a new captcha
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { id, svg } = createCaptcha()

    return NextResponse.json({
      success: true,
      data: {
        id,
        svg,
      },
    })
  } catch (error) {
    console.error('[Captcha] Failed to generate captcha:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate captcha',
      },
      { status: 500 }
    )
  }
}

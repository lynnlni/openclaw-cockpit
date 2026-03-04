import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_CONFIG } from '@/lib/auth/config-shared'

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/captcha',
]

// Check if path is public
function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(publicPath =>
    path === publicPath || path.startsWith(publicPath + '/')
  )
}

// Simple JWT verification for middleware (Edge Runtime compatible)
async function verifyToken(token: string): Promise<{ userId: string; username: string; role: string } | null> {
  try {
    // Split token
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // Decode payload
    const payload = JSON.parse(atob(parts[1]))

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null
    }

    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Allow static files and assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for session cookie
  const token = request.cookies.get(AUTH_CONFIG.COOKIE_NAME)?.value

  if (!token) {
    // API requests should return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      )
    }

    // Page requests should redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const session = await verifyToken(token)

  if (!session) {
    // Clear invalid cookie
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete(AUTH_CONFIG.COOKIE_NAME)
    return response
  }

  // Add user info to request headers for API routes
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.userId)
    requestHeaders.set('x-user-role', session.role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

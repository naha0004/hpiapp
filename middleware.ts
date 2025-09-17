import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { setSecurityHeaders, rateLimit } from './lib/security'
import { getToken } from 'next-auth/jwt'

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300 // Increased for authentication flows - limit each IP to 300 requests per windowMs
})

// API routes that require stricter rate limiting
const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced window)
  max: 30 // Increased for development - limit each IP to 30 requests per windowMs
})

// Paths that require strict rate limiting
const strictRateLimitPaths = [
  '/api/auth/register',
  '/api/payments',
  '/api/upload'
]

// Public paths that don't require authentication
const publicPaths = [
  '/api/health',
  '/api/mock-hpi',
  '/api/debug/env', // Remove this in production
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/callback',
  '/api/auth/session',
  '/api/auth/providers',
  '/api/auth/csrf'
]

// Protected pages that require authentication
const protectedPaths = [
  '/appeals'
]

// Public pages that don't require authentication
const publicPagePaths = [
  '/',
  '/terms',
  '/privacy'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check authentication for protected pages
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token) {
      // Redirect to home page with login required message
      const url = new URL('/', request.url)
      url.searchParams.set('login', 'required')
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Apply security headers to all responses
  let response = NextResponse.next()

  // Apply rate limiting for API routes - DISABLED FOR TESTING
  if (pathname.startsWith('/api/')) {
    // Apply strict rate limiting to sensitive endpoints - DISABLED FOR TESTING
    // if (strictRateLimitPaths.some(path => pathname.startsWith(path))) {
    //   const rateLimitResponse = strictLimiter(request)
    //   if (rateLimitResponse) {
    //     return setSecurityHeaders(rateLimitResponse)
    //   }
    // } else {
    //   // Apply general rate limiting
    //   const rateLimitResponse = limiter(request)
    //   if (rateLimitResponse) {
    //     return setSecurityHeaders(rateLimitResponse)
    //   }
    // }

    // Block requests without proper origin in production
    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin')
      const host = request.headers.get('host')
      const allowedOrigins = [
        `https://${host}`,
        process.env.NEXTAUTH_URL,
        process.env.PRODUCTION_URL
      ].filter(Boolean)

      if (request.method !== 'GET' && origin && !allowedOrigins.includes(origin)) {
        return setSecurityHeaders(
          NextResponse.json(
            { error: 'Forbidden: Invalid origin' },
            { status: 403 }
          )
        )
      }
    }

    // Add CORS headers for API routes
    response.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' ? request.headers.get('origin') || '' : '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
    response.headers.set('Access-Control-Max-Age', '86400')

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return setSecurityHeaders(new NextResponse(null, { status: 200 }))
    }
  }

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto')
    if (proto === 'http') {
      const httpsUrl = new URL(request.url)
      httpsUrl.protocol = 'https:'
      return NextResponse.redirect(httpsUrl, 301)
    }
  }

  return setSecurityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}

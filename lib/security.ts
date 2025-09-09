import { NextRequest, NextResponse } from 'next/server'

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number
  max: number
}

export function rateLimit(options: RateLimitOptions) {
  return (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()

    // Clean old entries
    rateLimitMap.forEach((value, key) => {
      if (value.resetTime < now) {
        rateLimitMap.delete(key)
      }
    })

    const current = rateLimitMap.get(ip) || { count: 0, resetTime: now + options.windowMs }
    
    if (current.resetTime < now) {
      current.count = 0
      current.resetTime = now + options.windowMs
    }

    current.count++
    rateLimitMap.set(ip, current)

    if (current.count > options.max) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': options.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': current.resetTime.toString()
          }
        }
      )
    }

    return null // Continue
  }
}

// Function to clear rate limit for development
export function clearRateLimit() {
  rateLimitMap.clear()
}

export function validateInput(input: unknown, schema: { parse: (input: unknown) => unknown }) {
  try {
    return schema.parse(input)
  } catch (error) {
    console.warn('Validation failed:', error)
    throw new Error('Invalid input data')
  }
}

export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove basic XSS vectors
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .trim()
}

export function generateSecureToken(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  // Fallback for Node.js runtime
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
}

export function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  return response
}

export function logSecurityEvent(event: string, details: Record<string, unknown>) {
  // In production, send to security monitoring service
  console.warn(`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    ...details,
    // Never log sensitive data
    userAgent: details.userAgent ? '[REDACTED]' : undefined,
    ip: details.ip ? '[REDACTED]' : undefined
  })
}

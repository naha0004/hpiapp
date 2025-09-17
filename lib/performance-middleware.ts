// Performance monitoring middleware
import { NextRequest, NextResponse } from "next/server"
import { AppealAnalytics } from "./analytics"

export function withPerformanceTracking(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    const endpoint = req.nextUrl.pathname
    const method = req.method
    const userAgent = req.headers.get('user-agent') || ''
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    
    try {
      const response = await handler(req)
      const responseTime = Date.now() - startTime
      
      // Track API call with analytics
      await AppealAnalytics.trackApiCall(
        endpoint,
        method,
        response.status,
        responseTime,
        undefined, // userId - can be extracted from auth if needed
        userAgent,
        ipAddress
      )
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${responseTime}ms`)
      response.headers.set('X-Timestamp', new Date().toISOString())
      response.headers.set('X-Request-ID', crypto.randomUUID())
      
      return response
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Track error
      await AppealAnalytics.trackApiCall(
        endpoint,
        method,
        500,
        responseTime,
        undefined,
        userAgent,
        ipAddress,
        errorMessage
      )
      
      // Log system error
      await AppealAnalytics.logSystemError(
        'API_ERROR',
        errorMessage,
        error instanceof Error ? error.stack : undefined,
        endpoint,
        undefined,
        'HIGH'
      )
      
      console.error(`[PERF ERROR] ${endpoint}: ${responseTime}ms - ${error}`)
      throw error
    }
  }
}

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const requestCounts = new Map<string, { count: number; resetTime: number }>()
  
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      const now = Date.now()
      
      // Clean up old entries
      for (const [ip, data] of requestCounts.entries()) {
        if (now > data.resetTime) {
          requestCounts.delete(ip)
        }
      }
      
      // Check current request count
      const clientData = requestCounts.get(clientIP)
      if (!clientData) {
        requestCounts.set(clientIP, { count: 1, resetTime: now + windowMs })
      } else if (clientData.count >= maxRequests) {
        return NextResponse.json(
          { 
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${Math.ceil((clientData.resetTime - now) / 1000)} seconds.`,
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((clientData.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': clientData.resetTime.toString()
            }
          }
        )
      } else {
        clientData.count += 1
      }
      
      const response = await handler(req)
      
      // Add rate limit headers
      const remaining = Math.max(0, maxRequests - (clientData?.count || 0))
      response.headers.set('X-RateLimit-Limit', maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', (clientData?.resetTime || now + windowMs).toString())
      
      return response
    }
  }
}

export function withSecurityHeaders(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function (req: NextRequest): Promise<NextResponse> {
    const response = await handler(req)
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // CORS headers for API
    if (req.nextUrl.pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }
    
    return response
  }
}

// Input sanitization utilities
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

// Email-specific rate limiting
export const emailSubmissionRateLimit = withRateLimit(3, 15 * 60 * 1000) // 3 emails per 15 minutes
export const pdfGenerationRateLimit = withRateLimit(10, 5 * 60 * 1000) // 10 PDFs per 5 minutes
export const generalApiRateLimit = withRateLimit(100, 15 * 60 * 1000) // 100 requests per 15 minutes

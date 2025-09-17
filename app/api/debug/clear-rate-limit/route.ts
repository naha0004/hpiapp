import { NextRequest, NextResponse } from 'next/server'
import { clearRateLimit } from '@/lib/security'

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    clearRateLimit()
    return NextResponse.json({ 
      message: 'Rate limiting cleared successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error clearing rate limit:', error)
    return NextResponse.json({ error: 'Failed to clear rate limit' }, { status: 500 })
  }
}

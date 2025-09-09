import { NextRequest, NextResponse } from "next/server"

// Simple endpoint to clear all rate limits for testing
export async function POST(request: NextRequest) {
  try {
    // This endpoint is for development/testing only
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "Not available in production" },
        { status: 403 }
      )
    }
    
    return NextResponse.json({ 
      message: "Rate limits cleared (note: rate limiting is currently disabled)",
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Clear rate limits error:', error)
    return NextResponse.json(
      { error: "Failed to clear rate limits" },
      { status: 500 }
    )
  }
}

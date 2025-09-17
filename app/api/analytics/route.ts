// API endpoint for analytics data
import { NextRequest, NextResponse } from "next/server"
import { AppealAnalytics } from "../../../lib/analytics"
import { withPerformanceTracking } from "../../../lib/performance-middleware"

async function analyticsHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'overview'
    
    switch (type) {
      case 'overview':
        const analytics = await AppealAnalytics.getSystemAnalytics()
        return NextResponse.json({
          success: true,
          data: analytics,
          timestamp: new Date().toISOString()
        })
        
      case 'health':
        const healthStats = await AppealAnalytics.getSystemHealthStats()
        return NextResponse.json({
          success: true,
          data: healthStats,
          timestamp: new Date().toISOString()
        })
        
      case 'email':
        const emailStats = await AppealAnalytics.getDetailedEmailStats()
        return NextResponse.json({
          success: true,
          data: emailStats,
          timestamp: new Date().toISOString()
        })
        
      case 'full':
        const [fullAnalytics, health, email] = await Promise.all([
          AppealAnalytics.getSystemAnalytics(),
          AppealAnalytics.getSystemHealthStats(),
          AppealAnalytics.getDetailedEmailStats()
        ])
        
        return NextResponse.json({
          success: true,
          data: {
            analytics: fullAnalytics,
            health,
            email
          },
          timestamp: new Date().toISOString()
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type. Use: overview, health, email, or full' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Analytics API error:', error)
    
    await AppealAnalytics.logSystemError(
      'API_ERROR',
      `Analytics API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error.stack : undefined,
      '/api/analytics',
      undefined,
      'HIGH'
    )
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

export const GET = withPerformanceTracking(analyticsHandler)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// TEMPORARY TEST VERSION - Authentication bypassed for testing
console.log("⚠️  TEST MODE: Admin Analytics API - Authentication bypassed!")

const getAnalyticsSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  metric: z.enum(['users', 'appeals', 'payments', 'hpi']).optional()
})

export async function GET(request: NextRequest) {
  try {
    // SKIP AUTH FOR TESTING
    // await requirePermission(AdminPermission.VIEW_ANALYTICS)
    
    const { searchParams } = new URL(request.url)
    const params = getAnalyticsSchema.parse(Object.fromEntries(searchParams))
    
    // Calculate date range
    const now = new Date()
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
    const days = daysMap[params.period]
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    // Get user statistics
    const userStats = await prisma.user.aggregate({
      _count: { id: true },
      where: {
        createdAt: { gte: startDate }
      }
    })
    
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    })
    
    // Get subscription breakdown
    const subscriptionStats = await prisma.user.groupBy({
      by: ['subscriptionType'],
      _count: { id: true }
    })
    
    // Get appeal statistics
    const appealStats = await prisma.appeal.aggregate({
      _count: { id: true },
      where: {
        createdAt: { gte: startDate }
      }
    })
    
    const appealsByStatus = await prisma.appeal.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate }
      }
    })
    
    // Get payment statistics
    const paymentStats = await prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      }
    })
    
    // Get HPI check statistics
    const hpiStats = await prisma.hPICheck.aggregate({
      _count: { id: true },
      where: {
        createdAt: { gte: startDate }
      }
    })
    
    // Revenue breakdown
    const revenueByType = await prisma.payment.groupBy({
      by: ['type'],
      _sum: { amount: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      }
    })
    
    return NextResponse.json({
      period: params.period,
      dateRange: { start: startDate, end: now },
      overview: {
        totalUsers,
        activeUsers,
        newUsers: userStats._count.id || 0,
        totalAppeals: appealStats._count.id || 0,
        totalRevenue: paymentStats._sum.amount || 0,
        totalHpiChecks: hpiStats._count.id || 0
      },
      subscriptions: subscriptionStats.reduce((acc, item) => {
        acc[item.subscriptionType] = item._count.id
        return acc
      }, {} as Record<string, number>),
      appeals: {
        total: appealStats._count.id || 0,
        byStatus: appealsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id
          return acc
        }, {} as Record<string, number>)
      },
      payments: {
        total: paymentStats._count.id || 0,
        revenue: paymentStats._sum.amount || 0,
        byType: revenueByType.reduce((acc, item) => {
          acc[item.type] = {
            count: item._count.id,
            revenue: item._sum.amount || 0
          }
          return acc
        }, {} as Record<string, { count: number, revenue: number }>)
      },
      hpi: {
        total: hpiStats._count.id || 0
      }
    })
    
  } catch (error) {
    console.error('Admin analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

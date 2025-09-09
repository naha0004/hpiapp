// Advanced monitoring and analytics for the appeals system
import { prisma } from "./prisma"

interface AnalyticsData {
  totalSubmissions: number
  successRate: number
  averageProcessingTime: number
  popularReasons: Array<{ reason: string; count: number }>
  monthlyTrends: Array<{ month: string; submissions: number; successRate: number }>
  emailDeliveryStats: {
    sent: number
    delivered: number
    bounced: number
    failed: number
  }
  performanceMetrics: {
    avgResponseTime: number
    errorRate: number
    apiCallsPerDay: number
  }
}

export class AppealAnalytics {
  static async getSystemAnalytics(): Promise<AnalyticsData> {
    try {
      console.log('🔍 Starting analytics computation...')
      
      // Get submission statistics
      const totalSubmissions = await prisma.appeal.count()
      console.log(`📊 Total submissions: ${totalSubmissions}`)
      
      const successfulAppeals = await prisma.appeal.count({
        where: { status: 'APPROVED' }
      })
      console.log(`✅ Successful appeals: ${successfulAppeals}`)
      
      const successRate = totalSubmissions > 0 ? 
        (successfulAppeals / totalSubmissions) * 100 : 0
      console.log(`📈 Success rate: ${successRate}%`)
      
      // Get popular reasons
      const reasonStats = await prisma.appeal.groupBy({
        by: ['reason'],
        _count: { reason: true },
        orderBy: { _count: { reason: 'desc' } },
        take: 10
      })
      console.log(`📋 Reason stats: ${reasonStats.length} reasons found`)
      
      const popularReasons = reasonStats.map((stat: any) => ({
        reason: stat.reason,
        count: stat._count.reason
      }))
      
      // Get monthly trends with success rates
      console.log('📅 Computing monthly trends...')
      const monthlyTrends = await this.getMonthlyTrends()
      console.log(`📊 Monthly trends: ${monthlyTrends.length} months`)
      
      // Calculate average processing time
      console.log('⏱️ Computing processing time...')
      const completedAppeals = await prisma.appeal.findMany({
        where: {
          status: { in: ['APPROVED', 'REJECTED'] },
          responseDate: { not: null }
        },
        select: { createdAt: true, responseDate: true }
      })
      console.log(`✅ Completed appeals: ${completedAppeals.length}`)
      
      const averageProcessingTime = this.calculateAverageProcessingTime(completedAppeals)
      console.log(`⏱️ Average processing time: ${averageProcessingTime} days`)
      
      // Get real email delivery stats
      console.log('📧 Getting email stats...')
      const emailDeliveryStats = await this.getEmailDeliveryStats()
      console.log(`📧 Email stats:`, emailDeliveryStats)
      
      // Get performance metrics
      console.log('⚡ Getting performance metrics...')
      const performanceMetrics = await this.getPerformanceMetrics()
      console.log(`⚡ Performance metrics:`, performanceMetrics)

      const result = {
        totalSubmissions,
        successRate,
        averageProcessingTime,
        popularReasons,
        monthlyTrends,
        emailDeliveryStats,
        performanceMetrics
      }
      
      console.log('✅ Analytics computation complete:', result)
      return result
      
    } catch (error) {
      console.error('❌ Analytics error:', error)
      return this.getDefaultAnalytics()
    }
  }
  
  private static async getMonthlyTrends() {
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    
    const monthlySubmissions = await prisma.appeal.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo }
      },
      select: { createdAt: true, status: true }
    })
    
    // Process monthly trends with success rates
    const monthlyData = new Map<string, { total: number; approved: number }>()
    
    monthlySubmissions.forEach(submission => {
      const monthKey = submission.createdAt.toISOString().slice(0, 7) // YYYY-MM
      const current = monthlyData.get(monthKey) || { total: 0, approved: 0 }
      current.total++
      if (submission.status === 'APPROVED') {
        current.approved++
      }
      monthlyData.set(monthKey, current)
    })
    
    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        submissions: data.total,
        successRate: data.total > 0 ? (data.approved / data.total) * 100 : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }
  
  private static calculateAverageProcessingTime(appeals: Array<{ createdAt: Date; responseDate: Date | null }>) {
    if (appeals.length === 0) return 0
    
    const totalDays = appeals.reduce((sum, appeal) => {
      if (!appeal.responseDate) return sum
      const diffTime = appeal.responseDate.getTime() - appeal.createdAt.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      return sum + diffDays
    }, 0)
    
    return Math.round(totalDays / appeals.length)
  }
  
  private static async getEmailDeliveryStats() {
    try {
      const stats = await prisma.emailLog.groupBy({
        by: ['status'],
        _count: { status: true }
      })
      
      return {
        sent: stats.find(s => s.status === 'SENT')?._count.status || 0,
        delivered: stats.find(s => s.status === 'DELIVERED')?._count.status || 0,
        bounced: stats.find(s => s.status === 'BOUNCED')?._count.status || 0,
        failed: stats.find(s => s.status === 'FAILED')?._count.status || 0
      }
    } catch (error) {
      // Return default stats if no email logs exist yet
      return { sent: 0, delivered: 0, bounced: 0, failed: 0 }
    }
  }
  
  private static async getPerformanceMetrics() {
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    try {
      const [avgResponseTime, totalRequests, errorRequests] = await Promise.all([
        prisma.apiAnalytics.aggregate({
          where: { timestamp: { gte: oneDayAgo } },
          _avg: { responseTime: true }
        }),
        prisma.apiAnalytics.count({
          where: { timestamp: { gte: oneDayAgo } }
        }),
        prisma.apiAnalytics.count({
          where: { 
            timestamp: { gte: oneDayAgo },
            statusCode: { gte: 400 }
          }
        })
      ])
      
      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0
      
      return {
        avgResponseTime: avgResponseTime._avg.responseTime || 0,
        errorRate,
        apiCallsPerDay: totalRequests
      }
    } catch (error) {
      return { avgResponseTime: 0, errorRate: 0, apiCallsPerDay: 0 }
    }
  }
  
  static async trackEmailSubmission(
    submissionId: string, 
    status: 'SENT' | 'DELIVERED' | 'BOUNCED' | 'FAILED', 
    recipient: string = '', 
    subject: string = '',
    provider?: string,
    errorMessage?: string
  ) {
    try {
      await prisma.emailLog.create({
        data: {
          submissionId,
          recipient,
          subject,
          status,
          provider,
          errorMessage,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Email tracking error:', error)
    }
  }
  
  static async trackApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    userAgent?: string,
    ipAddress?: string,
    errorMessage?: string
  ) {
    try {
      await prisma.apiAnalytics.create({
        data: {
          endpoint,
          method,
          statusCode,
          responseTime,
          userId,
          userAgent,
          ipAddress,
          errorMessage,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('API tracking error:', error)
    }
  }
  
  static async trackPerformanceMetric(metric: string, value: number, unit: string, endpoint?: string) {
    try {
      await prisma.performanceMetrics.create({
        data: {
          metric,
          value,
          unit,
          endpoint,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Performance tracking error:', error)
    }
  }
  
  static async logSystemError(
    errorType: string,
    message: string,
    stack?: string,
    endpoint?: string,
    userId?: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
  ) {
    try {
      await prisma.systemErrors.create({
        data: {
          errorType,
          message,
          stack,
          endpoint,
          userId,
          severity,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error logging error:', error)
    }
  }
  
  static async getSystemHealthStats() {
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    try {
      const [
        totalErrors,
        criticalErrors,
        avgResponseTime,
        totalRequests,
        errorRequests
      ] = await Promise.all([
        prisma.systemErrors.count({
          where: { timestamp: { gte: oneDayAgo } }
        }),
        prisma.systemErrors.count({
          where: { 
            timestamp: { gte: oneDayAgo },
            severity: 'CRITICAL'
          }
        }),
        prisma.apiAnalytics.aggregate({
          where: { timestamp: { gte: oneDayAgo } },
          _avg: { responseTime: true }
        }),
        prisma.apiAnalytics.count({
          where: { timestamp: { gte: oneDayAgo } }
        }),
        prisma.apiAnalytics.count({
          where: { 
            timestamp: { gte: oneDayAgo },
            statusCode: { gte: 400 }
          }
        })
      ])

      return {
        totalErrors,
        criticalErrors,
        avgResponseTime: avgResponseTime._avg.responseTime || 0,
        totalRequests,
        errorRate: totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0,
        status: criticalErrors > 0 ? 'CRITICAL' : totalErrors > 10 ? 'WARNING' : 'HEALTHY'
      }
    } catch (error) {
      console.error('Health stats error:', error)
      return {
        totalErrors: 0,
        criticalErrors: 0,
        avgResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        status: 'UNKNOWN'
      }
    }
  }
  
  static async getDetailedEmailStats() {
    try {
      const last30Days = new Date()
      last30Days.setDate(last30Days.getDate() - 30)
      
      const [emailsByDay, emailsByStatus, retryStats] = await Promise.all([
        prisma.emailLog.groupBy({
          by: ['createdAt'],
          where: { createdAt: { gte: last30Days } },
          _count: { id: true },
          orderBy: { createdAt: 'asc' }
        }),
        prisma.emailLog.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.emailLog.aggregate({
          _avg: { retryCount: true },
          _max: { retryCount: true }
        })
      ])
      
      return {
        dailyStats: emailsByDay,
        statusBreakdown: emailsByStatus,
        avgRetries: retryStats._avg.retryCount || 0,
        maxRetries: retryStats._max.retryCount || 0
      }
    } catch (error) {
      console.error('Detailed email stats error:', error)
      return {
        dailyStats: [],
        statusBreakdown: [],
        avgRetries: 0,
        maxRetries: 0
      }
    }
  }
  
  private static getDefaultAnalytics(): AnalyticsData {
    return {
      totalSubmissions: 0,
      successRate: 0,
      averageProcessingTime: 0,
      popularReasons: [],
      monthlyTrends: [],
      emailDeliveryStats: { sent: 0, delivered: 0, bounced: 0, failed: 0 },
      performanceMetrics: { avgResponseTime: 0, errorRate: 0, apiCallsPerDay: 0 }
    }
  }
}

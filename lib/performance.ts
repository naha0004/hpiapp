// Performance optimizations for the appeals system
import { NextRequest } from "next/server"
import NodeCache from "node-cache"

// Cache configuration
const cache = new NodeCache({ 
  stdTTL: 600, // 10 minutes default
  checkperiod: 120 // Check for expired keys every 2 minutes
})

// Cache keys
const CACHE_KEYS = {
  USER_APPEALS: (userId: string) => `user_appeals_${userId}`,
  SYSTEM_ANALYTICS: 'system_analytics',
  USER_PROFILE: (userId: string) => `user_profile_${userId}`,
  VEHICLE_DATA: (registration: string) => `vehicle_data_${registration}`,
  PDF_TEMPLATE: (type: string) => `pdf_template_${type}`
}

export class PerformanceOptimizer {
  // Cache management
  static setCache(key: string, data: any, ttl?: number): void {
    cache.set(key, data, ttl || 600)
  }
  
  static getCache<T>(key: string): T | undefined {
    return cache.get<T>(key)
  }
  
  static deleteCache(key: string): boolean {
    return cache.del(key)
  }
  
  static flushCache(): void {
    cache.flushAll()
  }
  
  // Database query optimization
  static async getUserAppealsOptimized(userId: string) {
    const cacheKey = CACHE_KEYS.USER_APPEALS(userId)
    const cached = this.getCache(cacheKey)
    
    if (cached) return cached
    
    // Optimized query with selective fields and includes
    const appeals = await prisma.appeal.findMany({
      where: { userId },
      select: {
        id: true,
        ticketNumber: true,
        fineAmount: true,
        status: true,
        reason: true,
        issueDate: true,
        createdAt: true,
        // Only include essential vehicle data
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit results
    })
    
    this.setCache(cacheKey, appeals, 300) // Cache for 5 minutes
    return appeals
  }
  
  // API response compression
  static compressApiResponse(data: any): any {
    // Remove unnecessary fields
    const compressed = JSON.parse(JSON.stringify(data, (key, value) => {
      // Remove null/undefined values
      if (value === null || value === undefined) return undefined
      
      // Compress large text fields
      if (typeof value === 'string' && value.length > 1000) {
        return value.substring(0, 1000) + '...'
      }
      
      return value
    }))
    
    return compressed
  }
  
  // Lazy loading for forms
  static async loadFormDataLazily(appealId: string) {
    const cacheKey = `form_data_${appealId}`
    const cached = this.getCache(cacheKey)
    
    if (cached) return cached
    
    const formData = await prisma.appeal.findUnique({
      where: { id: appealId },
      select: {
        te7Form: true,
        te9Form: true,
        evidence: true,
        selectedForms: true
      }
    })
    
    this.setCache(cacheKey, formData, 1800) // Cache for 30 minutes
    return formData
  }
  
  // Batch processing for multiple operations
  static async batchUpdateAppeals(updates: Array<{ id: string; data: any }>) {
    const transaction = await prisma.$transaction(
      updates.map(update => 
        prisma.appeal.update({
          where: { id: update.id },
          data: update.data
        })
      )
    )
    
    // Clear related caches
    updates.forEach(update => {
      this.deleteCache(`appeal_${update.id}`)
    })
    
    return transaction
  }
  
  // Connection pooling optimization
  static async optimizeDbConnections() {
    // Configure Prisma connection pooling
    return prisma.$connect()
  }
  
  // Request debouncing
  private static debounceTimers = new Map<string, NodeJS.Timeout>()
  
  static debounceRequest(key: string, fn: Function, delay: number = 300) {
    const existing = this.debounceTimers.get(key)
    if (existing) {
      clearTimeout(existing)
    }
    
    const timer = setTimeout(() => {
      fn()
      this.debounceTimers.delete(key)
    }, delay)
    
    this.debounceTimers.set(key, timer)
  }
  
  // Memory usage monitoring
  static getMemoryUsage() {
    const usage = process.memoryUsage()
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      cacheSize: cache.keys().length,
      cacheStats: cache.getStats()
    }
  }
  
  // PDF generation optimization
  static async optimizePdfGeneration(userData: any) {
    // Check if PDF already exists
    const pdfCacheKey = `pdf_${userData.pcn_number}_${JSON.stringify(userData).slice(0, 50)}`
    const cachedPdf = this.getCache(pdfCacheKey)
    
    if (cachedPdf) return cachedPdf
    
    // Generate PDF with optimization
    const pdfResult = await this.generatePdfOptimized(userData)
    
    // Cache the result
    this.setCache(pdfCacheKey, pdfResult, 3600) // Cache for 1 hour
    
    return pdfResult
  }
  
  private static async generatePdfOptimized(userData: any) {
    // Implement optimized PDF generation
    // This would call your existing pdf_generator.py with optimizations
    return { success: true, paths: [] }
  }
}

// Middleware for performance monitoring
export function performanceMiddleware(req: NextRequest) {
  const startTime = Date.now()
  
  return {
    measureTime: () => Date.now() - startTime,
    logPerformance: (endpoint: string) => {
      const duration = Date.now() - startTime
      console.log(`[PERF] ${endpoint}: ${duration}ms`)
      
      // Store performance metrics
      PerformanceOptimizer.setCache(
        `perf_${endpoint}_${Date.now()}`, 
        { endpoint, duration, timestamp: new Date() },
        3600
      )
    }
  }
}

export { PerformanceOptimizer }

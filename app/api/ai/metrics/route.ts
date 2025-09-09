import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Try to read persisted metrics
    try {
      const rows: any = await prisma.$queryRaw`SELECT * FROM ModelMetrics WHERE id = 'current' LIMIT 1`
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json({ metrics: rows[0] })
      }
    } catch (err) {
      // ignore if table missing
    }

    // Fallback – no persisted metrics yet
    return NextResponse.json({
      metrics: {
        id: 'current',
        totalCases: 0,
        successfulAppeals: 0,
        averageSuccessRate: 0,
        commonSuccessFactors: [],
        averageFineReduction: 0,
        typicalProcessingTime: 28,
        confidenceScore: 0,
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Get some basic stats
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.appeal.count(),
      prisma.hPICheck.count(),
      prisma.payment.count(),
    ])

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      stats: {
        users: stats[0],
        vehicles: stats[1],
        appeals: stats[2],
        hpiChecks: stats[3],
        payments: stats[4],
      },
      environment: process.env.NODE_ENV || "development",
    })

  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

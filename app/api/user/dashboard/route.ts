import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscriptionType: true,
        subscriptionStart: true,
        subscriptionEnd: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get appeals statistics
    const appealsStats = await prisma.appeal.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true }
    })

    const appeals = {
      total: appealsStats.reduce((sum: number, stat: any) => sum + stat._count.status, 0),
      pending: appealsStats.find((stat: any) => stat.status === 'SUBMITTED')?._count?.status || 0,
      approved: appealsStats.find((stat: any) => stat.status === 'APPROVED')?._count?.status || 0,
      rejected: appealsStats.find((stat: any) => stat.status === 'REJECTED')?._count?.status || 0,
      recent: await prisma.appeal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          ticketNumber: true,
          status: true,
          fineAmount: true,
          createdAt: true,
          updatedAt: true,
        }
      })
    }

    // Get vehicles count and recent vehicles
    const vehiclesCount = await prisma.vehicle.count({
      where: { userId }
    })

    const recentVehicles = await prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        registration: true,
        make: true,
        model: true,
        year: true,
        createdAt: true,
      }
    })

    // Get HPI checks count and recent checks
    const hpiChecksCount = await prisma.hPICheck.count({
      where: { userId }
    })

    const recentHpiChecks = await prisma.hPICheck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        status: true,
        cost: true,
        createdAt: true,
        vehicle: {
          select: {
            registration: true,
            make: true,
            model: true,
          }
        }
      }
    })

    // Calculate total savings (sum of approved appeal amounts)
    const approvedAppeals = await prisma.appeal.findMany({
      where: { 
        userId,
        status: 'APPROVED'
      },
      select: {
        fineAmount: true,
      }
    })

    const totalSaved = approvedAppeals.reduce((sum: number, appeal: any) => {
      return sum + (appeal.fineAmount || 0)
    }, 0)

    // Calculate success rate
    const totalDecidedAppeals = appeals.approved + appeals.rejected
    const successRate = totalDecidedAppeals > 0 
      ? Math.round((appeals.approved / totalDecidedAppeals) * 100) 
      : 0

    const dashboardData = {
      user: {
        name: user.name || 'User',
        email: user.email,
        createdAt: user.createdAt,
        subscription: user.subscriptionType || 'FREE',
        subscriptionEnd: user.subscriptionEnd,
      },
      appeals,
      vehicles: {
        total: vehiclesCount,
        recent: recentVehicles,
      },
      hpiChecks: {
        total: hpiChecksCount,
        recent: recentHpiChecks,
      },
      stats: {
        totalSaved,
        successRate,
      }
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

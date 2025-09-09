import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// TEMPORARY TEST VERSION - Authentication bypassed for testing
console.log("⚠️  TEST MODE: Admin Users API - Authentication bypassed!")

const getUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  subscriptionType: z.enum(['FREE_TRIAL', 'SINGLE_APPEAL', 'ANNUAL_PLAN']).optional(),
  isActive: z.coerce.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    // SKIP AUTH FOR TESTING
    // await requirePermission(AdminPermission.VIEW_USERS)
    
    const { searchParams } = new URL(request.url)
    const params = getUsersSchema.parse(Object.fromEntries(searchParams))
    
    // Build where clause for filtering
    const where: Record<string, unknown> = {}
    
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } }
      ]
    }
    
    if (params.subscriptionType) {
      where.subscriptionType = params.subscriptionType
    }
    
    if (params.isActive !== undefined) {
      where.isActive = params.isActive
    }
    
    // Get total count for pagination
    const total = await prisma.user.count({ where })
    
    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionType: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            appeals: true,
            hpiChecks: true,
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit
    })
    
    // Mask email addresses for privacy
    const maskedUsers = users.map(user => ({
      ...user,
      email: user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null
    }))
    
    return NextResponse.json({
      users: maskedUsers,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit)
      },
      filters: {
        search: params.search,
        subscriptionType: params.subscriptionType,
        isActive: params.isActive
      }
    })
    
  } catch (error) {
    console.error('Admin users API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { requirePermission, AdminPermission } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const getUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  filter: z.enum(['all', 'active', 'inactive', 'trial', 'premium']).default('all'),
  sortBy: z.enum(['createdAt', 'email', 'name', 'subscriptionType']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export async function GET(request: NextRequest) {
  try {
    await requirePermission(AdminPermission.VIEW_USERS)
    
    const { searchParams } = new URL(request.url)
    const params = getUsersSchema.parse(Object.fromEntries(searchParams))
    
    const skip = (params.page - 1) * params.limit
    
    // Build where clause for filtering
    const where: Record<string, unknown> = {}
    
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { vehicles: { some: { registration: { contains: params.search, mode: 'insensitive' } } } }
      ]
    }
    
    if (params.filter === 'active') {
      where.isActive = true
    } else if (params.filter === 'inactive') {
      where.isActive = false
    } else if (params.filter === 'trial') {
      where.subscriptionType = 'FREE_TRIAL'
    } else if (params.filter === 'premium') {
      where.subscriptionType = { not: 'FREE_TRIAL' }
    }
    
    // Get users with related data
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        include: {
          _count: {
            select: {
              appeals: true,
              hpiChecks: true,
              payments: true,
              vehicles: true
            }
          },
          vehicles: {
            select: {
              id: true,
              registration: true,
              make: true,
              model: true,
              year: true
            }
          },
          appeals: {
            select: {
              id: true,
              status: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      }),
      prisma.user.count({ where })
    ])
    
    // Calculate statistics
    const stats = await prisma.user.aggregate({
      _count: { id: true },
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }
    })
    
    return NextResponse.json({
      users: users.map(user => ({
        ...user,
        password: undefined, // Never send password hashes
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / params.limit)
      },
      stats: {
        totalUsers,
        newUsersThisMonth: stats._count.id
      }
    })
    
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update user
const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  subscriptionType: z.enum(['FREE_TRIAL', 'SINGLE_APPEAL', 'ANNUAL_PLAN']).optional(),
})

export async function PUT(request: NextRequest) {
  try {
    await requirePermission(AdminPermission.MANAGE_USERS)
    
    const body = await request.json()
    const data = updateUserSchema.parse(body)
    
    const { id, ...updateData } = data
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            appeals: true,
            hpiChecks: true,
            payments: true,
            vehicles: true
          }
        }
      }
    })
    
    return NextResponse.json({
      ...updatedUser,
      password: undefined
    })
    
  } catch (error) {
    console.error('Admin update user API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete user
export async function DELETE(request: NextRequest) {
  try {
    await requirePermission(AdminPermission.MANAGE_USERS)
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    await prisma.user.delete({
      where: { id: userId }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Admin delete user API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

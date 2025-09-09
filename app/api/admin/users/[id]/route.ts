import { NextRequest, NextResponse } from "next/server"
import { requirePermission, AdminPermission } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  subscriptionType: z.enum(['FREE_TRIAL', 'SINGLE_APPEAL', 'ANNUAL_PLAN']).optional(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(AdminPermission.MANAGE_USERS)
    
    const body = await request.json()
    const updateData = updateUserSchema.parse(body)
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        subscriptionType: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    })
    
  } catch (error) {
    console.error('Admin user update API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(AdminPermission.MANAGE_USERS)
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            appeals: true,
            payments: true,
            hpiChecks: true
          }
        }
      }
    })
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Prevent deletion if user has data
    if (existingUser._count.appeals > 0 || existingUser._count.payments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing appeals or payments. Deactivate instead.' },
        { status: 400 }
      )
    }
    
    // Delete user and related data
    await prisma.$transaction(async (tx) => {
      // Delete HPI checks first
      await tx.hPICheck.deleteMany({
        where: { userId: params.id }
      })
      
      // Delete vehicles
      await tx.vehicle.deleteMany({
        where: { userId: params.id }
      })
      
      // Delete user
      await tx.user.delete({
        where: { id: params.id }
      })
    })
    
    return NextResponse.json({
      message: 'User deleted successfully'
    })
    
  } catch (error) {
    console.error('Admin user deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(AdminPermission.VIEW_USERS)
    
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        appeals: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            createdAt: true,
            fineAmount: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            type: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        hpiChecks: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            vehicle: {
              select: {
                registration: true,
                make: true,
                model: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            appeals: true,
            payments: true,
            hpiChecks: true,
            vehicles: true
          }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      user: {
        ...user,
        email: user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null
      }
    })
    
  } catch (error) {
    console.error('Admin user details API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

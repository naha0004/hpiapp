import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updatePromoCodeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  discountValue: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  applicableFor: z.string().optional(), // "ANNUAL_SUBSCRIPTION", "HPI_CHECK" (comma-separated)
})

// GET /api/admin/promo-codes/[id] - Get single promo code
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { id: params.id },
      include: {
        promoUsages: {
          include: {
            user: {
              select: { email: true, name: true }
            },
            payment: {
              select: { amount: true, finalAmount: true, createdAt: true }
            }
          },
          orderBy: { usedAt: 'desc' }
        }
      }
    })

    if (!promoCode) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 })
    }

    return NextResponse.json({ promoCode })

  } catch (error) {
    console.error('GET promo code error:', error)
    return NextResponse.json({ error: "Failed to fetch promo code" }, { status: 500 })
  }
}

// PUT /api/admin/promo-codes/[id] - Update promo code
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updatePromoCodeSchema.parse(body)

    // Check if promo code exists
    const existingPromoCode = await prisma.promoCode.findUnique({
      where: { id: params.id }
    })

    if (!existingPromoCode) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 })
    }

    // Validate dates if provided
    if (validatedData.validFrom && validatedData.validUntil) {
      const validFrom = new Date(validatedData.validFrom)
      const validUntil = new Date(validatedData.validUntil)

      if (validUntil <= validFrom) {
        return NextResponse.json({ error: "Valid until date must be after valid from date" }, { status: 400 })
      }
    }

    // Validate discount logic
    if (validatedData.discountType === 'PERCENTAGE' && validatedData.discountValue && validatedData.discountValue > 100) {
      return NextResponse.json({ error: "Percentage discount cannot exceed 100%" }, { status: 400 })
    }

    const updateData: any = { ...validatedData }
    
    if (validatedData.validFrom) {
      updateData.validFrom = new Date(validatedData.validFrom)
    }
    
    if (validatedData.validUntil) {
      updateData.validUntil = new Date(validatedData.validUntil)
    }

    const promoCode = await prisma.promoCode.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({ promoCode })

  } catch (error) {
    console.error('Update promo code error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to update promo code" }, { status: 500 })
  }
}

// DELETE /api/admin/promo-codes/[id] - Delete promo code
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if promo code exists and has been used
    const promoCode = await prisma.promoCode.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { promoUsages: true }
        }
      }
    })

    if (!promoCode) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 })
    }

    if (promoCode._count.promoUsages > 0) {
      return NextResponse.json({ 
        error: "Cannot delete promo code that has been used. Deactivate it instead." 
      }, { status: 400 })
    }

    await prisma.promoCode.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Promo code deleted successfully" })

  } catch (error) {
    console.error('Delete promo code error:', error)
    return NextResponse.json({ error: "Failed to delete promo code" }, { status: 500 })
  }
}

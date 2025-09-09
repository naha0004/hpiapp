import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const validatePromoSchema = z.object({
  code: z.string().min(1),
  orderValue: z.number().min(0),
  serviceType: z.enum(["HPI_CHECK", "SINGLE_APPEAL", "BULK_HPI"]),
  quantity: z.number().int().min(1).default(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { code, orderValue, serviceType, quantity } = validatePromoSchema.parse(body)

    // Find the promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: {
          select: { promoUsages: true }
        },
        promoUsages: {
          where: { userId: session.user.id },
          select: { id: true }
        }
      }
    })

    if (!promoCode) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 })
    }

    const now = new Date()
    
    // Check if code is active and within valid dates
    if (!promoCode.isActive) {
      return NextResponse.json({ error: "This promo code is no longer active" }, { status: 400 })
    }

    if (now < promoCode.validFrom) {
      return NextResponse.json({ error: "This promo code is not yet valid" }, { status: 400 })
    }

    if (now > promoCode.validUntil) {
      return NextResponse.json({ error: "This promo code has expired" }, { status: 400 })
    }

    // Check if applicable to service type
    const applicableServices = promoCode.applicableFor.split(',').map((s: string) => s.trim())
    if (!applicableServices.includes('ALL') && !applicableServices.includes(serviceType)) {
      return NextResponse.json({ error: "This promo code is not valid for this service" }, { status: 400 })
    }

    // Check usage limits
    if (promoCode.usageLimit && promoCode._count.promoUsages >= promoCode.usageLimit) {
      return NextResponse.json({ error: "This promo code has reached its usage limit" }, { status: 400 })
    }

    // Check per-user limits
    if (promoCode.perUserLimit && promoCode.promoUsages.length >= promoCode.perUserLimit) {
      return NextResponse.json({ error: "You have already used this promo code the maximum number of times" }, { status: 400 })
    }

    // Check minimum order value
    if (promoCode.minOrderValue && orderValue < promoCode.minOrderValue) {
      return NextResponse.json({ 
        error: `Minimum order value of £${promoCode.minOrderValue} required for this promo code` 
      }, { status: 400 })
    }

    // Calculate discount
    let discountAmount = 0
    
    if (promoCode.discountType === 'PERCENTAGE') {
      discountAmount = (orderValue * promoCode.discountValue) / 100
      
      // Apply maximum discount limit if set
      if (promoCode.maxDiscount && discountAmount > promoCode.maxDiscount) {
        discountAmount = promoCode.maxDiscount
      }
    } else {
      // FIXED_AMOUNT
      discountAmount = promoCode.discountValue
    }

    // Ensure discount doesn't exceed order value
    if (discountAmount > orderValue) {
      discountAmount = orderValue
    }

    const finalAmount = Math.max(0, orderValue - discountAmount)

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        name: promoCode.name,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue
      },
      discount: {
        amount: discountAmount,
        originalAmount: orderValue,
        finalAmount,
        savings: discountAmount
      }
    })

  } catch (error) {
    console.error('Validate promo code error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 })
  }
}

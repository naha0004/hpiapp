import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const promoCodeSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/, "Code must only contain uppercase letters, numbers, underscores and hyphens"),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().min(0),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  applicableFor: z.string().default("HPI_CHECK,ANNUAL_SUBSCRIPTION"), // "ANNUAL_SUBSCRIPTION", "HPI_CHECK" (comma-separated)
})

// GET /api/admin/promo-codes - List all promo codes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const isActive = searchParams.get('active')
    
    const where = {
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ]
      }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
    }

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        include: {
          _count: {
            select: { promoUsages: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.promoCode.count({ where })
    ])

    return NextResponse.json({
      promoCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('GET promo codes error:', error)
    return NextResponse.json({ error: "Failed to fetch promo codes" }, { status: 500 })
  }
}

// POST /api/admin/promo-codes - Create new promo code
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = promoCodeSchema.parse(body)

    // Check if code already exists
    const existingCode = await prisma.promoCode.findUnique({
      where: { code: validatedData.code }
    })

    if (existingCode) {
      return NextResponse.json({ error: "Promo code already exists" }, { status: 400 })
    }

    // Validate dates
    const validFrom = new Date(validatedData.validFrom)
    const validUntil = new Date(validatedData.validUntil)

    if (validUntil <= validFrom) {
      return NextResponse.json({ error: "Valid until date must be after valid from date" }, { status: 400 })
    }

    // Validate discount logic
    if (validatedData.discountType === 'PERCENTAGE' && validatedData.discountValue > 100) {
      return NextResponse.json({ error: "Percentage discount cannot exceed 100%" }, { status: 400 })
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        ...validatedData,
        validFrom,
        validUntil,
        createdBy: session.user.id!,
      }
    })

    return NextResponse.json({ promoCode }, { status: 201 })

  } catch (error) {
    console.error('Create promo code error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to create promo code" }, { status: 500 })
  }
}

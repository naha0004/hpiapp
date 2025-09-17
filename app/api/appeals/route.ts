import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const appealSchema = z.object({
  vehicleId: z.string().optional(),
  ticketNumber: z.string().min(1, "Ticket number is required"),
  fineAmount: z.number().positive("Fine amount must be positive"),
  issueDate: z.string().transform((str) => new Date(str)),
  dueDate: z.string().transform((str) => new Date(str)),
  location: z.string().min(1, "Location is required"),
  reason: z.string().min(1, "Reason is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  evidence: z.array(z.string()).optional(),
  te7Form: z.object({
    witnessName: z.string(),
    witnessAddress: z.string(),
    witnessPhone: z.string(),
    witnessEmail: z.string(),
    relationshipToDriver: z.string(),
    statementDate: z.string(),
    witnessStatement: z.string(),
    witnessSignature: z.string().optional(),
  }).optional(),
  te9Form: z.object({
    declarantName: z.string(),
    declarantAddress: z.string(),
    declarantPhone: z.string(),
    declarantEmail: z.string(),
    declarationDate: z.string(),
    declarationType: z.enum(["not_driver", "not_received", "other"]),
    declarationStatement: z.string(),
    declarantSignature: z.string().optional(),
    witnessName: z.string().optional(),
    witnessAddress: z.string().optional(),
  }).optional(),
  selectedForms: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const appealData = appealSchema.parse(body)

    // Check user's subscription and appeal limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        appeals: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check subscription limits
    const appealCount = user.appeals.length
    const subscriptionEnd = user.subscriptionEnd

    if (user.subscriptionType === "FREE_TRIAL") {
      if (appealCount >= 1) {
        return NextResponse.json(
          { error: "Free trial allows only 1 appeal. Please upgrade your plan." },
          { status: 403 }
        )
      }
      if (subscriptionEnd && new Date() > subscriptionEnd) {
        return NextResponse.json(
          { error: "Free trial has expired. Please upgrade your plan." },
          { status: 403 }
        )
      }
    } else if (user.subscriptionType === "SINGLE_APPEAL") {
      if (appealCount >= 1) {
        return NextResponse.json(
          { error: "Single appeal plan allows only 1 appeal. Please purchase another single appeal or upgrade to annual plan." },
          { status: 403 }
        )
      }
    }
    // ANNUAL_PLAN has unlimited appeals

    // Create the appeal
    const appeal = await prisma.appeal.create({
      data: {
        ...appealData,
        userId: session.user.id,
        evidence: appealData.evidence ? JSON.stringify(appealData.evidence) : null,
        te7Form: appealData.te7Form ? JSON.stringify(appealData.te7Form) : null,
        te9Form: appealData.te9Form ? JSON.stringify(appealData.te9Form) : null,
        selectedForms: appealData.selectedForms ? JSON.stringify(appealData.selectedForms) : null,
      },
      include: {
        vehicle: true,
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      message: "Appeal submitted successfully",
      appeal
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Appeal submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const appeals = await prisma.appeal.findMany({
      where: { userId: session.user.id },
      include: {
        vehicle: true,
      },
      orderBy: { createdAt: "desc" }
    })

    // Parse JSON fields for each appeal
    const appealsWithParsedData = appeals.map((appeal: any) => ({
      ...appeal,
      evidence: appeal.evidence ? JSON.parse(appeal.evidence) : null,
      te7Form: appeal.te7Form ? JSON.parse(appeal.te7Form) : null,
      te9Form: appeal.te9Form ? JSON.parse(appeal.te9Form) : null,
      selectedForms: appeal.selectedForms ? JSON.parse(appeal.selectedForms) : null,
    }))

    return NextResponse.json({ appeals: appealsWithParsedData })

  } catch (error) {
    console.error("Fetch appeals error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

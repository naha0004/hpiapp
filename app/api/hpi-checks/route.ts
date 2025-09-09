import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { runOneAutoSandboxHpiCheck } from "@/lib/oneauto"

const hpiCheckSchema = z.object({
  registration: z.string().min(1, "Vehicle registration is required"),
  vehicleId: z.string().optional(),
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
    const { registration, vehicleId } = hpiCheckSchema.parse(body)

    // Check if user has HPI credits
    const user = await (prisma as any).user.findUnique({
      where: { id: session.user.id },
      select: {
        hpiCredits: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (user.hpiCredits < 1) {
      return NextResponse.json(
        { error: "Insufficient HPI credits. Please purchase HPI credits to perform this check." },
        { status: 400 }
      )
    }

    // Consume 1 HPI credit
    await (prisma as any).user.update({
      where: { id: session.user.id },
      data: {
        hpiCredits: {
          decrement: 1
        }
      }
    })

    console.log(`HPI Check - Consumed 1 credit for user ${session.user.id}, remaining: ${user.hpiCredits - 1}`)

    // Create HPI check request
    const hpiCheck = await prisma.hPICheck.create({
      data: {
        userId: session.user.id,
        vehicleId,
        registration: registration.toUpperCase(),
        status: "PENDING",
        cost: 5.00,
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

    // Call OneAutoAPI sandbox in background to populate results
    ;(async () => {
      try {
        const result = await runOneAutoSandboxHpiCheck(registration)
        await prisma.hPICheck.update({
          where: { id: hpiCheck.id },
          data: {
            status: "COMPLETED",
            completedDate: new Date(),
            results: {
              registration: registration.toUpperCase(),
              ...result,
            } as any,
          }
        })
      } catch (error) {
        console.error("OneAuto HPI check error:", error)
        await prisma.hPICheck.update({
          where: { id: hpiCheck.id },
          data: {
            status: "FAILED",
            completedDate: new Date(),
            results: { error: error instanceof Error ? error.message : 'Unknown error' } as any,
          }
        })
      }
    })()

    return NextResponse.json({
      message: "HPI check requested successfully",
      hpiCheck
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("HPI check request error:", error)
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

    const hpiChecks = await prisma.hPICheck.findMany({
      where: { userId: session.user.id },
      include: {
        vehicle: true,
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ hpiChecks })

  } catch (error) {
    console.error("Fetch HPI checks error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

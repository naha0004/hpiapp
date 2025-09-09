import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const vehicleSchema = z.object({
  registration: z.string().min(1, "Registration is required"),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  color: z.string().optional(),
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
    const vehicleData = vehicleSchema.parse(body)

    // Check if vehicle already exists for this user
    const existingVehicle = await prisma.vehicle.findUnique({
      where: {
        userId_registration: {
          userId: session.user.id,
          registration: vehicleData.registration.toUpperCase(),
        }
      }
    })

    if (existingVehicle) {
      return NextResponse.json(
        { error: "Vehicle with this registration already exists" },
        { status: 400 }
      )
    }

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        ...vehicleData,
        registration: vehicleData.registration.toUpperCase(),
        userId: session.user.id,
      }
    })

    return NextResponse.json({
      message: "Vehicle added successfully",
      vehicle
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Vehicle creation error:", error)
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

    const vehicles = await prisma.vehicle.findMany({
      where: { userId: session.user.id },
      include: {
        appeals: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        hpiChecks: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ vehicles })

  } catch (error) {
    console.error("Fetch vehicles error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

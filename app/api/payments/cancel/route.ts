import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const cancelSchema = z.object({
  paymentId: z.string(),
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
    const { paymentId } = cancelSchema.parse(body)

    // Update payment record to cancelled
    await prisma.payment.update({
      where: { 
        id: paymentId,
        userId: session.user.id 
      },
      data: { 
        status: "FAILED" // Using FAILED status for cancelled payments
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Payment cancellation error:", error)
    
    return NextResponse.json(
      { error: "Failed to cancel payment" },
      { status: 500 }
    )
  }
}

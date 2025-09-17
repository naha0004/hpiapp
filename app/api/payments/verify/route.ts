import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"
import { z } from "zod"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
})

const verifySchema = z.object({
  sessionId: z.string(),
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
    const { sessionId, paymentId } = verifySchema.parse(body)

    // Verify with Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      )
    }

    // Update payment record and retrieve with quantity
    const payment = await (prisma as any).payment.update({
      where: { 
        id: paymentId,
        userId: session.user.id 
      },
      data: { 
        status: "COMPLETED",
        stripePaymentId: sessionId
      }
    })

    // Add HPI credits if this was an HPI check purchase
    if ((payment.type === 'HPI_CHECK' || payment.type === 'BULK_HPI') && payment.quantity > 0) {
      await (prisma as any).user.update({
        where: { id: session.user.id },
        data: {
          hpiCredits: {
            increment: payment.quantity
          }
        }
      })
      console.log(`Payment verification - Added ${payment.quantity} HPI credits to user ${session.user.id}`)
    }

    return NextResponse.json({
      id: payment.id,
      type: payment.type,
      amount: payment.amount,
      description: payment.description,
      createdAt: payment.createdAt,
      status: payment.status
    })

  } catch (error) {
    console.error("Payment verification error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    )
  }
}

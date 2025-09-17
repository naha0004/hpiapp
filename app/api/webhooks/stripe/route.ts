import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break
      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata.paymentId
  const userId = paymentIntent.metadata.userId
  const type = paymentIntent.metadata.type

  if (!paymentId || !userId) {
    console.error("Missing payment metadata")
    return
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "COMPLETED" }
  })

  // Update user subscription if applicable
  if (type === "ANNUAL_SUBSCRIPTION") {
    const subscriptionEnd = new Date()
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1) // Add 1 year

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: "ANNUAL_PLAN",
        subscriptionStart: new Date(),
        subscriptionEnd,
        isActive: true,
      }
    })
  } else if (type === "SINGLE_APPEAL") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: "SINGLE_APPEAL",
        subscriptionStart: new Date(),
        subscriptionEnd: null,
        isActive: true,
      }
    })
  }

  console.log(`Payment successful for user ${userId}, type: ${type}`)
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata.paymentId

  if (!paymentId) {
    console.error("Missing payment metadata")
    return
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "FAILED" }
  })

  console.log(`Payment failed for payment ${paymentId}`)
}

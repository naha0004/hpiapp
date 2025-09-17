import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"
import { z } from "zod"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
})

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute per user (more reasonable for testing)

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false // Rate limit exceeded
  }
  
  userLimit.count++
  return true
}

// Function to clear rate limit for a user (useful for development/testing)
function clearRateLimit(userId: string) {
  rateLimitMap.delete(userId)
}

// Clear all rate limits (for testing)
function clearAllRateLimits() {
  rateLimitMap.clear()
}

const paymentSchema = z.object({
  type: z.enum(["SINGLE_APPEAL", "HPI_CHECK", "BULK_HPI"]),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().min(1).default(1),
  promoCode: z.string().optional(),
})

// Dynamic pricing configuration
const PRICING_CONFIG = {
  SINGLE_APPEAL: { amount: 2, description: "Single Appeal", name: "Single Appeal" },
  HPI_CHECK: { amount: 5, description: "HPI Check", name: "HPI Check" },
  BULK_HPI: { amount: 5, description: "HPI Check (per vehicle)", name: "Bulk HPI Check" }
} as const

// Dynamic pricing function - allows for future discounts, promotions, etc.
function calculatePrice(
  type: keyof typeof PRICING_CONFIG, 
  quantity: number = 1,
  userId?: string,
  promoCode?: any
): {
  originalAmount: number
  finalAmount: number
  discount?: {
    type: string
    amount: number
    description: string
  }
} {
  const config = PRICING_CONFIG[type]
  const originalAmount = config.amount * quantity
  let finalAmount = originalAmount
  let discount = undefined

  // Apply promo code discount if provided
  if (promoCode) {
    let promoDiscountAmount = 0
    
    if (promoCode.discountType === 'PERCENTAGE') {
      promoDiscountAmount = (finalAmount * promoCode.discountValue) / 100
      if (promoCode.maxDiscount && promoDiscountAmount > promoCode.maxDiscount) {
        promoDiscountAmount = promoCode.maxDiscount
      }
    } else {
      promoDiscountAmount = promoCode.discountValue
    }

    // Ensure discount doesn't exceed final amount
    if (promoDiscountAmount > finalAmount) {
      promoDiscountAmount = finalAmount
    }

    finalAmount = Math.max(0, originalAmount - promoDiscountAmount)
    
    discount = {
      type: "promo",
      amount: promoDiscountAmount,
      description: `${promoCode.code} promo code`
    }
  }

  return {
    originalAmount,
    finalAmount,
    discount
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Payment API - Session:', session?.user?.id ? 'Valid session' : 'No session')
    
    if (!session?.user?.id) {
      console.log('Payment API - Unauthorized: No valid session')
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check rate limit - DISABLED FOR TESTING
    // if (!checkRateLimit(session.user.id)) {
    //   console.log('Payment API - Rate limit exceeded for user:', session.user.id)
    //   return NextResponse.json(
    //     { error: "Too many payment attempts. Please wait a moment before trying again." },
    //     { status: 429 }
    //   )
    // }

    const body = await request.json()
    const { type, description, quantity, promoCode } = paymentSchema.parse(body)
    const config = PRICING_CONFIG[type]
    
    // Validate and fetch promo code if provided
    let validatedPromoCode = null
    if (promoCode) {
      try {
        const promoResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/promo-codes/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code: promoCode, 
            userId: session.user.id, 
            paymentType: type 
          })
        })
        
        if (promoResponse.ok) {
          const promoData = await promoResponse.json()
          validatedPromoCode = promoData.promoCode
        }
      } catch (error) {
        console.log('Failed to validate promo code:', error)
      }
    }
    
    const pricing = calculatePrice(type, quantity, session.user.id, validatedPromoCode)
    const amount = pricing.finalAmount

    console.log('Payment API - Creating payment for user:', session.user.id, 'Type:', type, 'Amount:', amount)
    if (pricing.discount) {
      console.log('Payment API - Discount applied:', pricing.discount)
    }

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: pricing.originalAmount,
        finalAmount: pricing.finalAmount,
        type: type as any, // Cast to avoid type issue
        description,
        currency: "GBP",
        status: "PENDING",
        quantity,
        discountAmount: pricing.discount?.amount || 0,
        promoCodeUsed: validatedPromoCode?.code || null,
      } as any // Cast the entire data object to avoid type conflicts
    })

    console.log('Payment API - Payment record created:', payment.id)

    // Create promo usage record if promo code was used
    if (validatedPromoCode) {
      try {
        await (prisma as any).promoUsage.create({
          data: {
            userId: session.user.id,
            paymentId: payment.id,
            promoCodeId: validatedPromoCode.id,
            discountApplied: pricing.discount?.amount || 0,
          }
        })
        console.log('Payment API - Promo usage recorded for code:', validatedPromoCode.code)
      } catch (error) {
        console.error('Payment API - Failed to create promo usage record:', error)
      }
    }

    // Create Stripe Checkout Session with dynamic pricing
    console.log('Payment API - Creating Stripe checkout session with dynamic pricing for:', config.name)
    
    const productName = pricing.discount 
      ? `${config.name} (${pricing.discount.description})`
      : config.name
    
    const productDescription = pricing.discount
      ? `${config.description} - Save £${pricing.discount.amount}! Original price £${pricing.originalAmount}`
      : config.description
    
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: productName,
              description: productDescription,
              metadata: {
                service_type: type,
                original_amount: pricing.originalAmount.toString(),
                final_amount: pricing.finalAmount.toString(),
                discount_type: pricing.discount?.type || 'none',
                discount_amount: pricing.discount?.amount?.toString() || '0',
                created_at: new Date().toISOString()
              }
            },
            unit_amount: amount * 100, // Stripe uses pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&payment_id=${payment.id}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payment-cancelled?payment_id=${payment.id}`,
      metadata: {
        paymentId: payment.id,
        userId: session.user.id,
        type: type,
        service: config.name
      },
      customer_email: session.user.email || undefined,
      billing_address_collection: 'auto', // Collect billing address
      payment_intent_data: {
        metadata: {
          service_type: type,
          user_id: session.user.id
        }
      }
    })

    console.log('Payment API - Stripe checkout session created:', checkoutSession.id)
    console.log('Payment API - Checkout URL:', checkoutSession.url)

    // Update payment record with Stripe session ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripePaymentId: checkoutSession.id }
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      paymentId: payment.id
    })

  } catch (error) {
    console.error("Payment creation error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve current pricing
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const serviceType = url.searchParams.get('type') as keyof typeof PRICING_CONFIG
    const quantity = parseInt(url.searchParams.get('quantity') || '1')
    const promoCode = url.searchParams.get('promoCode')

    if (serviceType && PRICING_CONFIG[serviceType]) {
      // Validate promo code if provided
      let validatedPromoCode = null
      if (promoCode) {
        try {
          const promoResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/promo-codes/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              code: promoCode, 
              userId: session.user.id, 
              paymentType: serviceType 
            })
          })
          
          if (promoResponse.ok) {
            const promoData = await promoResponse.json()
            validatedPromoCode = promoData.promoCode
          }
        } catch (error) {
          console.log('Failed to validate promo code in GET:', error)
        }
      }

      // Get pricing for specific service
      const config = PRICING_CONFIG[serviceType]
      const pricing = calculatePrice(serviceType, quantity, session.user.id, validatedPromoCode)
      
      return NextResponse.json({
        service: serviceType,
        name: config.name,
        description: config.description,
        originalAmount: pricing.originalAmount,
        finalAmount: pricing.finalAmount,
        discount: pricing.discount
      })
    } else {
      // Get all pricing
      const allPricing = Object.entries(PRICING_CONFIG).map(([key, config]) => {
        const pricing = calculatePrice(key as keyof typeof PRICING_CONFIG, 1, session.user.id)
        return {
          service: key,
          name: config.name,
          description: config.description,
          originalAmount: pricing.originalAmount,
          finalAmount: pricing.finalAmount,
          discount: pricing.discount
        }
      })

      return NextResponse.json({ pricing: allPricing })
    }

  } catch (error) {
    console.error("Pricing retrieval error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve pricing" },
      { status: 500 }
    )
  }
}

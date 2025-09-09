import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        payments: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user has active annual subscription
    const hasActiveSubscription = user.subscriptionType === 'ANNUAL_PLAN' && 
                                 user.subscriptionEnd && 
                                 new Date() < user.subscriptionEnd

    return NextResponse.json({
      hasActiveSubscription,
      subscriptionType: user.subscriptionType,
      subscriptionEndsAt: user.subscriptionEnd,
      appealTrialUsed: user.appealTrialUsed,
      appealTrialReg: user.appealTrialReg,
      appealTrialUsedAt: user.appealTrialUsedAt,
      completedPayments: user.payments.length,
      usage: {
        canAccessHPI: hasActiveSubscription || user.payments.some(p => p.type === 'HPI_CHECK'),
        canAccessAppeals: hasActiveSubscription || !user.appealTrialUsed || user.payments.some(p => p.type === 'SINGLE_APPEAL')
      }
    })

  } catch (error) {
    console.error("Usage check error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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
    const { service, data } = body
    
    // Extract registration based on service
    const registration = service === 'hpi' 
      ? data?.registration 
      : service === 'appeal' 
      ? data?.registration 
      : null

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionType: true,
        subscriptionEnd: true,
        isActive: true,
        appealTrialUsed: true,
        appealTrialReg: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check access permissions
    const now = new Date()
    const hasActiveSubscription = user.subscriptionType === 'ANNUAL_PLAN' && 
                                 user.subscriptionEnd && 
                                 user.subscriptionEnd > now && 
                                 user.isActive

    if (service === 'appeal') {
      // For appeals: check if user has active subscription or unused trial
      if (hasActiveSubscription) {
        return NextResponse.json({ 
          access: 'granted', 
          reason: 'active_subscription' 
        })
      }
      
      if (!user.appealTrialUsed) {
        // Use trial for this registration
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            appealTrialUsed: true,
            appealTrialUsedAt: new Date(),
            appealTrialReg: registration
          }
        })
        
        return NextResponse.json({ 
          access: 'granted', 
          reason: 'trial_used',
          message: 'Trial used for this vehicle registration'
        })
      }
      
      // No subscription and trial used
      return NextResponse.json({ 
        access: 'denied', 
        reason: 'payment_required',
        trialUsedFor: user.appealTrialReg,
        message: 'Payment required. Trial was used for another registration.'
      })
    }
    
    if (service === 'hpi') {
      // HPI checks always require payment (£5 each)
      if (hasActiveSubscription) {
        return NextResponse.json({ 
          access: 'granted', 
          reason: 'active_subscription' 
        })
      }
      
      return NextResponse.json({ 
        access: 'denied', 
        reason: 'payment_required',
        message: 'HPI checks require payment (£5) or annual subscription'
      })
    }

    return NextResponse.json(
      { error: "Invalid service type" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Access check error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

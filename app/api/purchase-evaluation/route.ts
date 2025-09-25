import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface PurchaseEvaluationRequest {
  registration: string
  askingPrice: number
  currentMileage: number
  condition?: 'excellent' | 'good' | 'fair' | 'poor'
}

interface MOTAdvisory {
  testDate: string
  advisories: string[]
}

interface PurchaseEvaluationResponse {
  success: boolean
  data?: {
    recommendation: 'excellent_deal' | 'good_deal' | 'fair_deal' | 'poor_deal' | 'avoid'
    score: number // 0-100
    priceAnalysis: {
      askingPrice: number
      estimatedValue: number
      difference: number
      percentageAboveBelow: number
    }
    reasons: string[]
    risks: string[]
    positives: string[]
    marketComparison: {
      percentile: number // Where this price sits in the market (0-100)
      betterThanPercent: number
    }
    negotiationAdvice: {
      suggestedOffer: number
      maxRecommended: number
      negotiationPoints: string[]
    }
    motAnalysis?: {
      hasRecentMOT: boolean
      lastMOTDate: string | null
      recentAdvisories: string[]
      commonIssues: string[]
      upcomingCosts: string[]
      riskFlags: string[]
    }
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: PurchaseEvaluationRequest = await request.json()
    const { registration, askingPrice, currentMileage, condition = 'good' } = body

    if (!registration || !askingPrice || !currentMileage) {
      return NextResponse.json(
        { error: 'Registration, asking price, and mileage are required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Purchase evaluation for: ${registration} at £${askingPrice}`)

    // Get real MOT data from DVSA API
    const { default: DVSAApiService } = await import('@/lib/dvsa-api')
    let motData = null
    
    try {
      console.log('🔍 Fetching real MOT data from DVSA API...')
      const dvsaService = new (DVSAApiService as any)()
      const motResponse = await dvsaService.getMOTHistory(registration.toUpperCase())
      
      if (motResponse.success && motResponse.data?.motHistory) {
        motData = motResponse.data.motHistory
        console.log('✅ MOT data retrieved from DVSA API')
      } else {
        console.log('⚠️ No MOT data available from DVSA API:', motResponse.error)
      }
    } catch (error) {
      console.error('❌ Error fetching MOT data from DVSA API:', error)
    }

    // Get vehicle valuation
    const valuationResponse = await fetch(`${request.nextUrl.origin}/api/vehicle-valuation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        registration,
        mileage: currentMileage,
        condition
      })
    })

    if (!valuationResponse.ok) {
      throw new Error('Failed to get vehicle valuation')
    }

    const valuation = await valuationResponse.json()

    if (!valuation.success || !valuation.data) {
      return NextResponse.json({
        success: false,
        error: 'Could not determine vehicle value'
      })
    }

    const { estimatedValue, marketData } = valuation.data
    const marketValue = estimatedValue.private // Use private sale value as baseline
    
    // Calculate price difference
    const difference = askingPrice - marketValue
    const percentageAboveBelow = Math.round((difference / marketValue) * 100)
    
    // Determine recommendation and score
    const { recommendation, score } = calculateRecommendation(percentageAboveBelow, marketData, valuation.data)
    
    // Generate analysis
    const reasons = generateReasons(percentageAboveBelow, marketData, valuation.data, askingPrice, marketValue)
    const risks = generateRisks(percentageAboveBelow, marketData, valuation.data)
    const positives = generatePositives(percentageAboveBelow, marketData, valuation.data)
    
    // Market position analysis
    const percentile = calculateMarketPercentile(askingPrice, marketData.priceRange)
    const betterThanPercent = 100 - percentile
    
    // Negotiation advice
    const suggestedOffer = Math.round(marketValue * 0.92) // Start 8% below market value
    const maxRecommended = Math.round(marketValue * 1.05) // Don't pay more than 5% above market
    const negotiationPoints = generateNegotiationPoints(valuation.data, percentageAboveBelow, marketData)

    // Analyze MOT data if available
    console.log('📋 Analyzing MOT data...')
    console.log('📋 Raw MOT data:', motData ? `${motData.length} tests available` : 'No MOT data')
    const motAnalysis = motData ? analyzeDVSAMOTData(motData) : undefined
    console.log('📋 MOT Analysis result:', motAnalysis)

    const evaluationResponse: PurchaseEvaluationResponse = {
      success: true,
      data: {
        recommendation,
        score,
        priceAnalysis: {
          askingPrice,
          estimatedValue: marketValue,
          difference,
          percentageAboveBelow
        },
        reasons,
        risks,
        positives,
        marketComparison: {
          percentile,
          betterThanPercent
        },
        negotiationAdvice: {
          suggestedOffer,
          maxRecommended,
          negotiationPoints
        },
        motAnalysis
      }
    }

    return NextResponse.json(evaluationResponse)

  } catch (error) {
    console.error('Purchase evaluation error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// Helper function to analyze real DVSA MOT data
function analyzeDVSAMOTData(motTests: any[]): {
  hasRecentMOT: boolean
  lastMOTDate: string | null
  recentAdvisories: string[]
  commonIssues: string[]
  upcomingCosts: string[]
  riskFlags: string[]
} {
  const motData = {
    hasRecentMOT: false,
    lastMOTDate: null as string | null,
    recentAdvisories: [] as string[],
    commonIssues: [] as string[],
    upcomingCosts: [] as string[],
    riskFlags: [] as string[]
  }

  try {
    if (motTests && motTests.length > 0) {
      // Sort by most recent date first
      const sortedTests = motTests.sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime())
      const latestMOT = sortedTests[0]
      
      motData.hasRecentMOT = true
      motData.lastMOTDate = latestMOT.completedDate

      // Extract advisories from the most recent test
      if (latestMOT.defects && Array.isArray(latestMOT.defects)) {
        const advisories = latestMOT.defects.filter((defect: any) => defect.type === 'ADVISORY')
        motData.recentAdvisories = advisories.map((defect: any) => defect.text)
      }

      // Analyze all tests for patterns
      const allAdvisories: string[] = []
      const allDefects: string[] = []
      
      sortedTests.forEach((test: any) => {
        if (test.defects && Array.isArray(test.defects)) {
          test.defects.forEach((defect: any) => {
            if (defect.type === 'ADVISORY') {
              allAdvisories.push(defect.text)
            } else if (defect.type === 'MINOR' || defect.type === 'MAJOR') {
              allDefects.push(defect.text)
            }
          })
        }
      })

      // Find common issues across tests
      const advisoryTypes = new Map<string, number>()
      allAdvisories.forEach(advisory => {
        const category = categorizeAdvisory(advisory)
        advisoryTypes.set(category, (advisoryTypes.get(category) || 0) + 1)
      })

      // Extract common issues (appearing more than once)
      advisoryTypes.forEach((count, category) => {
        if (count > 1) {
          motData.commonIssues.push(category)
        }
      })

      // Predict upcoming costs based on recent advisories
      motData.recentAdvisories.forEach(advisory => {
        const cost = predictCostFromAdvisory(advisory)
        if (cost) {
          motData.upcomingCosts.push(cost)
        }
      })

      // Generate risk flags
      motData.recentAdvisories.forEach(advisory => {
        const risk = assessAdvisoryRisk(advisory)
        if (risk) {
          motData.riskFlags.push(risk)
        }
      })

      // Check for dangerous or major defects in recent tests
      latestMOT.defects?.forEach((defect: any) => {
        if (defect.type === 'DANGEROUS') {
          motData.riskFlags.push(`DANGEROUS: ${defect.text}`)
        } else if (defect.type === 'MAJOR') {
          motData.riskFlags.push(`MAJOR DEFECT: ${defect.text}`)
        }
      })

      // Check MOT expiry
      if (latestMOT.expiryDate) {
        const expiryDate = new Date(latestMOT.expiryDate)
        const now = new Date()
        const monthsUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000))
        
        if (monthsUntilExpiry <= 2) {
          motData.riskFlags.push('MOT expires soon - factor in renewal costs')
          motData.upcomingCosts.push('MOT renewal required within 2 months (£55)')
        } else if (monthsUntilExpiry <= 6) {
          motData.upcomingCosts.push(`MOT renewal due in ${monthsUntilExpiry} months (£55)`)
        }
      }

      // Check test result
      if (latestMOT.testResult === 'FAILED') {
        motData.riskFlags.push('Vehicle failed most recent MOT - repairs required')
      }
    }
  } catch (error) {
    console.error('Error analyzing DVSA MOT data:', error)
  }

  return motData
}

// Categorize MOT advisory into general types
function categorizeAdvisory(advisory: string): string {
  const advisory_lower = advisory.toLowerCase()
  
  if (advisory_lower.includes('tyre') || advisory_lower.includes('tire')) {
    return 'Tyre wear issues'
  }
  if (advisory_lower.includes('brake')) {
    return 'Brake system concerns'
  }
  if (advisory_lower.includes('suspension') || advisory_lower.includes('shock')) {
    return 'Suspension problems'
  }
  if (advisory_lower.includes('exhaust')) {
    return 'Exhaust system issues'
  }
  if (advisory_lower.includes('light') || advisory_lower.includes('bulb')) {
    return 'Lighting defects'
  }
  if (advisory_lower.includes('oil') || advisory_lower.includes('fluid')) {
    return 'Fluid leaks'
  }
  if (advisory_lower.includes('rust') || advisory_lower.includes('corrosion')) {
    return 'Corrosion issues'
  }
  
  return 'General maintenance'
}

// Predict potential costs based on advisories
function predictCostFromAdvisory(advisory: string): string | null {
  const advisory_lower = advisory.toLowerCase()
  
  if (advisory_lower.includes('tyre') && advisory_lower.includes('worn')) {
    return 'Tyre replacement needed soon (£300-800 for set)'
  }
  if (advisory_lower.includes('brake') && advisory_lower.includes('disc')) {
    return 'Brake disc replacement may be needed (£200-500)'
  }
  if (advisory_lower.includes('brake') && advisory_lower.includes('pad')) {
    return 'Brake pad replacement due (£100-300)'
  }
  if (advisory_lower.includes('exhaust')) {
    return 'Exhaust system repair/replacement (£150-600)'
  }
  if (advisory_lower.includes('suspension')) {
    return 'Suspension component replacement (£200-800)'
  }
  
  return null
}

// Assess risk level of advisories
function assessAdvisoryRisk(advisory: string): string | null {
  const advisory_lower = advisory.toLowerCase()
  
  if (advisory_lower.includes('close to legal limit')) {
    return 'Safety-critical item near failure - immediate attention required'
  }
  if (advisory_lower.includes('seriously weakened') || advisory_lower.includes('deteriorated')) {
    return 'Component in poor condition - may fail soon'
  }
  if (advisory_lower.includes('brake')) {
    return 'Braking system issue - safety concern'
  }
  if (advisory_lower.includes('steering')) {
    return 'Steering problem - affects vehicle control'
  }
  
  return null
}

function calculateRecommendation(percentageAboveBelow: number, marketData: any, vehicleData: any): { 
  recommendation: 'excellent_deal' | 'good_deal' | 'fair_deal' | 'poor_deal' | 'avoid'
  score: number 
} {
  let score = 50 // Start at neutral
  
  // Price factor (most important)
  if (percentageAboveBelow <= -15) {
    score += 30 // Excellent deal
  } else if (percentageAboveBelow <= -5) {
    score += 20 // Good deal
  } else if (percentageAboveBelow <= 5) {
    score += 10 // Fair deal
  } else if (percentageAboveBelow <= 15) {
    score -= 10 // Poor deal
  } else {
    score -= 30 // Avoid
  }
  
  // Market factors
  if (marketData.demand === 'high') score += 5
  if (marketData.supply === 'low') score += 5
  if (marketData.daysToSell < 30) score += 5
  
  // Clamp score between 0-100
  score = Math.max(0, Math.min(100, score))
  
  // Determine recommendation
  if (score >= 80) return { recommendation: 'excellent_deal', score }
  if (score >= 65) return { recommendation: 'good_deal', score }
  if (score >= 45) return { recommendation: 'fair_deal', score }
  if (score >= 25) return { recommendation: 'poor_deal', score }
  return { recommendation: 'avoid', score }
}

function generateReasons(percentageAboveBelow: number, marketData: any, vehicleData: any, askingPrice: number, marketValue: number): string[] {
  const reasons = []
  
  if (percentageAboveBelow <= -10) {
    reasons.push(`Asking price is ${Math.abs(percentageAboveBelow)}% below market value - excellent value`)
  } else if (percentageAboveBelow <= -5) {
    reasons.push(`Asking price is ${Math.abs(percentageAboveBelow)}% below market value - good deal`)
  } else if (percentageAboveBelow >= 10) {
    reasons.push(`Asking price is ${percentageAboveBelow}% above market value - overpriced`)
  } else if (percentageAboveBelow >= 5) {
    reasons.push(`Asking price is ${percentageAboveBelow}% above market value - slightly high`)
  } else {
    reasons.push('Asking price is close to market value')
  }
  
  if (marketData.demand === 'high') {
    reasons.push('High demand for this make/model - prices may be firm')
  }
  
  if (marketData.supply === 'low') {
    reasons.push('Limited supply in the market - fewer alternatives available')
  }
  
  if (marketData.daysToSell < 30) {
    reasons.push('This type of vehicle typically sells quickly')
  }
  
  return reasons
}

function generateRisks(percentageAboveBelow: number, marketData: any, vehicleData: any): string[] {
  const risks = []
  
  if (percentageAboveBelow > 15) {
    risks.push('Significantly overpriced - poor investment potential')
    risks.push('Difficulty selling in future due to high purchase price')
  } else if (percentageAboveBelow > 5) {
    risks.push('Paying above market rate - limited room for negotiation')
  }
  
  if (marketData.supply === 'high') {
    risks.push('High supply means many alternatives available - no rush needed')
  }
  
  if (marketData.daysToSell > 40) {
    risks.push('This type of vehicle takes longer to sell - consider liquidity')
  }
  
  if (vehicleData.adjustments.mileage < -2000) {
    risks.push('Higher than average mileage may affect future resale value')
  }
  
  return risks
}

function generatePositives(percentageAboveBelow: number, marketData: any, vehicleData: any): string[] {
  const positives = []
  
  if (percentageAboveBelow <= -5) {
    positives.push('Below market pricing offers good value')
    positives.push('Potential for appreciation or easy resale')
  }
  
  if (marketData.demand === 'high') {
    positives.push('High demand model - good resale potential')
  }
  
  if (marketData.daysToSell < 30) {
    positives.push('Quick-selling model - good liquidity')
  }
  
  if (vehicleData.adjustments.mileage > 1000) {
    positives.push('Lower than average mileage adds value')
  }
  
  if (vehicleData.adjustments.condition > 1000) {
    positives.push('Excellent condition commands premium pricing')
  }
  
  return positives
}

function calculateMarketPercentile(askingPrice: number, priceRange: { min: number, max: number }): number {
  const range = priceRange.max - priceRange.min
  const position = askingPrice - priceRange.min
  return Math.round((position / range) * 100)
}

function generateNegotiationPoints(vehicleData: any, percentageAboveBelow: number, marketData: any): string[] {
  const points = []
  
  if (percentageAboveBelow > 0) {
    points.push(`Vehicle is priced ${percentageAboveBelow}% above market value`)
  }
  
  if (vehicleData.adjustments.mileage < -1000) {
    points.push(`Higher mileage reduces value by approximately £${Math.abs(vehicleData.adjustments.mileage)}`)
  }
  
  if (marketData.supply === 'high') {
    points.push('High supply of similar vehicles gives you negotiating power')
  }
  
  if (marketData.daysToSell > 40) {
    points.push('These vehicles typically take longer to sell, seller may be motivated')
  }
  
  points.push('Consider any maintenance items or wear that may reduce value')
  points.push('Factor in immediate costs (MOT, service, repairs)')
  
  return points
}

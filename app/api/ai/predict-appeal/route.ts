import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Enhanced AI-Powered Appeal Success Prediction API
 * Uses advanced ML pipeline with feature engineering for better predictions
 * Includes free trial limitation by vehicle registration
 */

export async function POST(request: NextRequest) {
  try {
    // Get session for rate limiting and analytics
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      reason, 
      description, 
      pcn_number,
      vehicle_reg,
      fine_amount,
      evidence = [],
      location,
      contravention_code 
    } = body

    // Validate required fields
    if (!reason && !description) {
      return NextResponse.json(
        { error: 'Appeal reason or description is required' },
        { status: 400 }
      )
    }

    // NEW: Check free trial limitation by vehicle registration
    if (vehicle_reg) {
      const cleanRegistration = vehicle_reg.replace(/\s+/g, '').toUpperCase()
      
      // Check if this registration has already been used for free trial
      const existingUsage = await (prisma as any).freeTrialUsage.findUnique({
        where: { registration: cleanRegistration }
      })

      if (existingUsage) {
        return NextResponse.json({
          error: 'Free trial limit reached',
          message: `This vehicle registration (${cleanRegistration}) has already been used for a free AI appeal analysis. To continue using our AI appeal service, please upgrade to a paid plan.`,
          upgradeRequired: true,
          registrationUsed: cleanRegistration,
          usedAt: existingUsage.usedAt
        }, { status: 403 })
      }

      // Record this usage for the free trial
      try {
        await (prisma as any).freeTrialUsage.create({
          data: {
            registration: cleanRegistration,
            userId: session.user.id,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        })
      } catch (error) {
        // Handle race condition where another request might have created the record
        console.error('Error recording free trial usage:', error)
        return NextResponse.json({
          error: 'Free trial limit reached',
          message: `This vehicle registration (${cleanRegistration}) has already been used for a free AI appeal analysis. To continue using our AI appeal service, please upgrade to a paid plan.`,
          upgradeRequired: true,
          registrationUsed: cleanRegistration
        }, { status: 403 })
      }
    }

    // Try to use Python ML service first
    try {
      console.log('🤖 Attempting Python ML prediction...')
      
      const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
      
      const mlResponse = await fetch(`${pythonServiceUrl}/predict-appeal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          description,
          pcn_number,
          vehicle_reg,
          fine_amount,
          evidence,
          location,
          contravention_code
        }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (mlResponse.ok) {
        const prediction = await mlResponse.json()

        const enhancedPrediction = {
          ...prediction,
          model_version: '2.0',
          prediction_method: 'python_ml',
          timestamp: new Date().toISOString(),
          session_id: session?.user?.email || 'anonymous'
        }

        // Backward-compatible shape
        return NextResponse.json({
          prediction: enhancedPrediction,
          strategy: {
            checklist: enhancedPrediction.checklist || [],
            recommended_evidence: enhancedPrediction.recommended_evidence || [],
          }
        })
      }
    } catch (error) {
      console.log('⚠️ Python ML service unavailable, using fallback prediction')
    }

    // Enhanced Fallback prediction service
    const prediction = EnhancedFallbackPrediction.predictSuccess({
      reason,
      description,
      evidence,
      pcn_number,
      vehicle_reg,
      fine_amount,
      location,
      contravention_code
    })

    const responseBody = {
      prediction: {
        ...prediction,
        model_version: '2.0-fallback',
        prediction_method: 'enhanced_rules',
        timestamp: new Date().toISOString(),
        session_id: session?.user?.email || 'anonymous'
      },
      strategy: {
        checklist: prediction.checklist || [],
        recommended_evidence: prediction.recommended_evidence || []
      }
    }

    return NextResponse.json(responseBody)

  } catch (error) {
    console.error('AI prediction error:', error)
    return NextResponse.json(
      { error: 'AI prediction service temporarily unavailable' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'AI Appeal Prediction API',
    version: '2.0',
    status: 'active',
    features: [
      'ML-powered success prediction',
      'Enhanced rule-based fallback',
      'Legal grounds analysis', 
      'Evidence evaluation',
      'Strategic recommendations'
    ]
  })
}

/**
 * Enhanced Fallback Prediction Service with Advanced Rule-Based Logic
 */
class EnhancedFallbackPrediction {
  static predictSuccess(appealData: any) {
    const reason = appealData.reason?.toLowerCase() || ''
    const description = appealData.description?.toLowerCase() || ''
    const combinedText = `${reason} ${description}`

    // New: structured context
    const contravention = String(appealData.contravention_code || '').trim()
    const location = String(appealData.location || '').toLowerCase()
    const evidenceList: string[] = Array.isArray(appealData.evidence) ? appealData.evidence : []

    // New: domain weights (typical UK PCN codes – indicative only)
    const contraventionWeights: Record<string, number> = {
      // On-street examples
      '01': -0.05, // Restricted street during prescribed hours
      '02': -0.03, // Loading/Unloading restrictions
      '12': -0.07, // Parked in residents or shared use bay without permit
      '19': -0.02, // Displayed invalid/expired permit (mitigation more common)
      '20': -0.05, // Parking in part of bay
      '21': -0.04, // Suspended bay
      '30': -0.03, // Parking longer than permitted
      '40': -0.06, // Bus lane
      // Off-street examples
      '73': -0.03, // Parked without payment of the parking charge
      '80': -0.04, // Parked for longer than permitted
      '83': -0.02, // Parked in disabled bay without badge (usually strong against)
    }

    // Enhanced scoring system
    let score = 0.25 // Base score (25%)
    let confidence = 'medium'
    const keyFactors: string[] = []
    const legalGrounds: string[] = []
    const riskFlags: string[] = []
    const recommendedEvidence: string[] = []
    const checklist: string[] = []

    // Apply contravention weighting
    if (contravention && contraventionWeights[contravention] !== undefined) {
      score += contraventionWeights[contravention]
      keyFactors.push(`🧾 Contravention code ${contravention} weighting applied`)
    }

    // STRONG POSITIVE INDICATORS (High success probability)
    
    // Signage Issues - Very Strong
    if (this.containsTerms(combinedText, ['signage', 'sign', 'obscured', 'unclear', 'missing', 'covered', 'blocked'])) {
      score += 0.35
      keyFactors.push('📍 Signage visibility issues detected')
      legalGrounds.push('Statutory signage requirements under Traffic Management Act 2004')
    }
    
    // Emergency/Medical - Very Strong  
    if (this.containsTerms(combinedText, ['emergency', 'medical', 'hospital', 'ambulance', 'urgent', 'health'])) {
      score += 0.30
      keyFactors.push('🚨 Emergency/medical circumstances identified')
      legalGrounds.push('Exceptional circumstances exemption')
    }
    
    // Mechanical Breakdown - Strong
    if (this.containsTerms(combinedText, ['breakdown', 'mechanical', 'fault', 'malfunction', 'engine', 'aa', 'rac'])) {
      score += 0.25
      keyFactors.push('🔧 Vehicle breakdown circumstances')
      legalGrounds.push('Unavoidable mechanical failure defense')
    }
    
    // Payment Machine Issues - Strong
    if (this.containsTerms(combinedText, ['payment', 'machine', 'fault', 'out of order', 'not working', 'error', 'broken'])) {
      score += 0.25
      keyFactors.push('💳 Payment system failure identified')
      legalGrounds.push('Payment facility defect under PCN regulations')
    }
    
    // Valid Permit Issues - Strong
    if (this.containsTerms(combinedText, ['permit', 'valid', 'displayed', 'ticket shown', 'pass visible'])) {
      score += 0.25
      keyFactors.push('🎫 Valid permit/ticket display issue')
      legalGrounds.push('Valid authorization wrongly penalized')
    }
    
    // Loading/Commercial Activity - Moderate to Strong
    if (this.containsTerms(combinedText, ['loading', 'unloading', 'delivery', 'commercial', 'goods', 'business'])) {
      score += 0.20
      keyFactors.push('📦 Loading/commercial activity circumstances')
      legalGrounds.push('Permitted commercial activity exemption')
    }
    
    // Administrative Errors - Strong
    if (this.containsTerms(combinedText, ['wrong registration', 'incorrect', 'error', 'mistake', 'duplicate'])) {
      score += 0.25
      keyFactors.push('📝 Administrative error detected')
      legalGrounds.push('Factual inaccuracy in PCN details')
    }
    
    // Location context boosts
    if (/hospital|gp|clinic/.test(location)) {
      score += 0.05; keyFactors.push('🏥 Hospital/medical location context')
    }
    if (/school|nursery/.test(location)) {
      score += 0.03; keyFactors.push('🏫 School area – potential loading/child drop-off grace')
    }

    // Grace period / observation logic
    const minutesMatch = combinedText.match(/(\d{1,2})\s*(min|minute|minutes)/)
    if (minutesMatch) {
      const mins = parseInt(minutesMatch[1], 10)
      if (mins <= 10 && /grace|observation|waiting|loading/.test(combinedText)) {
        score += 0.08
        keyFactors.push('⏱️ Possible 10‑minute grace/observation period')
        legalGrounds.push('Statutory 10‑minute grace period (where applicable)')
      }
    }

    // Administrative/data errors
    if (this.containsTerms(combinedText, ['wrong registration', 'incorrect vrn', 'plate mismatch', 'duplicate'])) {
      score += 0.25
      keyFactors.push('📝 VRN/admin inaccuracy indicated')
      legalGrounds.push('Factual inaccuracy in PCN details')
    }

    // Evidence analysis (by type/strength)
    let evidenceBoost = 0
    const hasPhoto = evidenceList.some(e => /\.jpe?g$|\.png$|\.heic$|photo|image/i.test(String(e)))
    const hasVideo = evidenceList.some(e => /\.mp4$|\.mov$|video/i.test(String(e)))
    const hasPdf = evidenceList.some(e => /\.pdf$|document|letter/i.test(String(e)))
    const hasWitness = evidenceList.some(e => /witness|statement/i.test(String(e)))

    if (hasPhoto) { evidenceBoost += 0.07; recommendedEvidence.push('Clear timestamped photos of signs, bay markings, machine screens') }
    if (hasVideo) { evidenceBoost += 0.07; recommendedEvidence.push('Short video showing signage visibility/route/obstruction') }
    if (hasPdf)   { evidenceBoost += 0.05; recommendedEvidence.push('Receipts, permits, council correspondence') }
    if (hasWitness) { evidenceBoost += 0.04; recommendedEvidence.push('Witness statement with contact details') }

    // Cap evidence boost
    evidenceBoost = Math.min(evidenceBoost, 0.18)
    if (evidenceBoost > 0) {
      score += evidenceBoost
      keyFactors.push(`📎 Evidence strength boost (+${(evidenceBoost*100).toFixed(0)}%)`)
    }

    // DETAILED DESCRIPTION BOOST
    if (combinedText.length > 200) {
      score += 0.06
      keyFactors.push('📋 Detailed account provided')
    } else if (combinedText.length > 100) {
      score += 0.03
      keyFactors.push('📋 Some detail provided')
    }

    // LEGAL TERMINOLOGY BOOST
    if (this.containsTerms(combinedText, ['statutory', 'regulation', 'act', 'legal', 'contravention', 'enforcement', 'tmo', 'tro', 'traffic order'])) {
      score += 0.10
      keyFactors.push('⚖️ Legal terminology awareness')
    }

    // Negative indicators
    if (this.containsTerms(combinedText, ['only briefly', 'few minutes', 'in a hurry', 'running late'])) {
      score -= 0.12; riskFlags.push('Weak mitigation language detected')
    }

    // Cap score between 0 and 1
    score = Math.max(0, Math.min(1, score))

    // Determine confidence level
    if (score >= 0.75) {
      confidence = 'high'
    } else if (score >= 0.5) {
      confidence = 'medium'
    } else {
      confidence = 'low'
    }

    // Generate recommendation
    let recommendation = ''
    if (score >= 0.75) {
      recommendation = 'Strong grounds – proceed to formal representation with evidence pack'
    } else if (score >= 0.5) {
      recommendation = 'Reasonable grounds – proceed and bolster with additional evidence'
    } else if (score >= 0.3) {
      recommendation = 'Weak grounds – consider paying discounted rate unless new evidence emerges'
    } else {
      recommendation = 'Very weak grounds – paying discounted rate may be pragmatic'
    }

    // Meticulous checklist (actionable next steps)
    checklist.push(
      'Request CEO notes and photos from the council',
      'Request TRO/TMO and bay suspension order (if applicable)',
      'Photograph all nearby signs and bay markings (diagram 1028/1032/1033 compliance)',
      'Obtain machine audit/logs if payment machine fault claimed',
      'Include proof of permit/ticket validity (if applicable)',
      'Provide timeline with timestamps; cite any grace/observation period',
      'Redact personal info; keep file names descriptive'
    )

    // Add specific legal grounds if none found
    if (legalGrounds.length === 0) {
      legalGrounds.push('General appeal under Civil Enforcement regulations')
    }

    return {
      success_probability: score,
      confidence_level: confidence,
      recommendation,
      key_factors: keyFactors,
      legal_grounds: legalGrounds,
      evidence_strength: evidenceList.length > 0 ? 'supported' : 'unsupported',
      appeal_category: this.categorizeAppeal(combinedText),
      estimated_processing_time: '28-56 days for informal appeal',
      risk_flags: riskFlags,
      recommended_evidence: Array.from(new Set(recommendedEvidence)),
      checklist
    }
  }

  static containsTerms(text: string, terms: string[]): boolean {
    return terms.some(term => text.includes(term))
  }

  static categorizeAppeal(text: string): string {
    if (this.containsTerms(text, ['signage', 'sign'])) return 'signage_issues'
    if (this.containsTerms(text, ['emergency', 'medical'])) return 'emergency_circumstances'
    if (this.containsTerms(text, ['breakdown', 'mechanical'])) return 'vehicle_breakdown'
    if (this.containsTerms(text, ['payment', 'machine'])) return 'payment_issues'
    if (this.containsTerms(text, ['permit', 'ticket'])) return 'permit_issues'
    if (this.containsTerms(text, ['loading', 'delivery'])) return 'commercial_activity'
    if (this.containsTerms(text, ['error', 'mistake', 'vrn'])) return 'administrative_error'
    return 'general_appeal'
  }
}

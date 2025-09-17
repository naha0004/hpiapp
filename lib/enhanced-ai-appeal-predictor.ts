import { APPEAL_GROUNDS, getStrongestGrounds, searchAppealGrounds, type AppealGround } from './appeal-grounds'

/**
 * Enhanced AI Appeal Predictor with comprehensive UK legal framework integration
 * 
 * Legal Framework Integration:
 * - Civil Enforcement of Road Traffic Contraventions (England) Regulations 2022
 * - Traffic Management Act 2004 (Part 6)
 * - Traffic Signs Regulations and General Directions (TSRGD) 2016
 * - Key case law: Moses v Barnet (2006), Herron v Sunderland (2011)
 * 
 * Deadline Awareness:
 * - 14 days PCN discount period
 * - 28 days formal representations 
 * - 28 days tribunal appeal from NoR
 */

interface AppealPrediction {
  successProbability: number
  confidence: number
  recommendedGrounds: AppealGround[]
  keyFactors: string[]
  evidenceNeeded: string[]
  riskFactors: string[]
  legalStrategy: string
  appealLetter: string
  priorityActions: string[]
}

interface UserInput {
  description: string
  circumstances: string[]
  location: string
  timeOfIncident: Date
  evidenceAvailable: string[]
  previousAttempts: number
  pcnAmount?: number
  councilName?: string
}

export class AIAppealPredictor {
  private weights = {
    statutory: 0.85,      // Increased weight for legal grounds
    evidenceQuality: 0.75,
    timing: 0.65,
    previousSuccess: 0.55,
    circumstancesClarity: 0.6,
    legalStrength: 0.9    // New weight for legal strength
  }

  predict(input: UserInput): AppealPrediction {
    console.log('🤖 AI Predictor analyzing case:', input.description.substring(0, 100) + '...')
    
    // Enhanced ground identification with confidence scoring
    const relevantGrounds = this.identifyRelevantGrounds(input)
    const strongestGrounds = relevantGrounds.filter(ground => ground.legalStrength === 'high')
    const mediumGrounds = relevantGrounds.filter(ground => ground.legalStrength === 'medium')
    
    // Multi-factor probability calculation
    let baseProbability = this.calculateEnhancedLegalStrength(relevantGrounds)
    
    // Evidence quality multiplier (more sophisticated)
    const evidenceScore = this.assessAdvancedEvidenceQuality(input.evidenceAvailable, relevantGrounds)
    baseProbability *= (1 + evidenceScore * this.weights.evidenceQuality)
    
    // Timing assessment with appeal deadline considerations
    const timingScore = this.assessAdvancedTiming(input.timeOfIncident)
    baseProbability *= (1 + timingScore * this.weights.timing)
    
    // Previous attempts with learning curve
    const previousAttemptsImpact = this.calculatePreviousAttemptsImpact(input.previousAttempts)
    baseProbability *= previousAttemptsImpact
    
    // Location-specific factors (council success rates)
    const locationMultiplier = this.getLocationMultiplier(input.councilName)
    baseProbability *= locationMultiplier
    
    const finalProbability = Math.min(0.98, Math.max(0.02, baseProbability))
    const confidence = this.calculateAdvancedConfidence(input, relevantGrounds)
    
    // Generate comprehensive response
    const legalStrategy = this.generateLegalStrategy(relevantGrounds, input)
    const appealLetter = this.generateAppealLetter(relevantGrounds, input)
    const priorityActions = this.generatePriorityActions(relevantGrounds, input)
    
    console.log(`📊 Prediction: ${(finalProbability * 100).toFixed(1)}% success probability`)
    console.log(`🎯 Confidence: ${(confidence * 100).toFixed(1)}%`)
    console.log(`⚖️ Legal grounds found: ${relevantGrounds.length}`)
    
    return {
      successProbability: finalProbability,
      confidence,
      recommendedGrounds: [...strongestGrounds, ...mediumGrounds].slice(0, 3),
      keyFactors: this.identifyEnhancedKeyFactors(input, relevantGrounds),
      evidenceNeeded: this.getSmartEvidenceRequirements(relevantGrounds),
      riskFactors: this.identifyComprehensiveRiskFactors(input, relevantGrounds),
      legalStrategy,
      appealLetter,
      priorityActions
    }
  }

  private identifyRelevantGrounds(input: UserInput): AppealGround[] {
    const searchText = `${input.description} ${input.circumstances.join(' ')}`
    let foundGrounds = searchAppealGrounds(searchText)
    
    // Enhanced keyword matching with context awareness
    const keywordMatches = new Map<string, { grounds: string[], weight: number }>([
      // Payment-related (high confidence)
      ['payment', { grounds: ['A1', 'A2', 'A3'], weight: 0.9 }],
      ['paid', { grounds: ['A1', 'A2'], weight: 0.95 }],
      ['ticket displayed', { grounds: ['A2'], weight: 0.9 }],
      ['receipt', { grounds: ['A1', 'A3'], weight: 0.85 }],
      
      // Signage issues (high confidence)
      ['sign', { grounds: ['C10', 'C11', 'C12'], weight: 0.8 }],
      ['faded', { grounds: ['C10'], weight: 0.9 }],
      ['illegible', { grounds: ['C10'], weight: 0.9 }],
      ['no signs', { grounds: ['C11'], weight: 0.95 }],
      ['confusing', { grounds: ['C12'], weight: 0.8 }],
      
      // Medical emergencies (medium-high confidence)
      ['medical', { grounds: ['E21', 'E22'], weight: 0.8 }],
      ['hospital', { grounds: ['E21'], weight: 0.85 }],
      ['emergency', { grounds: ['E21', 'E23'], weight: 0.8 }],
      ['ambulance', { grounds: ['E21'], weight: 0.9 }],
      
      // Disability (high confidence)
      ['disabled', { grounds: ['B5', 'B6'], weight: 0.9 }],
      ['blue badge', { grounds: ['B5'], weight: 0.95 }],
      ['disability', { grounds: ['B5', 'B6'], weight: 0.85 }],
      
      // Loading/unloading (medium confidence)
      ['loading', { grounds: ['D14', 'D15', 'D16'], weight: 0.7 }],
      ['unloading', { grounds: ['D14', 'D15'], weight: 0.7 }],
      ['delivery', { grounds: ['D16'], weight: 0.75 }],
      
      // Vehicle issues (medium confidence)
      ['breakdown', { grounds: ['E24', 'E25'], weight: 0.8 }],
      ['fault', { grounds: ['E25'], weight: 0.7 }],
      ['accident', { grounds: ['E23'], weight: 0.8 }]
    ])
    
    const matchedGrounds = new Map<string, number>()
    
    // Add initial search results
    foundGrounds.forEach(ground => {
      matchedGrounds.set(ground.id, 0.6)
    })
    
    // Enhanced keyword matching with confidence scoring
    for (const [keyword, { grounds, weight }] of keywordMatches) {
      if (searchText.toLowerCase().includes(keyword)) {
        grounds.forEach(groundId => {
          const currentWeight = matchedGrounds.get(groundId) || 0
          matchedGrounds.set(groundId, Math.max(currentWeight, weight))
        })
      }
    }
    
    // Filter by minimum confidence and return full ground objects
    const filteredGrounds = Array.from(matchedGrounds.entries())
      .filter(([_, confidence]) => confidence >= 0.5)
      .sort(([_, a], [__, b]) => b - a)
      .map(([groundId]) => APPEAL_GROUNDS.find(g => g.id === groundId))
      .filter((ground): ground is AppealGround => ground !== undefined)
    
    return filteredGrounds
  }

  private calculateEnhancedLegalStrength(grounds: AppealGround[]): number {
    if (grounds.length === 0) return 0.15
    
    const strengthScores = grounds.map(g => {
      const baseScore = {
        'high': 0.85,
        'medium': 0.55,
        'low': 0.25
      }[g.legalStrength] || 0.15
      
      // Bonus for statutory vs mitigating
      const categoryBonus = g.category === 'statutory' ? 0.1 : 0
      
      return baseScore + categoryBonus
    })
    
    // Use weighted combination: strongest ground gets most weight
    const maxStrength = Math.max(...strengthScores)
    const avgStrength = strengthScores.reduce((a, b) => a + b, 0) / strengthScores.length
    const combinedEffect = Math.min(1, strengthScores.length * 0.1) // Multiple grounds bonus
    
    return (maxStrength * 0.6 + avgStrength * 0.3 + combinedEffect * 0.1)
  }

  private assessAdvancedEvidenceQuality(evidenceAvailable: string[], grounds: AppealGround[]): number {
    // Map evidence types to quality scores
    const evidenceQuality = new Map<string, number>([
      ['photographs', 0.8],
      ['video footage', 0.9],
      ['receipts', 0.95],
      ['parking ticket', 0.85],
      ['medical records', 0.9],
      ['witness statements', 0.7],
      ['correspondence', 0.6],
      ['bank statements', 0.8],
      ['timestamped evidence', 0.9],
      ['professional documentation', 0.85]
    ])
    
    let totalScore = 0
    let maxPossibleScore = 0
    
    // Check each required evidence type for the identified grounds
    const requiredEvidence = new Set<string>()
    grounds.forEach(ground => {
      ground.evidenceRequired.forEach(evidence => requiredEvidence.add(evidence.toLowerCase()))
    })
    
    requiredEvidence.forEach(required => {
      let found = false
      for (const available of evidenceAvailable) {
        if (available.toLowerCase().includes(required) || 
            required.includes(available.toLowerCase())) {
          
          // Find quality score
          let qualityScore = 0.5 // default
          for (const [evidenceType, score] of evidenceQuality) {
            if (available.toLowerCase().includes(evidenceType)) {
              qualityScore = Math.max(qualityScore, score)
            }
          }
          
          totalScore += qualityScore
          found = true
          break
        }
      }
      maxPossibleScore += 1
    })
    
    return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0.3
  }

  private assessAdvancedTiming(incidentDate: Date): number {
    const daysSince = (Date.now() - incidentDate.getTime()) / (1000 * 60 * 60 * 24)
    
    // UK parking appeal deadlines consideration
    if (daysSince <= 14) return 1.0      // Optimal - within informal challenge period
    if (daysSince <= 28) return 0.9      // Good - formal appeal period
    if (daysSince <= 56) return 0.7      // Acceptable - within statutory deadlines
    if (daysSince <= 84) return 0.4      // Late but possible with good reasons
    if (daysSince <= 365) return 0.2     // Very late - exceptional circumstances needed
    return 0.05                          // Extremely late - minimal chance
  }

  private calculatePreviousAttemptsImpact(previousAttempts: number): number {
    // First attempt gets no penalty
    if (previousAttempts === 0) return 1.0
    
    // Subsequent attempts have diminishing returns but aren't fatal
    // Some grounds (like new evidence) can still succeed on retry
    return Math.max(0.3, 1 - (previousAttempts * 0.15))
  }

  private getLocationMultiplier(councilName?: string): number {
    // In a real implementation, this would use council-specific success rate data
    // For now, return neutral multiplier with slight variations
    const councilModifiers = new Map<string, number>([
      ['Westminster', 0.9],    // Stricter
      ['Camden', 0.95],
      ['Islington', 1.0],
      ['Southwark', 1.05],     // More lenient
      ['Lambeth', 1.0]
    ])
    
    return councilName ? (councilModifiers.get(councilName) || 1.0) : 1.0
  }

  private calculateAdvancedConfidence(input: UserInput, grounds: AppealGround[]): number {
    let confidence = 0.3 // Base confidence
    
    // Detail quality factors
    if (input.description.length > 150) confidence += 0.25
    if (input.description.length > 300) confidence += 0.15
    
    // Circumstances specificity
    if (input.circumstances.length > 2) confidence += 0.15
    if (input.circumstances.length > 4) confidence += 0.10
    
    // Legal grounds confidence
    const highStrengthGrounds = grounds.filter(g => g.legalStrength === 'high').length
    confidence += highStrengthGrounds * 0.2
    
    // Evidence availability
    if (input.evidenceAvailable.length > 2) confidence += 0.2
    if (input.evidenceAvailable.length > 4) confidence += 0.15
    
    // Specific high-confidence indicators
    const highConfidenceKeywords = ['receipt', 'photograph', 'medical', 'disabled', 'paid']
    const keywordMatches = highConfidenceKeywords.filter(keyword =>
      input.description.toLowerCase().includes(keyword)
    ).length
    confidence += keywordMatches * 0.05
    
    return Math.min(1, confidence)
  }

  private generateLegalStrategy(grounds: AppealGround[], input: UserInput): string {
    if (grounds.length === 0) {
      return "No specific legal grounds identified. Consider reviewing the case details and gathering additional evidence."
    }
    
    const statutoryGrounds = grounds.filter(g => g.category === 'statutory')
    const mitigatingGrounds = grounds.filter(g => g.category === 'mitigating')
    
    let strategy = "## Legal Strategy\n\n"
    
    if (statutoryGrounds.length > 0) {
      strategy += "**Primary Approach - Statutory Grounds:**\n"
      strategy += `Focus on ${statutoryGrounds[0].title} as your main argument. `
      strategy += `This is a strong legal ground with ${statutoryGrounds[0].legalStrength} success probability.\n\n`
      
      if (statutoryGrounds.length > 1) {
        strategy += "**Supporting Arguments:**\n"
        statutoryGrounds.slice(1).forEach(ground => {
          strategy += `• ${ground.title} (${ground.legalStrength} strength)\n`
        })
        strategy += "\n"
      }
    }
    
    if (mitigatingGrounds.length > 0) {
      strategy += "**Secondary Approach - Mitigating Circumstances:**\n"
      mitigatingGrounds.forEach(ground => {
        strategy += `• ${ground.title}: ${ground.description}\n`
      })
      strategy += "\n"
    }
    
    strategy += "**Recommended Order of Arguments:**\n"
    strategy += "1. Lead with strongest legal ground\n"
    strategy += "2. Present evidence systematically\n"
    strategy += "3. Address any potential counterarguments\n"
    strategy += "4. Close with request for specific remedy\n"
    
    return strategy
  }

  private generateAppealLetter(grounds: AppealGround[], input: UserInput): string {
    const primaryGround = grounds[0]
    if (!primaryGround) {
      return "Unable to generate appeal letter - no legal grounds identified."
    }
    
    const letter = `## Draft Appeal Letter

**FORMAL REPRESENTATIONS**
**To:** ${input.councilName || '[Council Name]'} Parking Services  
**PCN:** [NUMBER] | **Date:** ${new Date().toLocaleDateString('en-GB')} | **Amount:** ${input.pcnAmount ? `£${input.pcnAmount}` : '[Amount]'}

**STATUTORY GROUND:** ${primaryGround.section}
Under Civil Enforcement of Road Traffic Contraventions (England) Regulations 2022.

**FACTS:**
• Issue Date: ${input.timeOfIncident.toLocaleDateString('en-GB')}
• Location: ${input.location}
• Circumstances: ${input.description}

**LEGAL BASIS:**
${primaryGround.legalFramework?.regulation || 'Traffic Management Act 2004 (Part 6)'} establishes that ${primaryGround.category === 'statutory' ? 'no contravention occurred' : 'exceptional circumstances apply'}. ${primaryGround.legalPrecedents?.[0] || 'Standard statutory interpretation applies'}.

**EVIDENCE:**
${input.evidenceAvailable.map(evidence => `• ${evidence}`).join('\n')}

**REMEDY REQUESTED:**
PCN cancellation under statutory grounds. This representation is within the ${primaryGround.legalFramework?.deadline || '28-day'} deadline.

**RESERVED RIGHTS:**
If rejected, tribunal appeal within 28 days of Notice of Rejection.

[Your Name/Address/Contact]

**Attachments:**
${primaryGround.evidenceRequired.slice(0, 3).map(evidence => `• ${evidence}`).join('\n')}`
    
    return letter
  }

  private generatePriorityActions(grounds: AppealGround[], input: UserInput): string[] {
    const actions: string[] = []
    
    if (grounds.length === 0) {
      return [
        "Gather more specific details about the incident",
        "Review parking restrictions and signage",
        "Collect any available evidence (photos, receipts, etc.)",
        "Consider consulting with local parking appeal experts"
      ]
    }
    
    const primaryGround = grounds[0]
    
    // Evidence-specific actions
    primaryGround.evidenceRequired.forEach(evidence => {
      if (!input.evidenceAvailable.some(available => 
        available.toLowerCase().includes(evidence.toLowerCase())
      )) {
        actions.push(`Obtain: ${evidence}`)
      }
    })
    
    // Timing actions
    const daysSince = (Date.now() - input.timeOfIncident.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince > 28) {
      actions.push("Submit appeal urgently - approaching deadline")
    }
    
    // Ground-specific actions
    if (primaryGround.id.startsWith('A')) {
      actions.push("Gather all payment evidence and timestamps")
    } else if (primaryGround.id.startsWith('C')) {
      actions.push("Take current photographs of parking signage")
    } else if (primaryGround.id.startsWith('E')) {
      actions.push("Document emergency circumstances with official records")
    }
    
    actions.push("Review appeal letter before submission")
    actions.push("Keep copies of all submitted documents")
    actions.push("Track appeal submission and response deadlines")
    
    return actions
  }

  private identifyEnhancedKeyFactors(input: UserInput, grounds: AppealGround[]): string[] {
    const factors: string[] = []
    
    // Legal strength factors
    const highStrengthGrounds = grounds.filter(g => g.legalStrength === 'high')
    if (highStrengthGrounds.length > 0) {
      factors.push(`${highStrengthGrounds.length} high-strength legal ground${highStrengthGrounds.length > 1 ? 's' : ''} identified`)
    }
    
    const statutoryGrounds = grounds.filter(g => g.category === 'statutory')
    if (statutoryGrounds.length > 0) {
      factors.push(`${statutoryGrounds.length} statutory ground${statutoryGrounds.length > 1 ? 's' : ''} available`)
    }
    
    // Evidence factors
    if (input.evidenceAvailable.length > 3) {
      factors.push('Comprehensive evidence collection')
    } else if (input.evidenceAvailable.length > 1) {
      factors.push('Good evidence documentation')
    }
    
    // Timing factors
    const daysSince = (Date.now() - input.timeOfIncident.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince <= 14) {
      factors.push('Optimal timing - within informal challenge period')
    } else if (daysSince <= 28) {
      factors.push('Good timing - formal appeal period')
    }
    
    // First attempt advantage
    if (input.previousAttempts === 0) {
      factors.push('First appeal attempt (no previous rejection)')
    }
    
    // Specific case strengths
    if (input.description.length > 200) {
      factors.push('Detailed incident description provided')
    }
    
    if (input.circumstances.length > 3) {
      factors.push('Multiple supporting circumstances documented')
    }
    
    return factors
  }

  private getSmartEvidenceRequirements(grounds: AppealGround[]): string[] {
    if (grounds.length === 0) {
      return ['Incident photographs', 'Any available documentation', 'Witness contact details if available']
    }
    
    const evidenceSet = new Set<string>()
    const priorityEvidence: string[] = []
    
    grounds.forEach(ground => {
      ground.evidenceRequired.forEach((evidence, index) => {
        if (index === 0) { // First evidence item is usually most important
          priorityEvidence.push(`${evidence} (HIGH PRIORITY for ${ground.id})`)
        } else {
          evidenceSet.add(evidence)
        }
      })
    })
    
    return [...priorityEvidence, ...Array.from(evidenceSet)]
  }

  private identifyComprehensiveRiskFactors(input: UserInput, grounds: AppealGround[]): string[] {
    const risks: string[] = []
    
    // Legal risks
    if (grounds.length === 0) {
      risks.push('No clear legal grounds identified - case may lack merit')
    } else if (grounds.every(g => g.legalStrength === 'low')) {
      risks.push('Only low-strength legal grounds available')
    }
    
    // Evidence risks
    if (input.evidenceAvailable.length < 2) {
      risks.push('Limited evidence may significantly weaken the case')
    }
    
    const requiredEvidenceCount = new Set(
      grounds.flatMap(g => g.evidenceRequired)
    ).size
    const availableEvidenceCount = input.evidenceAvailable.length
    
    if (availableEvidenceCount < requiredEvidenceCount * 0.5) {
      risks.push(`Missing majority of required evidence (have ${availableEvidenceCount}/${requiredEvidenceCount})`)
    }
    
    // Timing risks
    const daysSince = (Date.now() - input.timeOfIncident.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince > 56) {
      risks.push('Late appeal submission - may face procedural challenges')
    } else if (daysSince > 28) {
      risks.push('Appeal submitted after optimal timeframe')
    }
    
    // Previous attempts
    if (input.previousAttempts > 0) {
      risks.push(`${input.previousAttempts} previous failed attempt${input.previousAttempts > 1 ? 's' : ''} may reduce credibility`)
    }
    
    if (input.previousAttempts > 2) {
      risks.push('Multiple previous failures suggest fundamental case weakness')
    }
    
    // Description quality
    if (input.description.length < 100) {
      risks.push('Brief description may not provide sufficient detail for assessment')
    }
    
    // Circumstantial risks
    if (input.circumstances.length < 2) {
      risks.push('Limited contextual information may weaken case presentation')
    }
    
    // Financial risks
    if (input.pcnAmount && input.pcnAmount > 100) {
      risks.push('High penalty amount - increased scrutiny likely')
    }
    
    return risks
  }

  // Enhanced training method with detailed analytics
  async trainModel(trainingData: Array<{ 
    input: UserInput
    actualOutcome: boolean
    councilResponse?: string
    timeToDecision?: number
  }>) {
    console.log(`🎓 Training AI model with ${trainingData.length} cases`)
    
    let correctPredictions = 0
    let totalHighConfidence = 0
    let correctHighConfidence = 0
    const outcomeAnalysis = {
      truePositives: 0,
      trueNegatives: 0,
      falsePositives: 0,
      falseNegatives: 0
    }
    
    const groundsEffectiveness = new Map<string, { total: number, successful: number }>()
    
    trainingData.forEach(({ input, actualOutcome, councilResponse }) => {
      const prediction = this.predict(input)
      const predictedSuccess = prediction.successProbability > 0.5
      const highConfidence = prediction.confidence > 0.7
      
      if (predictedSuccess === actualOutcome) {
        correctPredictions++
        if (highConfidence) correctHighConfidence++
      }
      
      if (highConfidence) totalHighConfidence++
      
      // Outcome analysis
      if (predictedSuccess && actualOutcome) outcomeAnalysis.truePositives++
      else if (!predictedSuccess && !actualOutcome) outcomeAnalysis.trueNegatives++
      else if (predictedSuccess && !actualOutcome) outcomeAnalysis.falsePositives++
      else outcomeAnalysis.falseNegatives++
      
      // Track ground effectiveness
      prediction.recommendedGrounds.forEach(ground => {
        const key = ground.id
        const stats = groundsEffectiveness.get(key) || { total: 0, successful: 0 }
        stats.total++
        if (actualOutcome) stats.successful++
        groundsEffectiveness.set(key, stats)
      })
    })
    
    const accuracy = correctPredictions / trainingData.length
    const precision = outcomeAnalysis.truePositives / (outcomeAnalysis.truePositives + outcomeAnalysis.falsePositives)
    const recall = outcomeAnalysis.truePositives / (outcomeAnalysis.truePositives + outcomeAnalysis.falseNegatives)
    const f1Score = 2 * (precision * recall) / (precision + recall)
    
    // Adjust weights based on performance
    if (accuracy < 0.75) {
      console.log('📈 Adjusting model weights based on poor accuracy')
      this.weights.statutory *= 1.1
      this.weights.evidenceQuality *= 1.05
      this.weights.legalStrength *= 1.15
    } else if (accuracy > 0.9) {
      console.log('🎯 Model performing well - fine-tuning weights')
      // Fine-tune for very high accuracy
    }
    
    console.log(`✅ Training complete - Accuracy: ${(accuracy * 100).toFixed(1)}%`)
    console.log(`🎯 Precision: ${(precision * 100).toFixed(1)}%, Recall: ${(recall * 100).toFixed(1)}%`)
    
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      totalCases: trainingData.length,
      correctPredictions,
      highConfidenceAccuracy: totalHighConfidence > 0 ? correctHighConfidence / totalHighConfidence : 0,
      groundsEffectiveness: Array.from(groundsEffectiveness.entries()).map(([groundId, stats]) => ({
        groundId,
        successRate: stats.successful / stats.total,
        totalCases: stats.total
      })).sort((a, b) => b.successRate - a.successRate)
    }
  }
}

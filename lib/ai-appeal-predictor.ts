import type { AppealAnalysis, AppealDetails } from '../types/appeal';

class AIAppealPredictor {
  private async analyzeCircumstances(details: AppealDetails) {
    // TODO: Integrate with your preferred AI model/service
    // This is a placeholder implementation
    const circumstances = details.circumstances.toLowerCase();
    const evidence = details.evidenceAvailable || [];
    
    let confidence = 0.5; // Base confidence
    const reasoning: string[] = [];
    const suggestedEvidence: string[] = [];

    // Analyze based on ticket type
    switch (details.ticketType) {
      case 'Parking Violation':
        if (circumstances.includes('emergency') || circumstances.includes('medical')) {
          confidence += 0.3;
          reasoning.push('Emergency or medical situation may justify the violation');
          suggestedEvidence.push('Medical documentation or emergency service records');
        }
        if (circumstances.includes('sign') && circumstances.includes('not visible')) {
          confidence += 0.2;
          reasoning.push('Unclear or obscured signage may support your appeal');
          suggestedEvidence.push('Photos of the unclear signage');
        }
        break;

      case 'Speeding':
        if (circumstances.includes('emergency')) {
          confidence += 0.2;
          reasoning.push('Emergency situation may partially justify the speed');
        }
        if (circumstances.includes('speedometer') || circumstances.includes('calibration')) {
          confidence += 0.15;
          reasoning.push('Equipment accuracy questions may support your case');
          suggestedEvidence.push('Vehicle speedometer calibration records');
        }
        break;

      // Add more ticket types and their analysis logic
    }

    // Analyze available evidence
    if (evidence.includes('Photos')) {
      confidence += 0.1;
      reasoning.push('Photographic evidence strengthens your case');
    }
    if (evidence.includes('Video')) {
      confidence += 0.15;
      reasoning.push('Video evidence provides strong support');
    }
    if (evidence.includes('Witness Statements')) {
      confidence += 0.12;
      reasoning.push('Witness statements add credibility');
    }

    // Cap confidence at 0.95
    confidence = Math.min(confidence, 0.95);

    // Generate recommendation based on confidence
    let recommendation = '';
    if (confidence > 0.7) {
      recommendation = 'Strong case for appeal. Proceed with confidence.';
    } else if (confidence > 0.4) {
      recommendation = 'Moderate chance of success. Consider appealing with additional evidence.';
    } else {
      recommendation = 'Limited chance of success. Consider accepting the penalty.';
    }

    // Generate appeal template
    const appealTemplate = this.generateAppealTemplate(details, reasoning);

    return {
      recommendation,
      confidence,
      reasoning,
      suggestedEvidence,
      appealTemplateText: appealTemplate
    };
  }

  private generateAppealTemplate(details: AppealDetails, reasons: string[]): string {
    const date = new Date(details.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    return `Dear Sir/Madam,

I am writing to appeal against the ${details.ticketType.toLowerCase()} ticket issued on ${date} at ${details.location}.

${details.circumstances}

I believe this appeal should be considered for the following reasons:
${reasons.map(reason => `- ${reason}`).join('\n')}

I have the following evidence to support my appeal:
${details.evidenceAvailable.map(evidence => `- ${evidence}`).join('\n')}

I kindly request that you review this appeal taking into account the circumstances and evidence provided.

Thank you for your consideration.

Yours faithfully,
[Your Name]`;
  }

  async analyzeAppeal(details: AppealDetails): Promise<AppealAnalysis> {
    return this.analyzeCircumstances(details);
  }
}

export const ai_appeal_predictor = new AIAppealPredictor();

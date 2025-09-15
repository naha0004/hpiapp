import { OpenAI } from 'openai';
import type { AppealDetails, TicketType, EvidenceType } from '@/types/appeal';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Evidence {
  type: string;
  description: string;
}

interface AppealData extends Partial<AppealDetails> {
  reason?: string;
  ticketNumber?: string;
  issueDate?: string;
  location?: string;
  vehicleRegistration?: string;
  description?: string;
  evidence?: Evidence[];
}

export class AIAppealGenerator {
  /**
   * Generate a unique, personalized appeal letter using OpenAI
   */
  async generatePersonalizedAppeal(
    appealData: any,
    userContext: any
  ): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, falling back to static template');
      return this.generateStaticTemplate(appealData, userContext);
    }

    try {
      const userId = userContext?.id || 'anonymous';
      const appealId = Math.random().toString(36).substring(7);
      const prompt = AIAppealGenerator.buildDetailedPrompt(appealData, userId, appealId);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a UK traffic law expert and legal document specialist. Create unique, professionally written appeal letters that:
            
            1. Are completely original and personalized for each case
            2. Follow UK legal standards and Civil Enforcement Regulations 2022
            3. Use formal legal language appropriate for council appeals
            4. Include specific legal references relevant to the case
            5. Structure arguments logically with clear evidence presentation
            6. Maintain professional tone throughout
            7. Never use generic templates - each letter must be unique
            
            IMPORTANT: Each appeal must be distinctly different from others, even for similar cases. Vary language, structure, and legal approach while maintaining accuracy.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7, // Add creativity while maintaining accuracy
        max_tokens: 2000,
        presence_penalty: 0.3, // Encourage unique language
        frequency_penalty: 0.2, // Reduce repetitive phrases
      });

      const generatedAppeal = response.choices[0]?.message?.content;
      
      if (!generatedAppeal) {
        throw new Error('Failed to generate appeal content');
      }

      // Add unique identifiers and personalization
      const personalizedAppeal = AIAppealGenerator.addPersonalization(generatedAppeal, appealData, userId, appealId);
      
      return personalizedAppeal;

    } catch (error) {
      console.error('AI Appeal Generation Error:', error);
      // Fallback to static template if AI fails
      return this.generateStaticTemplate(appealData, userContext);
    }
  }

  /**
   * Generate static template when OpenAI is not available
   */
  private generateStaticTemplate(appealData: any, userContext: any): string {
    const today = new Date().toLocaleDateString('en-GB');
    const userId = userContext?.id || 'anonymous';
    const referenceNumber = `REF: ${userId.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    
    const template = `${referenceNumber}
Date: ${today}

[Council Name]
Penalty Charge Notice Department
[Council Address]

Re: Formal Representations - Penalty Charge Notice ${appealData.ticketNumber || '[PCN Number]'}

Dear Sir/Madam,

I am writing to make formal representations against the above Penalty Charge Notice issued on ${appealData.issueDate || '[Date]'} at ${appealData.location || '[Location]'} for the vehicle registration ${appealData.vehicleRegistration || '[Registration]'}.

GROUNDS FOR APPEAL

I respectfully submit that this penalty charge notice should be cancelled on the following grounds:

${appealData.reason || 'The alleged contravention did not occur as described in the notice.'}

CIRCUMSTANCES

${appealData.description || 'I was not in contravention of the parking restrictions at the time and location specified. The circumstances surrounding this case demonstrate that no valid penalty charge should have been issued.'}

LEGAL BASIS

Under the Civil Enforcement of Parking Contraventions (England) General Regulations 2022, I have the right to make these representations. The issuing of this penalty charge notice was incorrect and does not meet the statutory requirements for a valid penalty charge.

EVIDENCE

${appealData.evidence?.map((e: any) => `• ${e.type}: ${e.description}`).join('\n') || '• I maintain that the circumstances did not constitute a contravention\n• The penalty charge notice was issued in error'}

REQUEST FOR CANCELLATION

In light of the above, I respectfully request that this penalty charge notice be cancelled immediately. I have provided sufficient evidence to demonstrate that the charge was issued incorrectly.

I look forward to your prompt response within the statutory timeframe.

Yours faithfully,

[Signature]
${userContext?.name || '[Your Name]'}

---
**LEGAL DISCLAIMER**: This appeal was generated using a standard template. While crafted to be legally sound, please review all details carefully and consider professional legal advice for complex cases. Ensure all specific details are accurate before submission.`;

    return template;
  }

  /**
   * Build a detailed, unique prompt for each appeal
   */
  private static buildDetailedPrompt(
    appealData: AppealData, 
    userId: string, 
    appealId?: string
  ): string {
    const timestamp = new Date().toISOString();
    const uniqueContext = `USER_${userId}_APPEAL_${appealId || 'NEW'}_${timestamp}`;
    
    return `Create a completely unique and personalized UK traffic appeal letter for this specific case:

CASE CONTEXT (${uniqueContext}):
- Penalty Type: ${appealData.reason || 'Not specified'}
- Ticket Number: ${appealData.ticketNumber || 'Not provided'}
- Issue Date: ${appealData.issueDate || 'Not specified'}
- Location: ${appealData.location || 'Not specified'}
- Vehicle Registration: ${appealData.vehicleRegistration || 'Not provided'}

APPELLANT CIRCUMSTANCES:
${appealData.description || 'Standard appeal circumstances'}

EVIDENCE AVAILABLE:
${appealData.evidence?.map((e: Evidence) => `- ${e.type}: ${e.description}`).join('\n') || 'No specific evidence listed'}

LEGAL GROUNDS:
Primary ground: ${appealData.reason || 'Contravention did not occur'}

REQUIREMENTS:
1. Create a formal representations letter following UK Civil Enforcement Regulations 2022
2. Include specific legal references appropriate to: ${appealData.reason}
3. Structure with clear sections: Introduction, Facts, Legal Basis, Evidence, Conclusion
4. Use unique language and approach - avoid any template-like phrases
5. Personalize based on the specific circumstances provided
6. Include deadline compliance statements
7. Request specific remedy (PCN cancellation)
8. Maintain professional legal tone throughout

Make this appeal completely unique and tailored to these specific circumstances. Do not use any generic template language.`;
  }

  /**
   * Add final personalization touches
   */
  private static addPersonalization(
    generatedAppeal: string, 
    appealData: AppealData, 
    userId: string, 
    appealId?: string
  ): string {
    const today = new Date().toLocaleDateString('en-GB');
    const referenceNumber = `REF: ${userId.slice(-6).toUpperCase()}-${appealId || 'NEW'}-${Date.now().toString().slice(-6)}`;
    
    // Add unique reference and date
    let personalizedAppeal = generatedAppeal;
    
    // Ensure unique reference number
    if (!personalizedAppeal.includes('REF:')) {
      personalizedAppeal = `${referenceNumber}\nDate: ${today}\n\n${personalizedAppeal}`;
    }
    
    // Add legal disclaimer
    personalizedAppeal += `\n\n---\n**LEGAL DISCLAIMER**: This appeal was generated using AI assistance based on UK traffic law. While crafted to be legally sound, please review all details carefully and consider professional legal advice for complex cases. Each appeal is uniquely generated for the specific circumstances provided.`;
    
    return personalizedAppeal;
  }

  /**
   * Generate unique appeal grounds based on case specifics
   */
  static async generateCustomGrounds(appealData: AppealData): Promise<string[]> {
    if (!process.env.OPENAI_API_KEY) {
      return this.getStaticGrounds(appealData.reason || '');
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a UK traffic law expert. Generate specific, unique legal grounds for appeals based on case details. Each response should be tailored to the specific circumstances."
          },
          {
            role: "user",
            content: `Generate 3-5 specific legal grounds for this appeal:
            
Type: ${appealData.reason}
Circumstances: ${appealData.description}
Location: ${appealData.location}
Evidence: ${appealData.evidence?.map((e: Evidence) => e.type).join(', ') || 'None specified'}

Provide grounds that are:
1. Specific to these circumstances
2. Based on UK Civil Enforcement Regulations 2022
3. Legally accurate and defensible
4. Unique to this case`
          }
        ],
        temperature: 0.6,
        max_tokens: 500,
      });

      const grounds = response.choices[0]?.message?.content?.split('\n').filter(line => line.trim());
      return grounds || this.getStaticGrounds(appealData.reason || '');

    } catch (error) {
      console.error('Error generating custom grounds:', error);
      return this.getStaticGrounds(appealData.reason || '');
    }
  }

  /**
   * Fallback static grounds if AI fails
   */
  private static getStaticGrounds(reason: string): string[] {
    // Fallback to static grounds if AI is unavailable
    const staticGrounds = {
      'no_contravention': ['The alleged contravention did not occur'],
      'signage_issue': ['Inadequate signage as per TSRGD 2016'],
      'emergency': ['Emergency circumstances justified the action'],
      'default': ['The penalty charge notice was issued in error']
    };

    const key = Object.keys(staticGrounds).find(k => reason.toLowerCase().includes(k)) || 'default';
    return staticGrounds[key as keyof typeof staticGrounds];
  }
}

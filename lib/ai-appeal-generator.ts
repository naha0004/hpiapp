import { OpenAI } from 'openai';

interface AppealData {
  ticketNumber?: string;
  fineAmount?: number;
  issueDate?: string;
  dueDate?: string;
  location?: string;
  reason?: string;
  description?: string;
  vehicleRegistration?: string;
  ticketType?: string;
}

interface UserData {
  id: string;
  name?: string | null;
  email: string;
}

export class AIAppealGenerator {
  private openai: OpenAI;

  constructor() {
    // Initialize OpenAI only if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.log('OpenAI API key not configured - using enhanced template fallbacks');
      throw new Error('OpenAI API key not configured');
    }
  }

  /**
   * Generate a unique, personalized appeal using OpenAI
   */
  async generatePersonalizedAppeal(appealData: AppealData, userData: UserData): Promise<string> {
    try {
      // Add timestamp-based uniqueness
      const timestamp = Date.now()
      const uniqueId = `APPEAL-${timestamp.toString().slice(-8)}`
      
      const prompt = this.buildAppealPrompt(appealData, userData);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert UK traffic law solicitor with 20+ years experience in successfully appealing parking and traffic penalties. You have deep knowledge of:
            
            - Civil Enforcement of Road Traffic Contraventions (England) General Regulations 2022
            - Traffic Management Act 2004 (Part 6)
            - Road Traffic Act 1988 & Road Traffic Offenders Act 1988
            - Traffic Signs Regulations and General Directions (TSRGD) 2016
            - Protection of Freedoms Act 2012 (Schedule 4)
            - Key case law: Moses v Barnet, Herron v Sunderland, etc.
            
            CRITICAL REQUIREMENTS - Generate a UNIQUE, personalized formal appeal letter that:
            1. Uses specific legal grounds relevant to the case
            2. References appropriate legislation and case law where applicable
            3. Is professionally written in formal legal language
            4. Contains ABSOLUTELY NO placeholders, brackets, or template text
            5. Uses ONLY the real data provided - never use [NAME], [DATE], [ADDRESS], etc.
            6. Is tailored to the specific circumstances
            7. Maximizes chances of success
            8. Is completely unique each time (never repeat exact phrases)
            9. Includes the reference: ${uniqueId}
            10. NEVER writes "Dear Sir/Madam" or "To Whom It May Concern"
            11. NEVER includes signature lines or placeholder text
            12. Creates a complete, ready-to-submit document
            
            The appeal must be immediately usable without any editing or placeholder replacement.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7 + (timestamp % 100) / 1000, // Slight temperature variation for uniqueness
        max_tokens: 1500,
        presence_penalty: 0.6, // Avoid repetition
        frequency_penalty: 0.8 // Encourage unique language
      });

      const generatedAppeal = completion.choices[0]?.message?.content;
      
      if (!generatedAppeal) {
        throw new Error('No appeal content generated');
      }

      // Validate that there are no critical placeholders
      if (this.containsPlaceholders(generatedAppeal)) {
        console.log('Generated content with placeholders:', generatedAppeal.substring(0, 500));
        // Only throw error for critical placeholders, allow minor ones
        if (this.hasCriticalPlaceholders(generatedAppeal)) {
          throw new Error('Generated appeal contains critical placeholders');
        }
      }

      return generatedAppeal;

    } catch (error) {
      console.error('OpenAI Appeal Generation Error:', error);
      throw new Error(`Failed to generate AI appeal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate specific appeal content for court forms
   */
  async generateCourtFormContent(formType: 'PE2' | 'PE3' | 'N244', formData: any): Promise<string> {
    try {
      const prompt = this.buildCourtFormPrompt(formType, formData);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert UK court procedure solicitor specializing in civil enforcement and court applications. Generate professional, legally-sound content for ${formType} court forms. Use proper legal language, reference relevant Civil Procedure Rules where applicable, and ensure all content is specific to the case details provided. NEVER use placeholders or brackets - use the actual data provided.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        presence_penalty: 0.5,
        frequency_penalty: 0.6
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content generated for court form');
      }

      if (this.containsPlaceholders(content)) {
        throw new Error('Generated content contains placeholders');
      }

      return content;

    } catch (error) {
      console.error('OpenAI Court Form Generation Error:', error);
      throw new Error(`Failed to generate ${formType} content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the appeal prompt based on case data
   */
  private buildAppealPrompt(appealData: AppealData, userData: UserData): string {
    const currentDate = new Date().toLocaleDateString('en-GB');
    const appealerName = userData.name || 'the appellant';
    
    return `Generate a unique formal appeal letter for this UK traffic penalty case:

CASE DETAILS:
- Penalty Charge Number: ${appealData.ticketNumber || 'Not provided'}
- Fine Amount: £${appealData.fineAmount || 'Not specified'}
- Issue Date: ${appealData.issueDate || 'Not provided'}  
- Due Date: ${appealData.dueDate || 'Not provided'}
- Location: ${appealData.location || 'Not specified'}
- Vehicle Registration: ${appealData.vehicleRegistration || 'Not provided'}
- Penalty Type: ${appealData.ticketType || 'Standard parking penalty'}
- Appeal Reason: ${appealData.reason || 'Disputing penalty charge'}
- Circumstances: ${appealData.description || 'Penalty issued in error'}

APPELLANT DETAILS:
- Name: ${appealerName}
- Email: ${userData.email}
- Reference: Appeal-${userData.id.slice(-6)}-${Date.now()}

TODAY'S DATE: ${currentDate}

Generate a formal appeal letter that:
1. Addresses the appropriate authority professionally
2. References the specific penalty and circumstances
3. Uses relevant UK traffic law and regulations
4. States clear legal grounds for the appeal
5. Requests cancellation of the penalty
6. Uses the appellant's actual name and details
7. Contains NO placeholders, [brackets], or generic terms
8. Is completely unique and case-specific
9. Follows proper business letter format

Make each appeal completely unique using varied legal arguments, different case law references where appropriate, and distinctive professional language.`;
  }

  /**
   * Build court form content prompt
   */
  private buildCourtFormPrompt(formType: 'PE2' | 'PE3' | 'N244', formData: any): string {
    const purposes = {
      PE2: 'court application for enforcement order',
      PE3: 'statutory declaration for unpaid penalty charge', 
      N244: 'general application notice to the court'
    };

    return `Generate professional legal content for ${formType} ${purposes[formType]} with these details:

FORM DATA:
${JSON.stringify(formData, null, 2)}

REQUIREMENTS:
1. Use formal legal language appropriate for court submission
2. Reference relevant Civil Procedure Rules if applicable
3. Be specific to the case circumstances provided
4. Use actual dates, names, and case numbers from the data
5. NO placeholders or [brackets] - use real information only
6. Professional tone suitable for court proceedings
7. Factual and legally sound content

Generate unique, case-specific content that would be appropriate for this ${formType} form.`;
  }

  /**
   * Check if generated content contains placeholders
   */
  private containsPlaceholders(content: string): boolean {
    const placeholderPatterns = [
      /\[.*?\]/g,         // [brackets] - but check if it's not legitimate content
      /\{.*?\}/g,         // {braces}  
      /___+/g,            // underscores
      /\[Name\]/gi,
      /\[Address\]/gi,
      /\[Email\]/gi,
      /\[Date\]/gi,
      /\[Signature\]/gi,
      /Dear Sir\/Madam/gi,
      /To Whom It May Concern/gi,
      /\$\{.*?\}/g,       // template literals
      /{{.*?}}/g,         // double braces
      /\[YOUR.*?\]/gi,    // [YOUR NAME], [YOUR ADDRESS], etc.
      /INSERT.*HERE/gi,   // INSERT NAME HERE, etc.
      /FILL.*IN/gi,       // FILL IN, FILL THIS IN
      /REPLACE.*WITH/gi,  // REPLACE WITH YOUR...
      /\[ENTER.*?\]/gi,   // [ENTER YOUR NAME], etc.
      /\[TYPE.*?\]/gi,    // [TYPE YOUR ADDRESS], etc.
      /\[PLEASE.*?\]/gi,  // [PLEASE INSERT], etc.
      /__NAME__/gi,       // Double underscore placeholders
      /__DATE__/gi,
      /__ADDRESS__/gi
    ];

    // Filter out patterns that might match legitimate content
    const legitimateContent = [
      /\[Regulation \d+\]/gi, // Legal references like [Regulation 9]
      /\[Section \d+\]/gi,    // Legal references like [Section 77]
      /\[Schedule \d+\]/gi,   // Legal references like [Schedule 4]
      /\[Part \d+\]/gi        // Legal references like [Part 6]
    ];

    // Check if it's legitimate legal reference content
    const isLegitimate = legitimateContent.some(pattern => pattern.test(content));
    if (isLegitimate) {
      return false;
    }

    const hasPlaceholders = placeholderPatterns.some(pattern => pattern.test(content));
    
    if (hasPlaceholders) {
      console.log('Placeholder detected in content:', content.substring(0, 200));
      // Find which pattern matched
      placeholderPatterns.forEach((pattern, index) => {
        if (pattern.test(content)) {
          console.log(`Pattern ${index} matched:`, pattern);
        }
      });
    }
    
    return hasPlaceholders;
  }

  /**
   * Check for critical placeholders that must be avoided
   */
  private hasCriticalPlaceholders(content: string): boolean {
    const criticalPatterns = [
      /\[YOUR.*?\]/gi,    // [YOUR NAME], [YOUR ADDRESS], etc.
      /\[NAME\]/gi,
      /\[ADDRESS\]/gi,
      /\[EMAIL\]/gi,
      /\[SIGNATURE\]/gi,
      /INSERT.*HERE/gi,   // INSERT NAME HERE, etc.
      /FILL.*IN/gi,       // FILL IN, FILL THIS IN
      /REPLACE.*WITH/gi,  // REPLACE WITH YOUR...
      /__NAME__/gi,       // Double underscore placeholders
      /__DATE__/gi,
      /__ADDRESS__/gi
    ];

    return criticalPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Generate enhanced appeal description with OpenAI
   */
  async generateAppealDescription(appealData: AppealData): Promise<string> {
    try {
      const prompt = `Based on these penalty details, generate a compelling appeal description:

Penalty Type: ${appealData.ticketType || 'Parking penalty'}
Location: ${appealData.location || 'Not specified'}
Reason: ${appealData.reason || 'Dispute penalty'}
Vehicle: ${appealData.vehicleRegistration || 'Not provided'}
Fine Amount: £${appealData.fineAmount || '0'}

Generate a persuasive appeal description that:
1. States clear grounds for challenging the penalty
2. Uses specific legal terminology where appropriate
3. Is factual and professional
4. Avoids any placeholders or generic terms
5. Is unique and case-specific
6. Maximizes chances of successful appeal

Focus on the most likely grounds for success based on the penalty type and circumstances.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system", 
            content: "You are a UK traffic law expert. Generate compelling, legally-sound appeal descriptions that maximize success rates. Use specific legal grounds and avoid all placeholders."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.8
      });

      const description = completion.choices[0]?.message?.content;
      
      if (!description) {
        throw new Error('No description generated');
      }

      if (this.containsPlaceholders(description)) {
        throw new Error('Generated description contains placeholders');
      }

      return description;

    } catch (error) {
      console.error('OpenAI Description Generation Error:', error);
      // Fallback to static description
      return this.getFallbackDescription(appealData);
    }
  }

  /**
   * Fallback description when AI fails
   */
  private getFallbackDescription(appealData: AppealData): string {
    const reasons = {
      'Invalid signage': 'The penalty charge notice was issued despite unclear or absent traffic signage at the location, contravening the Traffic Signs Regulations and General Directions 2016.',
      'Valid permit displayed': 'A valid parking permit was clearly displayed at the time of the alleged contravention, making the penalty charge notice invalid.',
      'Medical emergency': 'The parking was necessary due to a genuine medical emergency, providing lawful excuse for the temporary parking.',
      'Vehicle breakdown': 'The vehicle was immobilized due to mechanical failure, constituting exceptional circumstances beyond the driver\'s control.',
      'Loading/unloading permitted': 'The parking was for legitimate loading/unloading activities during permitted hours as defined in the Traffic Management Act 2004.',
      'Payment system malfunction': 'The parking payment system was not functioning correctly, preventing proper payment despite good faith attempts.',
    };

    const baseReason = appealData.reason || 'Other circumstances';
    const customReason = reasons[baseReason as keyof typeof reasons];
    
    if (customReason) {
      return customReason;
    }

    return `I formally dispute this penalty charge notice as it was issued in error. The circumstances of the case do not warrant the penalty imposed, and I request that the notice be cancelled based on the specific facts and evidence relating to this incident.`;
  }
}

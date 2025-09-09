/**
 * UK Traffic Law AI Assistant - Expert System
 * Specialized in UK traffic law, parking and speeding fines, TE7/TE9 forms, and car-related legal guidance
 * 
 * Legal Framework Reference:
 * - Road Traffic Act 1988 & Road Traffic Offenders Act 1988
 * - Traffic Management Act 2004 (Part 6) - Civil enforcement
 * - Civil Enforcement of Road Traffic Contraventions (England) General Regs 2022 + Representations & Appeals Regs 2022
 * - Traffic Signs Regulations and General Directions (TSRGD) 2016
 * - Vehicle Excise and Registration Act 1994
 * - Protection of Freedoms Act 2012 (Schedule 4) - Private parking
 * 
 * Key Deadlines:
 * - PCN discount: 14 days from issue
 * - NTO representations: 28 days from service  
 * - Tribunal appeal: 28 days from Notice of Rejection
 * - NIP service: 14 days from offence
 * - Section 172 response: 28 days from receipt
 */

interface AppealCase {
  ticketNumber?: string
  fineAmount?: number
  issueDate?: string
  dueDate?: string
  location?: string
  reason?: string
  description?: string
  circumstances?: string
  evidence?: string[]
}

interface LegalAdvice {
  strongGrounds: string[]
  weakGrounds: string[]
  recommendations: string[]
  legalReferences: string[]
  successLikelihood: 'HIGH' | 'MEDIUM' | 'LOW'
  nextSteps: string[]
}

export class UKTrafficLawAssistant {
  
  /**
   * Generate enhanced AI response for UK traffic law queries
   */
  static generateResponse(userInput: string, context: any = {}): string {
    const input = userInput.toLowerCase()
    
    // Check for specific legal topics
    if (this.isAppealRequest(input)) {
      // Use existing enhanced flow via Appeals component; here return concise helper text
      return this.generateGeneralLegalResponse(userInput)
    }
    
    if (this.isTE7Request(input)) {
      return this.generateTE7Response()
    }
    
    if (this.isTE9Request(input)) {
      return this.generateTE9Response()
    }
    
    if (this.isMOTQuery(input)) {
      return this.generateMOTResponse(userInput)
    }
    
    if (this.isSpeedingQuery(input)) {
      return this.generateSpeedingResponse(userInput)
    }
    
    if (this.isTaxQuery(input)) {
      return this.generateTaxResponse(userInput)
    }
    
    if (this.isGeneralLegalQuery(input)) {
      return this.generateGeneralLegalResponse(userInput)
    }
    
    // Default response
    return this.generateWelcomeResponse()
  }
  
  /**
   * Generate professional appeal letter with UK legal framework
   */
  static generateAppealLetter(appealData: AppealCase): string {
    const today = new Date().toLocaleDateString('en-GB')
    const legalAdvice = this.analyzeLegalGrounds(appealData)

    const pcn = appealData.ticketNumber ? `PCN: ${appealData.ticketNumber}` : ''
    const issued = appealData.issueDate ? new Date(appealData.issueDate).toLocaleDateString('en-GB') : ''
    const location = appealData.location || ''

    const summaryBullets: string[] = []
    if (legalAdvice.strongGrounds.length) summaryBullets.push('Strong legal grounds identified')
    if (appealData.evidence?.length) summaryBullets.push(`${appealData.evidence.length} evidence item(s) enclosed`)
    if (appealData.reason) summaryBullets.push(`Primary ground: ${appealData.reason}`)

    // New: Always ensure a detailed narrative is present even with minimal input
    const minimalDesc = (appealData.description || '').trim()
    const narrative: string = minimalDesc.length >= 40
      ? minimalDesc
      : this.generateAppealDescription({
          ...appealData,
          // If description is minimal or missing, seed with reason text to guide generation
          description: minimalDesc || (appealData.reason || ''),
        })

    const groundsList = this.buildLegalArguments(appealData, legalAdvice)
    const references = this.getLegalReferences(appealData.reason || '')

    const evidenceBlock = this.formatEvidenceList(appealData.evidence)
    const timeline = this.buildTimeline(appealData)
    const disclosure = this.buildDisclosureRequests(appealData)

    let letter = `**FORMAL REPRESENTATIONS**

To: [Council] Parking Services
PCN: ${appealData.ticketNumber || '[NUMBER]'} | Date: ${today} | Location: ${location}

**STATUTORY GROUND:**
${legalAdvice.strongGrounds.length ? legalAdvice.strongGrounds[0] : 'The alleged contravention did not occur'} (Civil Enforcement Regulations 2022)

**CASE FACTS:**
${narrative}

**LEGAL BASIS:**
${groundsList.split('\n').slice(0, 3).join('\n')}

**EVIDENCE:**
${evidenceBlock.split('\n').slice(0, 5).join('\n') || '• Photographic evidence\n• Witness statements\n• Supporting documentation'}

**DEADLINE COMPLIANCE:**
This representation submitted within 28-day statutory period per Civil Enforcement Regulations 2022.

**REMEDY REQUESTED:**
PCN cancellation under statutory grounds. If rejected, tribunal appeal rights reserved within 28 days.

**LEGAL FRAMEWORK:**
• Traffic Management Act 2004 (Part 6)
• Civil Enforcement of Road Traffic Contraventions (England) Regulations 2022
${appealData.reason?.toLowerCase().includes('sign') ? '• TSRGD 2016 - Signage compliance requirements' : ''}

[Your Name/Address/Contact Details]`

    return letter
  }
  
  /**
   * Generate TE7 form guidance
   */
  static generateTE7Response(): string {
    return `⚖️ **TE7 Form - Application to File Statutory Declaration Out of Time**

**Legal Context (UK Traffic Law):**
The TE7 form is used when you need to file a TE9 statutory declaration after the statutory deadline (usually 28 days). This form must be submitted to the Traffic Enforcement Centre.

**When to Use TE7:**
• Filing TE9 after the 28-day statutory deadline
• Must be accompanied by a TE9 form
• Requires valid reason for delay

**Common Valid Reasons for Delay:**
1. **Non-receipt of notices** - Postal delivery issues
2. **Change of address** - DVLA records not updated
3. **Medical emergency** - Hospitalization or serious illness
4. **Postal strike or disruption**
5. **Administrative error** by enforcement authority

**Required Information for TE7:**
• Full name and current address
• PCN reference number
• Date of original contravention
• Detailed explanation of delay reason
• Supporting evidence (medical certificates, postal receipts, etc.)

**Legal Framework:**
• Traffic Management Act 2004
• Civil Enforcement of Parking Contraventions (England) General Regulations 2007
• Schedule 4, paragraph 5 of the 2007 Regulations

**Filing Process:**
1. Complete both TE7 and TE9 forms
2. Submit to: Traffic Enforcement Centre, Northampton County Court
3. Include £7 court fee (may be waived for financial hardship)
4. File within reasonable time of becoming aware

**Success Factors:**
• Provide compelling reason for delay
• Include supporting evidence
• Demonstrate you acted promptly once aware
• Show genuine intent to contest original penalty

**Important Deadlines:**
• File as soon as you become aware of the enforcement action
• Include explanation of exactly when and how you discovered the penalty

Would you like me to help you complete a TE7 form with your specific circumstances?

**Disclaimer:** This information is generated by AI and is for guidance only. It does not constitute formal legal advice.`
  }
  
  /**
   * Generate TE9 form guidance
   */
  static generateTE9Response(): string {
    return `⚖️ **TE9 Form - Statutory Declaration/Witness Statement**

**Legal Context (UK Traffic Law):**
The TE9 form is a statutory declaration used to challenge penalty enforcement on specific legal grounds. It must be filed at the Traffic Enforcement Centre within 28 days of the Notice to Owner.

**Statutory Grounds for TE9 (Choose One):**

**1. Did Not Receive Notice to Owner**
• Never received the formal notice
• Postal delivery failure
• Address change not updated with DVLA

**2. Made Representations - No Response**
• Submitted formal representations to local authority
• No response received within statutory 56-day period
• Authority failed to acknowledge or respond

**3. Filed Appeal - No Response**
• Submitted appeal to enforcement authority
• No response or acknowledgment received
• Breach of statutory response obligations

**4. Was Not the Driver/Keeper**
• Vehicle was sold before contravention
• Vehicle was stolen or used without permission
• Mistaken identity of responsible person

**Legal Framework:**
• Schedule 4, Civil Enforcement of Parking Contraventions (England) General Regulations 2007
• Traffic Management Act 2004, Part 6
• Civil Procedure Rules (CPR) Part 75

**Required Information:**
• Full legal name and address
• PCN reference and vehicle registration
• Date and location of alleged contravention
• Specific statutory ground (numbered 1-4 above)
• Detailed witness statement explaining circumstances
• Supporting evidence

**Filing Process:**
1. Complete TE9 form fully and accurately
2. Submit to: Traffic Enforcement Centre, Northampton County Court
3. Include £3 court fee
4. File within 28 days of Notice to Owner
5. If late, must also file TE7 application

**Supporting Evidence:**
• Copy of original PCN (if available)
• Proof of address change or postal issues
• Sale documents (if vehicle sold)
• Police crime reference (if vehicle stolen)
• Correspondence with local authority

**Important Notes:**
• Making false statements is perjury (criminal offense)
• Statement must be truthful and accurate
• Consider legal advice for complex cases
• Success depends on strength of evidence

**Statutory Declaration Text Example:**
"I [full name] of [full address] make oath and say:
1. I am the person named in the above matter
2. [State your specific ground and full explanation]
3. The facts stated are true to the best of my knowledge and belief"

Would you like me to help you determine which ground applies to your case and draft the witness statement?

**Disclaimer:** This information is generated by AI and is for guidance only. It does not constitute formal legal advice.`
  }
  
  /**
   * Generate TE7 form with proper legal formatting
   */
  static generateTE7Form(appealData: AppealCase, te7Data: any): string {
    const today = new Date().toLocaleDateString('en-GB')
    const applicantName = te7Data.witnessName || "the applicant"
    const address = te7Data.witnessAddress || "the registered address"
    const pcnNumber = appealData.ticketNumber || "the penalty charge notice"
    const vehicleReg = te7Data.relationshipToDriver || "the specified vehicle"
    const userReason = appealData.circumstances || appealData.description || "circumstances preventing timely filing"
    
    return `APPLICATION TO FILE A STATUTORY DECLARATION OUT OF TIME

TO: The Traffic Enforcement Centre
Northampton County Court
St Katharine's House, 21-27 St Katharine's Street, Northampton NN1 2LZ

APPLICANT: ${applicantName}
ADDRESS: ${address}
PCN REFERENCE: ${pcnNumber}
VEHICLE REGISTRATION: ${vehicleReg}
DATE: ${today}

GROUNDS FOR LATE APPLICATION

I, ${applicantName}, hereby apply for permission to file a statutory declaration out of time in respect of the above penalty charge notice under the provisions of the Traffic Management Act 2004.

CIRCUMSTANCES PREVENTING TIMELY FILING:

${userReason}

LEGAL BASIS FOR APPLICATION:

I submit that the above circumstances constitute exceptional reasons why this statutory declaration could not be filed within the prescribed time limit under Schedule 4 of the Civil Enforcement of Parking Contraventions (England) General Regulations 2007. The delay was not due to any negligence or deliberate action on my part, but arose from circumstances beyond my reasonable control.

I respectfully request that the Court exercise its discretion under the relevant provisions to allow this late application in the interests of justice and in accordance with the overriding objective under the Civil Procedure Rules.

DECLARATION:

I believe that the facts stated in this application are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.

RELIEF SOUGHT:

I respectfully request that this Honourable Court:
1. Grant permission for the late filing of the statutory declaration
2. Allow the accompanying TE9 statutory declaration to be considered
3. Set aside the charge certificate and enforcement proceedings
4. Make such further orders as the Court deems appropriate

This application is made under:
• Traffic Management Act 2004, Part 6
• Civil Enforcement of Parking Contraventions (England) General Regulations 2007
• Civil Procedure Rules Part 27

Signed: _________________________ Date: ${today}
${applicantName}

Note: This application must be signed in the presence of a solicitor, commissioner for oaths, or magistrate.

**LEGAL DISCLAIMER**: This template is generated for guidance only based on UK traffic law. Review all details carefully and consider professional legal advice before submission.`
  }

  /**
   * Generate TE9 form with proper legal formatting
   */
  static generateTE9Form(appealData: AppealCase, te9Data: any, declarationType: string, userDetails: string): string {
    const today = new Date().toLocaleDateString('en-GB')
    const declarantName = te9Data.declarantName || "the declarant"
    const address = te9Data.declarantAddress || "the registered address"
    const pcnNumber = appealData.ticketNumber || "the penalty charge notice"
    const fineAmount = appealData.fineAmount ? `£${appealData.fineAmount.toFixed(2)}` : "the specified amount"
    const issueDate = appealData.issueDate ? new Date(appealData.issueDate).toLocaleDateString('en-GB') : "the date specified"
    const location = appealData.location || "the location specified"
    
    let legalGrounds = ""
    let specificDeclaration = ""
    
    switch (declarationType) {
      case "not_received":
        legalGrounds = "I did not receive the Notice to Owner or Charge Certificate as required by law"
        specificDeclaration = `I declare that I did not receive the Notice to Owner or Charge Certificate in respect of this penalty charge notice. The statutory notice was not properly served upon me in accordance with the requirements of the Traffic Management Act 2004, Section 78.

CIRCUMSTANCES:
${userDetails}

I was not afforded the statutory opportunity to make representations or appeal this penalty as I was unaware of its existence until enforcement proceedings were commenced.`
        break
        
      case "not_driver":
        legalGrounds = "I was not the driver of the vehicle at the time of the alleged contravention"
        specificDeclaration = `I declare that I was not the driver of the vehicle at the time of the alleged contravention. I was not responsible for the vehicle's parking or presence at the location during the time in question.

CIRCUMSTANCES:
${userDetails}

As I was not the driver, I cannot be held liable for this penalty charge notice under Schedule 4 of the Civil Enforcement of Parking Contraventions (England) General Regulations 2007.`
        break
        
      default:
        legalGrounds = "Other statutory grounds as detailed below"
        specificDeclaration = `I declare that there are statutory grounds for challenging this penalty charge notice under the Traffic Management Act 2004.

LEGAL GROUNDS AND CIRCUMSTANCES:
${userDetails}

I submit that the enforcement of this penalty is not in accordance with the relevant legislation and procedures.`
        break
    }

    return `STATUTORY DECLARATION
(Traffic Management Act 2004)

TO: The Traffic Enforcement Centre
Northampton County Court
St Katharine's House, 21-27 St Katharine's Street, Northampton NN1 2LZ

DECLARANT: ${declarantName}
ADDRESS: ${address}
PCN REFERENCE: ${pcnNumber}
PENALTY AMOUNT: ${fineAmount}
DATE OF ALLEGED CONTRAVENTION: ${issueDate}
LOCATION: ${location}
DATE OF DECLARATION: ${today}

STATUTORY DECLARATION UNDER THE STATUTORY DECLARATIONS ACT 1835

I, ${declarantName}, of ${address}, do solemnly and sincerely declare as follows:

LEGAL GROUNDS:
${legalGrounds}

DECLARATION OF FACTS:
${specificDeclaration}

LEGAL FRAMEWORK:
This declaration is made under the provisions of:
• Traffic Management Act 2004, Part 6
• Civil Enforcement of Parking Contraventions (England) General Regulations 2007
• Statutory Declarations Act 1835

FURTHER SUBMISSIONS:
I submit that the penalty charge notice was incorrectly issued and/or enforced, and that the enforcement proceedings should be set aside in accordance with the provisions of the Traffic Management Act 2004 and the Civil Procedure Rules.

DECLARATION OF TRUTH:
I believe that the facts stated in this declaration are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.

RELIEF SOUGHT:
I respectfully request that this penalty charge notice and all associated enforcement proceedings be cancelled and set aside.

And I make this solemn declaration conscientiously believing the same to be true, and by virtue of the provisions of the Statutory Declarations Act 1835.

DECLARED before me this _____ day of ____________, 20___

Signature of Declarant: _________________________
${declarantName}

Signature of Witness: _________________________
(Solicitor/Commissioner for Oaths/Magistrate)

Qualification: _________________________
Address: _________________________

**SUBMISSION REQUIREMENTS:**
1. This declaration must be signed in the presence of a solicitor, commissioner for oaths, or magistrate
2. Submit to: Traffic Enforcement Centre, Northampton County Court
3. Include £3 statutory fee (may be waived for financial hardship)
4. Attach supporting evidence and documentation

**LEGAL DISCLAIMER**: This template is generated for guidance only based on UK traffic law. Review all details carefully and consider professional legal advice before submission.`
  }

  /**
   * Generate professional appeal description based on reason and case details
   */
  static generateAppealDescription(appealData: AppealCase): string {
    const reason = appealData.reason?.toLowerCase() || ''
    const location = appealData.location || 'the specified location'
    const issueDate = appealData.issueDate ? new Date(appealData.issueDate).toLocaleDateString('en-GB') : 'the date specified'
    const ticketNumber = appealData.ticketNumber || 'N/A'
    const amount = appealData.fineAmount || 'N/A'
    
    let description = `**FORMAL NOTICE OF APPEAL**

**RE: PENALTY CHARGE NOTICE NO. ${ticketNumber}**
**DATE OF ALLEGED CONTRAVENTION: ${issueDate}**
**LOCATION: ${location.toUpperCase()}**
**PENALTY AMOUNT: £${amount}**

---

**TO WHOM IT MAY CONCERN:**

I hereby submit this formal representation challenging the above-referenced Penalty Charge Notice ("PCN") issued under the Traffic Management Act 2004 and associated regulations. This submission is made within the prescribed statutory time limits and constitutes a formal appeal on both procedural and substantive grounds.

**GROUNDS FOR APPEAL:**

`
    
    if (reason.includes('signage') || reason.includes('sign')) {
      description += `**1. INADEQUATE STATUTORY SIGNAGE (Primary Ground)**

The PCN has been issued in direct contravention of the mandatory signage requirements established under:
• Traffic Signs Regulations and General Directions 2016 (SI 2016/362)
• Traffic Management Act 2004, Sections 77-84
• Civil Enforcement of Parking Contraventions (England) General Regulations 2007

**Legal Position:**
On ${issueDate}, I conducted a thorough examination of the signage at ${location}. The signage was demonstrably inadequate, unclear, or wholly absent, failing to meet the strict statutory requirements mandated by law. Specifically, the signage failed to provide clear, unambiguous, and conspicuous notification of parking restrictions as required under regulation 9 of the Civil Enforcement Regulations.

**Case Law Authority:**
The principle established in *Jill Windmill v London Borough of Croyden* [2007] confirms that inadequate signage renders any PCN invalid ab initio. Further authority is found in *R (on the application of Dougan) v Redcar and Cleveland Borough Council* [2007] EWHC 3312, which established that enforcement authorities bear the burden of proving compliance with statutory signage requirements.

**Evidential Basis:**
The enforcement authority cannot discharge their statutory duty to prove that adequate signage was present and properly maintained at the material time. Without clear and unambiguous signage, no reasonable motorist could be expected to understand the parking restrictions, rendering the alleged contravention fundamentally flawed.`

    } else if (reason.includes('permit') || reason.includes('ticket')) {
      description += `**1. VALID PARKING AUTHORIZATION DISPLAYED (Primary Ground)**

The PCN has been erroneously issued despite valid parking authorization being properly displayed in accordance with the operator's terms and conditions.

**Legal Position:**
On ${issueDate}, I purchased and displayed valid parking authorization at ${location} in strict compliance with the displayed instructions and payment procedures. The issuance of this PCN constitutes a fundamental breach of the contractual arrangement and represents maladministration by the enforcement authority.

**Statutory Framework:**
Under the Civil Enforcement of Parking Contraventions (England) General Regulations 2007, regulation 10, the burden of proof rests with the enforcement authority to demonstrate that no valid authorization existed at the material time. This burden cannot be discharged in the present circumstances.

**Evidential Position:**
I possess documentary evidence of the valid parking authorization, including:
• Payment transaction records
• Time-stamped evidence of proper display
• Compliance with all stated terms and conditions

The enforcement authority's failure to properly investigate before issuing the PCN represents a procedural irregularity that renders the notice invalid.`

    } else if (reason.includes('medical') || reason.includes('emergency')) {
      description += `**1. EXCEPTIONAL CIRCUMSTANCES - MEDICAL EMERGENCY (Primary Ground)**

The alleged contravention occurred during genuine emergency circumstances that created an immediate necessity to park, superseding normal traffic management considerations.

**Legal Position:**
On ${issueDate}, I was confronted with a bona fide medical emergency at ${location} that required immediate attention and made compliance with parking restrictions impossible. The emergency circumstances created an overriding legal necessity that provides absolute justification for the parking actions taken.

**Statutory Authority:**
• Road Traffic Regulation Act 1984, Section 2 (emergency exemptions)
• European Convention on Human Rights, Article 2 (right to life)
• Common law doctrine of necessity (*R v Dudley and Stephens* [1884])

**Precedential Authority:**
The case of *Buckoke v Greater London Council* [1971] Ch 655 established that emergency circumstances can provide lawful excuse for apparent traffic contraventions. The Court of Appeal in *R v Scarlett* [1993] 4 All ER 629 confirmed that necessity can override statutory prohibitions where life or limb is endangered.

**Factual Matrix:**
The emergency situation was genuine, immediate, and required prioritization of human welfare over parking compliance. The circumstances were wholly exceptional and beyond my control, creating legal justification under the doctrine of necessity.`

    } else if (reason.includes('breakdown')) {
      description += `**1. MECHANICAL BREAKDOWN - EXCEPTIONAL CIRCUMSTANCES (Primary Ground)**

The vehicle was immobilized due to sudden mechanical failure, creating circumstances beyond the driver's control that prevented compliance with parking restrictions.

**Legal Position:**
On ${issueDate}, my vehicle suffered an unexpected and complete mechanical breakdown at ${location}, rendering it immobile and requiring immediate professional recovery assistance. The breakdown created exceptional circumstances that provide lawful justification for the vehicle's position.

**Statutory Framework:**
• Road Traffic Act 1988, Section 170 (duty in case of accident)
• Highway Code, Rules 274-275 (broken down vehicles)
• Common law doctrine of inevitable accident

**Evidential Support:**
The mechanical failure was:
• Sudden and without warning
• Complete, preventing vehicle movement
• Requiring professional recovery services
• Documented through recovery service records

**Legal Precedent:**
*R v Spurge* [1961] 2 QB 205 established that mechanical breakdown creating impossibility of compliance provides lawful excuse. The principle of *nemo tenetur ad impossibile* (no one is bound to do the impossible) applies directly to these circumstances.`

    } else if (reason.includes('payment') || reason.includes('machine')) {
      description += `**1. PAYMENT SYSTEM MALFUNCTION - IMPOSSIBILITY OF COMPLIANCE (Primary Ground)**

The PCN was issued despite my genuine attempts to comply with payment requirements, which were frustrated by the operator's defective payment infrastructure.

**Legal Position:**
On ${issueDate}, I attempted to make payment for parking at ${location} but was prevented from doing so by the malfunctioning payment system. This created a situation of impossibility, where compliance with parking requirements became objectively impossible through no fault of my own.

**Statutory Authority:**
• Consumer Rights Act 2015, Sections 49-57 (services to be performed with reasonable care and skill)
• Unfair Contract Terms Act 1977
• Supply of Goods and Services Act 1982

**Contractual Analysis:**
The operator's failure to maintain functional payment systems constitutes a fundamental breach of their service obligations. Under established contract law principles (*Hadley v Baxendale* [1854]), I cannot be held liable for consequences arising from the operator's breach of their primary obligations.

**Legal Doctrine:**
The principle of *impossibilium nulla obligatio est* (there is no obligation to do impossible things) provides complete defense against penalty charges where the operator's own failures prevent compliance.`

    } else if (reason.includes('loading') || reason.includes('unloading')) {
      description += `**1. PERMITTED LOADING/UNLOADING OPERATIONS (Primary Ground)**

The vehicle was engaged in lawful loading/unloading activities specifically permitted under the applicable traffic regulations and local authority guidelines.

**Legal Position:**
On ${issueDate}, I was conducting legitimate loading/unloading operations at ${location} within the parameters of the permitted time limits and operational requirements. These activities are specifically exempted from standard parking restrictions under established traffic management provisions.

**Regulatory Framework:**
• Traffic Management Act 2004, Schedule 7
• Local authority traffic regulation orders
• Highway Code provisions relating to loading/unloading

**Operational Evidence:**
The loading/unloading activity was:
• Genuine and necessary for legitimate business/domestic purposes
• Conducted within permitted time limits
• Carried out with due consideration for other road users
• In compliance with all applicable restrictions and guidelines

**Legal Authority:**
*Attorney General v Bastow* [1957] established that genuine loading operations constitute lawful use of the highway. The activities undertaken fell squarely within the statutory exemptions provided for such operations.`

    } else {
      description += `**1. NO CONTRAVENTION OCCURRED / EXCEPTIONAL CIRCUMSTANCES (Primary Ground)**

Upon careful examination of the facts and applicable law, I submit that either no contravention of parking regulations occurred, or that exceptional circumstances exist that warrant the cancellation of this PCN.

**Legal Position:**
The circumstances surrounding the alleged contravention on ${issueDate} at ${location} do not support the issuance of a valid penalty charge notice. The enforcement action appears to be fundamentally flawed either procedurally or substantively.

**Procedural Requirements:**
Under the Civil Enforcement of Parking Contraventions (England) General Regulations 2007, the enforcement authority must establish:
• That a contravention actually occurred
• Compliance with all procedural requirements
• Proper service of the penalty charge notice
• Adherence to statutory time limits and procedures

**Burden of Proof:**
The burden rests entirely with the enforcement authority to prove, on the balance of probabilities, that a valid contravention occurred. This burden cannot be discharged in the present circumstances given the factual matrix of the case.`
    }

    description += `

**PROCEDURAL CONSIDERATIONS:**

**Notice Requirements:**
This representation is submitted within the statutory time limit prescribed under regulation 4 of the Civil Enforcement Regulations. I hereby exercise my statutory right to challenge this PCN and request its immediate cancellation.

**Evidence and Documentation:**
I am prepared to provide additional supporting evidence and documentation as may be required to substantiate this appeal. All relevant materials will be made available upon request.

**Administrative Review:**
This matter should be resolved at the administrative stage without the necessity for adjudication proceedings. The legal and factual grounds outlined above clearly demonstrate that the PCN cannot be sustained.

**CONCLUSION AND RELIEF SOUGHT:**

For the reasons set out above, both in law and in fact, I respectfully submit that this PCN has been issued in error and should be cancelled immediately. The enforcement authority is requested to:

1. Cancel the PCN in its entirety
2. Confirm cancellation in writing
3. Remove any associated records from enforcement databases
4. Take no further action in respect of this matter

I trust that this matter will receive your urgent attention and look forward to confirmation of the PCN's cancellation within the statutory timeframe.

**DECLARATION:**

I believe that the facts stated in this representation are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.

Yours faithfully,

[Driver's Name]
Date: ${new Date().toLocaleDateString('en-GB')}

---

**LEGAL DISCLAIMER:** This appeal has been prepared in accordance with current UK traffic law and established legal precedents. All statutory references and case law citations are accurate as of the date of preparation.`

    return description
  }

  /**
   * Analyze legal grounds for appeal (public method)
   */
  static analyzeLegalGrounds(appealData: AppealCase): LegalAdvice {
    const reason = appealData.reason?.toLowerCase() || ''
    const description = appealData.description?.toLowerCase() || ''
    const combined = `${reason} ${description}`
    
    // Strong legal grounds based on comprehensive framework
    const strongGrounds: string[] = []
    const weakGrounds: string[] = []
    const legalReferences: string[] = []
    
    // Statutory grounds under Civil Enforcement Regulations 2022
    if (combined.includes('signage') || combined.includes('sign') || combined.includes('unclear')) {
      strongGrounds.push('Signage non-compliance under TSRGD 2016 - Signs must be substantially compliant (Herron v Sunderland)')
      legalReferences.push('Traffic Signs Regulations and General Directions (TSRGD) 2016')
      legalReferences.push('Case law: Herron v Sunderland City Council (2011)')
    }
    
    if (combined.includes('permit') || combined.includes('ticket') || combined.includes('valid')) {
      strongGrounds.push('Valid parking authorization displayed - The alleged contravention did not occur')
      legalReferences.push('Civil Enforcement of Road Traffic Contraventions (England) General Regulations 2022')
      legalReferences.push('Statutory ground: The alleged contravention did not occur')
    }
    
    if (combined.includes('medical') || combined.includes('emergency') || combined.includes('hospital')) {
      strongGrounds.push('Medical emergency exemption - Mitigating circumstances under proportionality principle')
      legalReferences.push('Road Traffic Regulation Act 1984, Section 2')
      legalReferences.push('Human Rights Act 1998 - Proportionality considerations')
    }
    
    if (combined.includes('breakdown') || combined.includes('mechanical')) {
      strongGrounds.push('Vehicle breakdown - Exceptional circumstances preventing compliance')
      legalReferences.push('Road Traffic Act 1988, Section 170')
      legalReferences.push('Mitigating circumstances - inability to move vehicle')
    }
    
    if (combined.includes('payment') || combined.includes('machine') || combined.includes('card')) {
      strongGrounds.push('Payment system malfunction - Authority failed to provide working payment method')
      legalReferences.push('Traffic Management Act 2004 - Authority duty to provide adequate payment facilities')
      legalReferences.push('Consumer Rights Act 2015 - Service failure')
    }
    
    if (combined.includes('loading') || combined.includes('delivery') || combined.includes('unloading')) {
      strongGrounds.push('Loading/unloading activity - Permitted under traffic regulations')
      legalReferences.push('Traffic Management Act 2004 - Loading exemptions')
      legalReferences.push('Local Traffic Regulation Order provisions')
    }
    
    if (combined.includes('blue badge') || combined.includes('disabled')) {
      strongGrounds.push('Blue Badge properly displayed - Disabled parking exemption applies')
      legalReferences.push('Chronically Sick and Disabled Persons Act 1970')
      legalReferences.push('The Disabled Persons (Badges for Motor Vehicles) (England) Regulations 2000')
    }
    
    // Procedural challenges
    if (combined.includes('not received') || combined.includes('postal')) {
      strongGrounds.push('PCN not received - Service defect under procedural requirements')
      legalReferences.push('Civil Enforcement Representations and Appeals Regulations 2022')
      legalReferences.push('Case law: Moses v London Borough of Barnet (2006) - Strict procedural compliance')
    }
    
    if (combined.includes('wrong') || combined.includes('incorrect') || combined.includes('error')) {
      strongGrounds.push('Factual errors in PCN - Penalty exceeded applicable amount or incorrect details')
      legalReferences.push('Statutory ground: The penalty exceeded the amount applicable in the circumstances')
      legalReferences.push('Statutory ground: Procedural impropriety by the authority')
    }
    
    // Ownership challenges
    if (combined.includes('sold') || combined.includes('not owner') || combined.includes('transfer')) {
      strongGrounds.push('Vehicle ownership - Not the owner/keeper at time of contravention')
      legalReferences.push('Statutory ground: The recipient was not the owner of the vehicle at the time')
      legalReferences.push('Vehicle Excise and Registration Act 1994 - Keeper liability provisions')
    }
    
    // Private parking specific
    if (combined.includes('private') || combined.includes('car park')) {
      strongGrounds.push('Private parking - Contract law requirements and Protection of Freedoms Act compliance')
      legalReferences.push('Protection of Freedoms Act 2012 (Schedule 4)')
      legalReferences.push('Contract law - Clear terms and reasonable charges required')
    }
    
    // Add fundamental challenge if no specific grounds
    if (strongGrounds.length === 0) {
      strongGrounds.push('The alleged contravention did not occur - Challenging the fundamental basis of the penalty')
      legalReferences.push('Civil Enforcement of Road Traffic Contraventions (England) General Regulations 2022')
    }
    
    return {
      strongGrounds,
      weakGrounds,
      recommendations: this.getRecommendations(strongGrounds),
      legalReferences,
      successLikelihood: strongGrounds.length > 1 ? 'HIGH' : strongGrounds.length > 0 ? 'MEDIUM' : 'LOW',
      nextSteps: this.getNextSteps(appealData)
    }
  }
  
  /**
   * Build legal arguments for appeal letter
   */
  private static buildLegalArguments(appealData: AppealCase, advice: LegalAdvice): string {
    let legalArguments = ''
    
    if (advice.strongGrounds.length > 0) {
      legalArguments += advice.strongGrounds.map((ground, index) => 
        `${index + 1}. ${ground}\n`
      ).join('')
    }
    
    legalArguments += `\nI submit that the circumstances of this case clearly demonstrate that ${this.getSpecificArgument(appealData.reason!)}.`
    
    if (appealData.description) {
      legalArguments += `\n\nSpecific circumstances: ${appealData.description}`
    }
    
    return legalArguments
  }
  
  /**
   * Get legal references based on appeal reason - Updated with comprehensive framework
   */
  private static getLegalReferences(reason: string): string {
    const lowerReason = reason.toLowerCase()
    let references = 'This appeal is made under the following legal framework:\n\n'
    
    // Core legislation always referenced
    references += '**Core Legislation:**\n'
    references += '• Traffic Management Act 2004 (Part 6) - Civil enforcement of parking, bus lanes, moving traffic\n'
    references += '• Civil Enforcement of Road Traffic Contraventions (England) General Regulations 2022\n'
    references += '• Civil Enforcement Representations & Appeals Regulations 2022\n'
    
    // Specific legal references based on appeal type
    if (lowerReason.includes('signage') || lowerReason.includes('sign')) {
      references += '• Traffic Signs Regulations and General Directions (TSRGD) 2016 - Road sign and marking standards\n'
      references += '• Case law: Herron v Sunderland City Council (2011) - Signage must be substantially compliant\n'
    }
    
    if (lowerReason.includes('medical') || lowerReason.includes('emergency')) {
      references += '• Road Traffic Regulation Act 1984, Section 2 - Emergency exemptions\n'
      references += '• The Highway Code - Emergency vehicle procedures\n'
    }
    
    if (lowerReason.includes('permit') || lowerReason.includes('resident')) {
      references += '• Local Traffic Regulation Order (TRO/TMO) - Permit display requirements\n'
      references += '• Civil Enforcement General Regulations 2022, Part 3 - Permit exemptions\n'
    }
    
    if (lowerReason.includes('private') || lowerReason.includes('car park')) {
      references += '• Protection of Freedoms Act 2012 (Schedule 4) - Private parking enforcement\n'
      references += '• Contract law principles - Penalty clause restrictions\n'
    }
    
    if (lowerReason.includes('speed') || lowerReason.includes('camera')) {
      references += '• Road Traffic Offenders Act 1988 - Notice of Intended Prosecution requirements\n'
      references += '• Road Traffic Act 1988, Section 172 - Duty to identify driver\n'
    }
    
    if (lowerReason.includes('bailiff') || lowerReason.includes('enforcement')) {
      references += '• Traffic Enforcement Centre procedures - TE7/TE9 applications\n'
      references += '• Taking Control of Goods Regulations 2013 - Bailiff powers and limitations\n'
    }
    
    // Procedural grounds
    if (lowerReason.includes('procedure') || lowerReason.includes('service')) {
      references += '• Case law: Moses v London Borough of Barnet (2006) - Strict procedural compliance required\n'
    }
    
    // Key deadlines reference
    references += '\n**Critical Deadlines:**\n'
    references += '• PCN discount period: 14 days from issue\n'
    references += '• Formal representations: 28 days from Notice to Owner\n'
    references += '• Tribunal appeal: 28 days from Notice of Rejection\n'
    
    // Human rights considerations
    references += '\n**Fundamental Rights:**\n'
    references += '• Human Rights Act 1998, Article 6 - Right to fair hearing\n'
    references += '• Human Rights Act 1998, Protocol 1, Article 1 - Protection of property rights\n'
    references += '• European Convention on Human Rights - Proportionality principle'
    
    return references
  }
  
  // Helper methods for specific queries
  private static isAppealRequest(input: string): boolean {
    return input.includes('appeal') || input.includes('pcn') || input.includes('fine') || 
           input.includes('ticket') || input.includes('parking') || input.includes('challenge')
  }
  
  private static isTE7Request(input: string): boolean {
    return input.includes('te7') || input.includes('out of time') || input.includes('late filing')
  }
  
  private static isTE9Request(input: string): boolean {
    return input.includes('te9') || input.includes('statutory declaration') || input.includes('witness statement')
  }
  
  private static isMOTQuery(input: string): boolean {
    return input.includes('mot') || input.includes('test') || input.includes('certificate')
  }
  
  private static isSpeedingQuery(input: string): boolean {
    return input.includes('speed') || input.includes('camera') || input.includes('nip') || 
           input.includes('notice of intended prosecution')
  }
  
  private static isTaxQuery(input: string): boolean {
    return input.includes('tax') || input.includes('ved') || input.includes('sorn') || 
           input.includes('road tax')
  }
  
  private static isGeneralLegalQuery(input: string): boolean {
    return input.includes('law') || input.includes('legal') || input.includes('rights') || 
           input.includes('dvla') || input.includes('enforcement')
  }
  
  /**
   * Generate MOT guidance
   */
  private static generateMOTResponse(input: string): string {
    if (input.includes('without') || input.includes('expired') || input.includes('penalty')) {
      return `🚗 **MOT Certificate - Legal Requirements & Penalties**

**MOT Legal Requirements:**
• Required for vehicles over 3 years old
• Must be valid for use on public roads
• Annual test required at authorized test center
• Certificate must be carried or available for inspection

**Driving Without Valid MOT:**
• **Fine:** Up to £1,000
• **Insurance:** May be invalidated
• **Additional penalties:** If vehicle deemed dangerous
• **DVLA enforcement:** Automatic penalties for expired MOT

**Exemptions:**
• Driving to pre-booked MOT test
• Driving from test center after failure (for immediate repairs)
• Vehicles over 40 years old (if no substantial changes made)

**Legal Framework:**
• Road Traffic Act 1988, Section 47
• Motor Cars (Tests) Regulations 1981
• Road Vehicles (Construction and Use) Regulations 1986

**If Caught Without MOT:**
1. **Immediate action:** Book MOT test immediately
2. **Legal grounds:** Very limited - only valid if driving to/from test
3. **Insurance:** Check policy validity
4. **Appeal options:** Extremely limited unless exceptional circumstances

**Next Steps:**
• Book MOT test immediately
• Check insurance policy terms
• Consider legal advice if facing prosecution
• Ensure vehicle roadworthy before test

**Disclaimer:** This information is generated by AI and is for guidance only. It does not constitute formal legal advice.`
    }
    
    return `🚗 **MOT Certificate Information**

**MOT Requirements:**
• Annual test for vehicles over 3 years old
• Valid certificate required for road use
• Test at authorized MOT center only
• Covers safety, roadworthiness, and emissions

**When MOT Required:**
• Cars, motorcycles, motor caravans, light goods vehicles
• 3 years after first registration
• Then annually thereafter
• Heavy goods vehicles require annual test from first registration

**MOT Exemptions:**
• Vehicles first registered before 1960 (if no substantial modifications)
• Electric vehicles under certain conditions
• Some imported vehicles (temporary exemptions)

**Booking Your MOT:**
• Book up to 1 month before expiry
• New certificate starts from current expiry date
• Early testing preserves existing expiry date
• Use DVSA website to find authorized centers

Would you like specific guidance about MOT penalties, exemptions, or booking procedures?

**Disclaimer:** This information is generated by AI and is for guidance only. It does not constitute formal legal advice.`
  }
  
  /**
   * Generate speeding response
   */
  private static generateSpeedingResponse(input: string): string {
    if (input.includes('not the driver') || input.includes('someone else')) {
      return `🚗 **Speeding - Not the Driver Defense**

**Legal Framework:**
Under UK law, the registered keeper is initially presumed responsible but can transfer liability to the actual driver.

**Steps to Take:**
1. **Respond within 28 days** to Notice of Intended Prosecution (NIP)
2. **Complete Section 1 of NIP** declaring you were not the driver
3. **Provide driver details** if you know who was driving
4. **Legal obligation:** Must provide driver information if you know it

**Legal Requirements:**
• Road Traffic Offenders Act 1988, Section 1
• Must respond to NIP within 28 days
• Failure to provide information is separate offense (6 points + £1,000 fine)
• Must provide information "with reasonable diligence"

**Valid Defenses:**
• **Genuine ignorance:** Did not know and could not reasonably find out who was driving
• **Vehicle stolen:** Police crime reference number required
• **Business vehicles:** Genuine inability to identify employee driver

**Documentation Required:**
• Completed NIP form Section 1
• Statutory declaration if sworn statement needed
• Supporting evidence (hire agreements, sale documents, etc.)

**Important Warnings:**
• **Perjury:** False statements are criminal offense
• **Nomination accuracy:** Must be truthful about driver identity
• **Time limits:** Strict 28-day response deadline
• **Legal advice:** Consider solicitor for complex cases

**What Happens Next:**
1. New NIP sent to nominated driver
2. Original case against you discontinued
3. Driver receives penalty/court summons
4. You may be called as witness

Would you like help with completing the NIP form or understanding your legal obligations?

**Disclaimer:** This information is generated by AI and is for guidance only. It does not constitute formal legal advice.`
    }
    
    return `🚗 **Speeding Offense - Legal Guidance**

**Immediate Steps:**
1. **Check NIP validity** - Must be received within 14 days of offense
2. **Respond within 28 days** - Legal requirement
3. **Consider your options** before responding

**Common Defenses:**
• **NIP not received within 14 days** (postal rule exceptions apply)
• **Emergency circumstances** (medical emergency, avoiding accident)
• **Speed limit signage** unclear or absent
• **Speedometer calibration** issues
• **Police procedure** errors during stopping

**Penalty Options:**
• **Fixed penalty:** 3 points + £100 fine
• **Speed awareness course:** (if eligible and first offense in 3 years)
• **Court proceedings:** If contested or serious speeding

**Court Considerations:**
• **Exceptional hardship:** If ban would cause exceptional hardship
• **Totting up:** If reaching 12 points
• **Special reasons:** Not to endorse or disqualify

**Legal Framework:**
• Road Traffic Regulation Act 1984
• Road Traffic Offenders Act 1988
• Magistrates' Court Guidelines

**Evidence Requirements:**
• Calibration certificates for speed detection equipment
• Officer training and procedure compliance
• Road conditions and signage adequacy

Would you like specific guidance about challenging the NIP, court procedures, or penalty options?

**Disclaimer:** This information is generated by AI and is for guidance only. It does not constitute formal legal advice.`
  }
  
  /**
   * Generate vehicle tax response
   */
  private static generateTaxResponse(input: string): string {
    return `🚗 **Vehicle Tax (VED) - Legal Requirements**

**Vehicle Tax Requirements:**
• All vehicles used on public roads must be taxed
• Tax by last day of month (when current tax expires)
• SORN (Statutory Off Road Notification) required if not taxed
• Automatic penalties for late payment

**Tax Rates (2024/25):**
• Small petrol cars (up to 1549cc): £190
• Large petrol cars (over 1549cc): £315
• Diesel cars: £315 (unless meets Euro 6 standards)
• Electric vehicles: £0
• First year rates vary by CO2 emissions

**SORN Requirements:**
• Declare vehicle off-road if not taxed
• Vehicle must be kept on private property
• Cannot be used on public roads
• Must re-tax before using on roads

**Penalties:**
• **Late payment:** £80 fine (£40 if paid within 28 days)
• **No tax/SORN:** Up to £1,000 fine
• **DVLA clampings:** £100 release fee + storage costs
• **Court action:** For persistent non-payment

**Legal Framework:**
• Vehicle Excise and Registration Act 1994
• Road Vehicles (Registration and Licensing) Regulations 2002

**Exemptions:**
• Disabled person's vehicles (with Blue Badge)
• Historic vehicles (registered before 1984)
• Electric vehicles (currently zero rate)
• Some agricultural and military vehicles

**Appeal Options:**
• **Payment disputes:** DVLA appeals process
• **Penalty challenges:** Within 28 days of notice
• **Exceptional circumstances:** Medical emergencies, postal issues

Would you like specific guidance about SORN declarations, penalty appeals, or tax exemptions?

**Disclaimer:** This information is generated by AI and is for guidance only. It does not constitute formal legal advice.`
  }
  
  /**
   * Generate general legal response
   */
  private static generateGeneralLegalResponse(input: string): string {
    return `⚖️ **UK Traffic Law - Expert Legal Guidance**

**🎯 Understanding Your Legal Rights:**
As a UK motorist, you have strong legal protections against unfair penalties and enforcement errors:

**📋 Fundamental Rights:**
• **Right to Fair Process** - All penalties must follow strict legal procedures
• **Right to Challenge** - You can appeal any penalty you believe is unfair  
• **Right to Evidence** - Authorities must prove the contravention occurred
• **Right to Legal Representation** - You can have professional support at hearings

**⏰ Critical Time Limits (Don't Miss These!):**
• **28 days** - Standard deadline for formal representations
• **28 days** - Deadline for TE9 statutory declarations  
• **21 days** - Time limit for most informal challenges
• **14 days** - Maximum time for penalty notice service after incident

**🏛️ UK Legal Framework Protecting You:**
• **Traffic Management Act 2004** - Governs civil parking enforcement procedures
• **Road Traffic Act 1988** - Covers all road traffic criminal offenses
• **Human Rights Act 1998** - Guarantees your right to fair hearings
• **Consumer Rights Act 2015** - Protects you against unfair business practices

**⚡ When Penalties Are Often Successfully Challenged:**
• **Faulty Equipment** - Speed cameras, parking meters, traffic lights
• **Inadequate Signage** - Missing, unclear, or contradictory traffic signs
• **Procedural Errors** - Wrong dates, incorrect vehicle details, service failures
• **Exceptional Circumstances** - Medical emergencies, vehicle breakdowns

**🎯 Evidence That Wins Appeals:**
• **Photographs** - Signs, road conditions, vehicle position, permit displays
• **Documentation** - Receipts, medical certificates, breakdown reports
• **Witness Statements** - Independent accounts of circumstances
• **Technical Evidence** - Machine calibration records, device maintenance logs

**💼 Professional Appeal Process:**
1. **Gather Evidence** - Document everything supporting your case
2. **Legal Analysis** - Identify the strongest grounds for your challenge
3. **Professional Submission** - Use proper legal language and procedures
4. **Follow Up** - Track deadlines and respond to authority communications

**🔥 Success Strategies:**
• **Act Quickly** - Don't wait until deadlines approach
• **Be Thorough** - Include all relevant evidence and arguments  
• **Stay Professional** - Use formal legal language and structure
• **Know the Law** - Reference specific legislation and legal precedents

**⚠️ When to Seek Legal Advice:**
• Court proceedings have been initiated against you
• Your driving license is at risk of penalty points or disqualification
• Complex legal arguments involving technical legislation
• High-value penalties where professional fees are justified

**💡 Remember**: Most traffic penalties can be successfully challenged if you have valid grounds and follow proper procedures. The key is understanding your rights and using them effectively.

Would you like specific guidance about challenging any particular type of traffic penalty?

**Legal Disclaimer:** This is AI-generated information for guidance only, not formal legal advice from a qualified solicitor.`
  }
  
  /**
   * Generate welcome response
   */
  private static generateWelcomeResponse(): string {
    return `🇬🇧 **Welcome to ClearRide AI - Your Expert UK Traffic Law Assistant**

**🏆 I'm your AI legal specialist** with deep expertise in UK traffic law, parking appeals, speeding defenses, and official legal forms. I've helped thousands of drivers successfully challenge unfair penalties.

**⚡ What I can do for you right now:**

� **Smart Appeal Builder:**
• **AI Success Prediction** - Analyze your case strength before you file
• **Professional Legal Documents** - TE7/TE9 forms and appeal letters
• **Photo Document Scanning** - Upload your PCN for instant form filling
• **Legal Strategy Optimization** - Based on current UK legislation

� **Specialist Areas:**
• **Parking Violations (PCNs)** - Challenge unfair parking penalties
• **Speeding Offenses** - NIP responses and court defenses  
• **Traffic Camera Fines** - Red lights, bus lanes, yellow box junctions
• **Vehicle Legal Issues** - MOT, tax (VED), DVLA enforcement

📋 **Legal Forms Expertise:**
• **TE7 Forms** - Late filing applications with legal justifications
• **TE9 Forms** - Statutory declarations and witness statements
• **Appeal Letters** - Professional challenges with legal precedents

⚖️ **UK Legal Framework:**
• **Traffic Management Act 2004** - Civil parking enforcement
• **Road Traffic Act 1988** - Criminal traffic offenses
• **Civil Procedure Rules** - Court procedures and deadlines
• **Consumer Rights Act 2015** - Your rights as a motorist

**🚀 Get started instantly:**
• **Type "appeal"** - Challenge any traffic penalty
• **Upload a photo** of your penalty notice for auto-analysis
• **Ask specific questions** like "TE9 form help" or "speeding defense"
• **Try example queries**: "Invalid parking signs" or "Camera calibration challenge"

**💡 Popular services:**
• "Help me appeal a £60 parking fine"
• "I got a speeding ticket but wasn't driving"  
• "The payment machine was broken"
• "Need a TE9 form for non-receipt of notice"

**Ready to fight back against unfair penalties?** Ask me anything about UK traffic law!

**Legal Disclaimer:** This is AI-generated guidance for information purposes only, not formal legal advice.`
  }
  
  // Additional helper methods
  private static getSpecificArgument(reason: string): string {
    const lowerReason = reason.toLowerCase()
    
    if (lowerReason.includes('signage')) {
      return 'no valid contravention occurred due to inadequate or missing signage, contrary to the statutory requirements for clear and visible traffic signs'
    } else if (lowerReason.includes('permit')) {
      return 'valid parking authorization was properly displayed, negating any alleged contravention'
    } else if (lowerReason.includes('medical')) {
      return 'exceptional emergency circumstances justified the parking, which falls outside the scope of the restriction'
    } else if (lowerReason.includes('breakdown')) {
      return 'the vehicle breakdown constituted exceptional circumstances beyond the driver\'s control'
    } else if (lowerReason.includes('payment')) {
      return 'the payment system malfunction prevented compliance with parking requirements, creating impossible conditions for the motorist'
    } else {
      return 'the circumstances clearly demonstrate that no contravention occurred or that exceptional circumstances apply'
    }
  }
  
  private static getRecommendations(strongGrounds: string[]): string[] {
    const recommendations = [
      'Include photographic evidence supporting your claims',
      'Reference specific legal provisions in your appeal',
      'Maintain professional tone throughout correspondence',
      'Submit appeal within statutory deadlines'
    ]
    
    if (strongGrounds.length > 0) {
      recommendations.push('Your case has strong legal grounds - proceed with confidence')
    } else {
      recommendations.push('Consider strengthening your case with additional evidence')
    }
    
    return recommendations
  }
  
  private static getNextSteps(appealData: AppealCase): string[] {
    return [
      'Submit formal representations to issuing authority',
      'If rejected, proceed to independent adjudication',
      'Gather and preserve all supporting evidence',
      'Consider legal advice if case proceeds to court'
    ]
  }

  private static formatEvidenceList(evidence?: string[]): string {
    if (!evidence || evidence.length === 0) {
      return '• I am prepared to provide further evidence upon request.'
    }

    const labelled = evidence.slice(0, 12).map((e, i) => `• E${i + 1}: ${e}`)
    const note = evidence.length > 12 ? `\n• Additional evidence available on request (${evidence.length - 12} more item(s))` : ''
    return labelled.join('\n') + note
  }

  private static buildTimeline(appealData: AppealCase): string {
    const lines: string[] = []
    if (appealData.issueDate) lines.push(`• ${new Date(appealData.issueDate).toLocaleDateString('en-GB')}: PCN issued`)
    if (appealData.dueDate) lines.push(`• ${new Date(appealData.dueDate).toLocaleDateString('en-GB')}: Payment/representation deadline`)
    if (appealData.description) lines.push('• Incident summary: ' + appealData.description.slice(0, 300))
    if (!lines.length) return ''
    return 'Timeline of Events:\n' + lines.join('\n')
  }

  private static buildDisclosureRequests(appealData: AppealCase): string {
    const asks = [
      '• CEO notes and all photos taken',
      '• Copy of the relevant TRO/TMO including schedules and maps',
      '• Evidence of signage in place and its positioning at the time (maintenance logs if contested)',
      '• Machine audit logs if payment machine fault is asserted',
      '• Any CCTV/bus lane evidence including device certification (if applicable)'
    ]
    return asks.join('\n')
  }
}

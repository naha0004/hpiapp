"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { api, handleApiError } from "@/lib/api"
import { UKTrafficLawAssistant } from "@/lib/uk-traffic-law-assistant"
import { detectTicketType, validateTicketNumber, validateTicketNumberForType, getAppealGuidance, TICKET_TYPES } from "@/lib/ticket-types"
import { Button } from "@/components/ui/button"
import { TE7SignatureForm, TE9SignatureForm, useSignature } from "@/components/signature-canvas"
import { PE2DataCollectionForm } from "@/components/pe2-data-collection"
import { PE3DataCollectionForm } from "@/components/pe3-data-collection" 
import { N244DataCollectionForm } from "@/components/n244-data-collection"

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  timestamp: Date
}

interface AppealData {
  ticketNumber?: string
  ticketType?: string
  category?: 'civil' | 'criminal' | 'private'
  vehicleRegistration?: string
  fineAmount?: number
  issueDate?: string
  dueDate?: string
  location?: string
  reason?: string
  description?: string
  evidence?: string[]
  // TE7 Form fields
  applicantName?: string
  applicantAddress?: string
  te7Form?: string
  // TE9 Form fields
  declarantName?: string
  declarantAddress?: string
  te9Form?: string
}

const initialMessages: Message[] = [
  {
    id: 1,
    type: "bot",
    content: "🏛️ **Welcome to ClearRideAI Traffic Appeals Assistant!**\n\n🤖 **AI-Powered & Unique Every Time!**\n\nI'm your expert AI companion powered by OpenAI for challenging ALL types of UK traffic penalties. Every appeal I generate is:\n\n✨ **Completely Unique** - No two appeals are ever the same\n🎯 **AI-Enhanced** - Using advanced language models for maximum persuasion\n🚫 **Zero Placeholders** - Every template is filled with real, specific content\n📚 **UK Law Expert** - Trained on comprehensive UK legal framework\n\n📋 **Legal Framework Coverage:**\n• Civil Enforcement Regulations 2022\n• Traffic Management Act 2004\n• Traffic Signs Regulations (TSRGD) 2016\n• Road Traffic Acts 1988\n• Key case law (Moses v Barnet, Herron v Sunderland)\n\n⏰ **Deadline Awareness:**\n• 14 days PCN discount period\n• 28 days formal representations\n• 28 days tribunal appeals\n\n🎯 **What Type of Ticket Are You Appealing?**\n\nPlease select your penalty type by clicking one of the buttons below:",
    timestamp: new Date(),
  },
]

export function Appeals() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [appealData, setAppealData] = useState<Partial<AppealData>>({})
  const [appealStep, setAppealStep] = useState<"ticket_type_selection" | "ticket" | "vehicle_registration" | "amount" | "issue_date" | "due_date" | "location" | "reason" | "description" | "complete" | "te7_details" | "te7_reason" | "te7_signature" | "te7_complete" | "te9_details" | "te9_ground" | "te9_signature" | "te9_complete" | "pe2_form" | "pe3_form" | "n244_form">("ticket_type_selection")
  const [isCreatingAppeal, setIsCreatingAppeal] = useState(false)
  
  // Signature functionality
  const { signatures, addSignature, hasSignature, getSignature } = useSignature()
  const [te7Signatures, setTE7Signatures] = useState<{ applicant?: string; witness?: string }>({})
  const [te9Signatures, setTE9Signatures] = useState<{ declarant?: string; witness?: string }>({})
  
  const generateFilledTE7Form = (data: any): string => {
    const today = new Date().toLocaleDateString('en-GB')
    
    return `**FORM TE7 - APPLICATION FOR MORE TIME TO CHALLENGE COURT ORDER**

**Traffic Enforcement Centre**
**Northampton County Court**
**St Katharine's House, 21-27 St Katharine's Street, Northampton NN1 2LZ**

**Date:** ${today}

**APPLICANT DETAILS:**
**Full Name:** ${data.applicantName}
**Address:** ${data.applicantAddress}

**CASE DETAILS:**
**Court Reference/Case Number:** ${data.courtReference}
**Vehicle Registration:** ${data.vehicleRegistration}
**Original Penalty Amount:** £${data.penaltyAmount}

**APPLICATION:**
I, ${data.applicantName}, hereby apply for more time to challenge the court order in the above matter.

**REASON FOR REQUEST:**
${data.extensionReason}

**DECLARATION:**
I believe that the facts stated in this application are true. I understand that proceedings for contempt of court may be brought against anyone who makes a false statement without an honest belief in its truth.

**Signed:** _________________________
**Date:** ${today}
**Print Name:** ${data.applicantName}

---
**FOR COURT USE ONLY:**
Application received: ___________
Decision: ___________________
Date: ______________________`
  }

  const generateFilledTE9Form = (data: any): string => {
    const today = new Date().toLocaleDateString('en-GB')
    
    return `**FORM TE9**
**Witness statement – unpaid penalty charge**

**Please complete this form in black ink using BLOCK CAPITALS and return it to the address below**

**Traffic Enforcement Centre**
**Northampton County Court Business Centre**
**St Katharine's House**
**21 – 27 St Katharine's Street**
**Northampton, NN1 2LH**

**Penalty Charge No:** ${data.penaltyChargeNo}
**Vehicle Registration No:** ${data.vehicleRegistration}
**Applicant:** ${data.witnessName}
**Location of Contravention:** ${data.locationOfContravention}
**Date of Contravention:** ${data.dateOfContravention}

**You must ensure that all details above are correctly entered from the form TE3 - Order for Recovery of unpaid penalty charge (Dart Charge or Mersey Gateway):**

**Title:**     ☐ Mr.     ☐ Mrs.     ☐ Miss     ☐ Ms.     ☐ Other: ___________

**Full name (Witness):** ${data.witnessName}

**Address:** ${data.witnessAddress}

**Postcode:** [____] [____]

**Company name (if vehicle owned and registered by a company):** ${data.companyName || 'N/A'}

**The above named witness, declares that: Tick all boxes that apply to you:**

**☑ ${data.selectedGround === 'A' ? '●' : '☐'} I did not receive the penalty charge notice.**

**☑ ${data.selectedGround === 'B' ? '●' : '☐'} I made representations about the penalty charge to the Charging Authority concerned, within 28 days of the service of the Penalty Charge Notice, but did not receive a rejection notice.**

**☑ ${data.selectedGround === 'C' ? '●' : '☐'} I appealed to an adjudicator against the Charging Authority's decision to reject my representation, within 28 days of service of the Rejection notice, but have either:**
    ☐ Had no response to the appeal, or
    ☐ The appeal had not been determined by the time that the charge certificate had been served, or  
    ☐ The appeal was determined in my favour.

**☑ ${data.selectedGround === 'D' ? '●' : '☐'} The penalty charge has been paid in full.**
    **Date it was paid:** ___________
    **How it was paid:** Cash/Cheque/Debit/Credit card
    **To whom was it paid:** ___________

**Proceedings for contempt of court may be brought against you if you make or cause to be made a false statement in an application verified by a statement of truth without an honest belief in its truth.**

**Statement of truth**
**(I believe) (The witness believes) that the facts stated in this statement are true.**

**Signed:** _________________________ **Dated:** ${today}
**(witness) (Person signing on behalf of witness)**

**Print full name:** ${data.witnessName}

**If you are signing on behalf of the witness, are you:**
☐ An Officer of the company     ☐ A Partner of the firm     ☐ A Litigation friend acting on behalf of a protected party within the meaning of the Mental Capacity Act 2005

---
**TE9 Witness statement – unpaid penalty charge (Parking) (05.20)**
**© Crown Copyright 2020**`
  }
  
  // PDF download functions
  const downloadTE7PDF = async (data: any) => {
    try {
      const te7Data = {
        courtName: 'Traffic Enforcement Centre',
        claimNumber: data.courtReference || appealData.ticketNumber || '',
        applicantName: data.applicantName || '',
        applicantAddress: data.applicantAddress || '',
        applicantPostcode: extractPostcode(data.applicantAddress || ''),
        caseReference: data.courtReference || '',
        hearingDate: '', // Will be filled by user
        extensionUntil: '', // Will be filled by user
        reasonForExtension: data.extensionReason || '',
      }

      const response = await fetch('/api/generate-te7-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(te7Data),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `TE7_Application_${te7Data.claimNumber || 'form'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('TE7 PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading TE7 PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
    }
  }

  const downloadTE9PDF = async (data: any) => {
    try {
      const te9Data = {
        courtName: 'Traffic Enforcement Centre',
        claimNumber: data.penaltyChargeNo || appealData.ticketNumber || '',
        witnessName: data.witnessName || '',
        witnessAddress: data.witnessAddress || '',
        witnessPostcode: extractPostcode(data.witnessAddress || ''),
        witnessOccupation: '', // Will be filled by user
        statementText: `Ground ${data.selectedGround}: ${data.groundDescription}
Location: ${data.locationOfContravention}
Date: ${data.dateOfContravention}  
Vehicle: ${data.vehicleRegistration}`,
        factsKnown: 'personally' as const,
      }

      const response = await fetch('/api/generate-te9-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(te9Data),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `TE9_Witness_Statement_${te9Data.claimNumber || 'form'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('TE9 PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading TE9 PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
    }
  }

  // PDF download functions for appeal letters
  const downloadAppealLetterPDF = async (appealData: AppealData) => {
    if (!appealData.ticketNumber) {
      toast.error('Please complete the appeal details first.')
      return
    }

    try {
      // Generate the appeal letter text with AI
      const appealCase = {
        ticketNumber: appealData.ticketNumber,
        fineAmount: appealData.fineAmount,
        issueDate: appealData.issueDate,
        dueDate: appealData.dueDate,
        location: appealData.location,
        reason: appealData.reason || '',
        description: appealData.description || '',
        circumstances: appealData.description || '',
        evidence: appealData.evidence || []
      }

      // Use AI generation with user data for unique appeals
      let appealLetter: string
      try {
        const userData = {
          id: session?.user?.email || 'user',
          name: appealData.applicantName || appealData.declarantName || session?.user?.name,
          email: session?.user?.email || 'user@example.com'
        }
        appealLetter = await UKTrafficLawAssistant.generateAppealLetter(appealCase, userData)
      } catch (error) {
        console.log('AI appeal generation failed, using template:', error)
        appealLetter = UKTrafficLawAssistant.generateAppealLetterSync(appealCase)
      }

      // Prepare case details for PDF
      const caseDetails = {
        pcnNumber: appealData.ticketNumber,
        vehicleReg: appealData.vehicleRegistration,
        location: appealData.location,
        appealantName: appealData.applicantName || appealData.declarantName,
        councilName: ''  // Could be extracted from location or entered separately
      }

      // Call the API to generate PDF
      const response = await fetch('/api/generate-appeal-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appealText: appealLetter,
          caseDetails: caseDetails,
          type: 'appeal-letter'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Appeal_Letter_${appealData.ticketNumber}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Appeal letter PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading appeal letter PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
    }
  }

  // PDF download function for AI predictor reports
  const downloadPredictorReportPDF = async (prediction: any, appealData: AppealData) => {
    try {
      const caseDetails = {
        pcnNumber: appealData.ticketNumber,
        vehicleReg: appealData.vehicleRegistration,
        location: appealData.location,
        appealantName: appealData.applicantName || appealData.declarantName,
      }

      const response = await fetch('/api/generate-appeal-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appealText: prediction.appealLetter || 'No appeal letter generated',
          caseDetails: caseDetails,
          prediction: prediction,
          type: 'predictor-report'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Appeal_Analysis_Report_${appealData.ticketNumber}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Appeal analysis report PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading predictor report PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
    }
  }

  // Helper function to extract postcode from address
  const extractPostcode = (address: string): string => {
    const postcodeRegex = /[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}/i
    const match = address.match(postcodeRegex)
    return match ? match[0] : ''
  }

  // Signature handlers
  const handleTE7SignatureComplete = (signatures: { applicant?: string; witness?: string }) => {
    setTE7Signatures(signatures)
    if (signatures.applicant) {
      addSignature('te7', signatures.applicant)
    }
    
    // Move to completion step after signature
    setAppealStep("te7_complete")
    
    const botMessage: Message = {
      id: messages.length + 1,
      type: "bot",
      content: `🎉 **Excellent! Your TE7 Form is Now Digitally Signed and Complete!**\n\n✅ **What I've Done for You:**\n• ✍️ Captured your digital signature\n• 📄 Embedded signature into your TE7 PDF\n• 🏛️ Prepared form for Traffic Enforcement Centre submission\n• 📋 Generated professional legal document\n\n🚀 **Your TE7 Application is Ready!**\n\n**Next Steps:**\n1. **📥 Download** your signed TE7 PDF using the button below\n2. **✉️ Submit** to Traffic Enforcement Centre immediately\n3. **📁 Keep** digital copies for your records\n4. **⏰ Track** your application status\n\n📍 **Submit to:**\nTraffic Enforcement Centre\nNorthampton County Court\nSt Katharine's House, 21-27 St Katharine's Street\nNorthampton NN1 2LZ\n\n💡 **Pro Tip:** Your digitally signed PDF is legally valid and ready for immediate court submission - no printing or manual signing required!`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, botMessage])
  }

  const handleTE9SignatureComplete = (signatures: { declarant?: string; witness?: string }) => {
    setTE9Signatures(signatures)
    if (signatures.declarant) {
      addSignature('te9', signatures.declarant)
    }
    
    // Move to completion step after signature
    setAppealStep("te9_complete")
    
    const botMessage: Message = {
      id: messages.length + 1,
      type: "bot",
      content: `🎉 **Outstanding! Your TE9 Witness Statement is Now Digitally Signed!**\n\n✅ **What I've Accomplished for You:**\n• ✍️ Captured your digital signature\n• ⚖️ Created a sworn legal document\n• 📄 Embedded signature into your TE9 PDF\n• 🏛️ Prepared form for legal witnessing and court submission\n\n📋 **Your TE9 Statement is Ready for Final Steps!**\n\n**Immediate Actions:**\n1. **📥 Download** your signed TE9 PDF using the button below\n2. **🔍 Review** all details carefully\n3. **📁 Keep** digital copies for your records\n\n**For Court Submission:**\n4. **🏛️ Take to a qualified witness:**\n   • Solicitor\n   • Commissioner for Oaths\n   • Justice of the Peace\n   • Notary Public\n5. **✍️ Have them witness and sign** the printed form\n6. **📤 Submit** to Traffic Enforcement Centre\n\n📍 **Submit to:**\nTraffic Enforcement Centre\nNorthampton County Court\nSt Katharine's House, 21-27 St Katharine's Street\nNorthampton NN1 2LZ\n\n⚖️ **Legal Reminder:** Your digital signature creates the base document, but TE9 forms require qualified witness validation for court acceptance.`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, botMessage])
  }

  const downloadTE7WithSignature = async () => {
    try {
      const te7Data = {
        courtName: 'Traffic Enforcement Centre',
        claimNumber: appealData.ticketNumber || 'TE7-FORM-001',
        applicantName: appealData.applicantName || '',
        applicantAddress: appealData.applicantAddress || '',
        applicantPostcode: extractPostcode(appealData.applicantAddress || ''),
        caseReference: appealData.ticketNumber || '',
        hearingDate: new Date().toLocaleDateString('en-GB'),
        extensionUntil: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-GB'),
        reasonForExtension: appealData.description || 'Application for more time to challenge court order',
        applicantSignature: te7Signatures.applicant,
        witnessSignature: te7Signatures.witness,
        signatureDate: new Date().toLocaleDateString('en-GB')
      }

      const response = await fetch('/api/generate-te7-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(te7Data),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `TE7_Application_Signed_${te7Data.claimNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('✅ TE7 PDF with signature downloaded successfully!')
    } catch (error) {
      console.error('Error downloading TE7 with signature:', error)
      toast.error('❌ Failed to download TE7 PDF. Please try again.')
    }
  }

  const downloadTE9WithSignature = async () => {
    try {
      const te9Data = {
        courtName: 'Traffic Enforcement Centre',
        claimNumber: appealData.ticketNumber || 'TE9-FORM-001',
        witnessName: appealData.declarantName || '',
        witnessAddress: appealData.declarantAddress || '',
        witnessPostcode: extractPostcode(appealData.declarantAddress || ''),
        witnessOccupation: 'As stated in form',
        statementText: appealData.te9Form || 'Witness statement for unpaid penalty charge',
        declarantSignature: te9Signatures.declarant,
        witnessSignature: te9Signatures.witness,
        signatureDate: new Date().toLocaleDateString('en-GB')
      }

      const response = await fetch('/api/generate-te9-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(te9Data),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `TE9_Witness_Statement_Signed_${te9Data.claimNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('✅ TE9 PDF with signature downloaded successfully!')
    } catch (error) {
      console.error('Error downloading TE9 with signature:', error)
      toast.error('❌ Failed to download TE9 PDF. Please try again.')
    }
  }
  
  const resetConversation = () => {
    setMessages(initialMessages)
    setInputValue("")
    setIsCreatingAppeal(false)
    setAppealStep("ticket_type_selection")
    setAppealData({})
    // Clear signature data
    setTE7Signatures({})
    setTE9Signatures({})
  }

  const handleTicketTypeSelection = (ticketTypeId: string) => {
    // Handle special court forms
    if (ticketTypeId === 'te7' || ticketTypeId === 'te9' || ticketTypeId === 'pe2' || ticketTypeId === 'pe3' || ticketTypeId === 'n244') {
      setIsCreatingAppeal(true)
      
      if (ticketTypeId === 'te7') {
        setAppealStep("te7_details")
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `📋 **TE7 Form Service - AI-Enhanced Court Order Challenge**\n\n🤖 **AI-Powered Form Generation** - Your TE7 will be uniquely crafted using advanced AI\n\n**Form Purpose:** Request more time to challenge a court order ('order of recovery') for traffic enforcement charges\n\n🏛️ **Submission To:** Traffic Enforcement Centre\n📝 **Form Type:** Official court form TE7 (AI-filled with no placeholders)\n✨ **Unique Content:** Every form is generated fresh with case-specific language\n\n**This form is used when:**\n• You need more time to challenge a court order\n• You missed the original deadline to respond\n• You want to apply for an extension\n\n**📝 Required Information to Complete Your AI-Enhanced TE7 Form:**\n\n1️⃣ **Your Full Name**\n2️⃣ **Your Complete Address** \n3️⃣ **Court Reference/Case Number**\n4️⃣ **Vehicle Registration**\n5️⃣ **Reason for requesting extension**\n6️⃣ **Original penalty amount**\n\n**Let's start - please provide your full name:**`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      } else if (ticketTypeId === 'te9') {
        setAppealStep("te9_details")
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `⚖️ **TE9 Form Service - AI-Enhanced Witness Statement**\n\n🤖 **AI-Powered Legal Document** - Your TE9 will include unique, case-specific content\n\n**Form Purpose:** Official witness statement for unpaid penalty charges at Traffic Enforcement Centre\n\n🏛️ **Submission To:** Traffic Enforcement Centre, Northampton County Court\n📝 **Form Type:** Official court form TE9 (AI-enhanced with professional legal language)\n✨ **Unique Content:** Every statement is uniquely worded for maximum legal impact\n\n**📋 Required Information (from official TE9 form):**\n\n**BASIC DETAILS:**\n1️⃣ **Penalty Charge Number**\n2️⃣ **Vehicle Registration Number**\n3️⃣ **Your Name** (witness)\n4️⃣ **Your Address** (including postcode)\n5️⃣ **Company Name** (if vehicle owned by company)\n6️⃣ **Date of Contravention**\n7️⃣ **Location of Contravention**\n\n**WITNESS STATEMENT GROUNDS** (AI will optimize your chosen ground):\n• You did not receive the penalty charge notice\n• You made representations but got no reply\n• You appealed but got no response or unfavorable response\n• The penalty charge has been paid in full\n\n**Let's start - please provide your Penalty Charge Number:**`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      } else if (ticketTypeId === 'pe2') {
        setAppealStep("pe2_form")
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `🏛️ **PE2 Form Service - Application for Order**\n\n**Form Purpose:** Official court application form for requesting orders from the court\n\n🏛️ **Submission To:** County Court\n📝 **Form Type:** Official court form PE2 (we'll complete and prepare your PDF)\n\n**This form is used for:**\n• Applications for court orders\n• Requesting specific relief from the court\n• Formal court proceedings\n\n**📋 Required Information:**\nI'll guide you through a comprehensive form to collect all the necessary details including court information, applicant details, order requested, and legal grounds.\n\n**Let's begin by completing your PE2 application form:**`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      } else if (ticketTypeId === 'pe3') {
        setAppealStep("pe3_form")
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `📋 **PE3 Form Service - Statutory Declaration for Unpaid Penalty Charge**\n\n**Form Purpose:** Official statutory declaration for challenging unpaid penalty charges\n\n🏛️ **Submission To:** Traffic Enforcement Centre / Magistrates' Court\n📝 **Form Type:** Official court form PE3 (we'll complete and prepare your PDF)\n\n**This form is used for:**\n• Statutory declarations for unpaid penalty charges\n• Challenging penalty charges you didn't receive notice for\n• Declaring you were not the driver at the time\n• Other valid grounds for challenging penalty charges\n\n**📋 Required Information:**\nI'll guide you through collecting details about the penalty charge, your circumstances, and the grounds for your statutory declaration.\n\n**Let's begin by completing your PE3 statutory declaration form:**`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      } else if (ticketTypeId === 'n244') {
        setAppealStep("n244_form")
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `📝 **N244 Form Service - Application Notice**\n\n**Form Purpose:** Official court application notice for various court applications\n\n🏛️ **Submission To:** County Court\n📝 **Form Type:** Official court form N244 (we'll complete and prepare your PDF)\n\n**This form is used for:**\n• General court applications\n• Requesting hearings\n• Applications for court orders\n• Procedural applications\n\n**📋 Required Information:**\nI'll guide you through the application details including hearing requirements, costs information, and the specific relief you're seeking.\n\n**Let's begin by completing your N244 application notice:**`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      }
      return
    }

    // Handle regular ticket types
    const selectedType = TICKET_TYPES[ticketTypeId]
    if (selectedType) {
      setAppealData(prev => ({ 
        ...prev, 
        ticketType: selectedType.id,
        category: selectedType.category
      }))
      setIsCreatingAppeal(true)
      setAppealStep("ticket")
      
      const botMessage: Message = {
        id: messages.length + 1,
        type: "bot",
        content: `✅ **${selectedType.name} Selected!**\n\n🎫 **Appeal Type:** ${selectedType.name}\n📋 **Category:** ${selectedType.category}\n🏛️ **Appeals Route:** ${selectedType.authority}\n\n📝 **Enter Your Ticket Number**\n\n${selectedType.description}\n\n🔍 **Expected Format:** ${selectedType.patterns[0].source}\n📝 **Example:** ${selectedType.examples[0]}\n\n**Please enter your ${selectedType.name.toLowerCase()} number:**`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMessage])
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user", 
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = inputValue.trim()
    setInputValue("")
    setIsLoading(true)

    try {
      let botResponse = ""
      
      if (userInput.toLowerCase() === "reset" || userInput.toLowerCase() === "restart") {
        resetConversation()
        botResponse = "🔄 **Fresh Start - Let's Win This Appeal!**\n\n✅ **Chat has been reset** - all previous information cleared\n\n🚀 **Ready to challenge your penalty?** Please select your penalty type using the buttons above."
      } else if (!isCreatingAppeal) {
        // Use the expert UK Traffic Law Assistant for general queries
        botResponse = UKTrafficLawAssistant.generateResponse(userInput, {
          appealData,
          messages,
          isCreatingAppeal
        })
      } else {
        // Handle appeal creation steps
        switch (appealStep) {
          case "ticket":
            const ticketNumber = userInput.replace(/[^A-Z0-9]/g, '').toUpperCase()
            const selectedTicketType = TICKET_TYPES[appealData.ticketType || 'pcn']
            const isValid = validateTicketNumberForType(ticketNumber, selectedTicketType.id)
            
            if (isValid) {
              setAppealData(prev => ({ 
                ...prev, 
                ticketNumber
              }))
              setAppealStep("vehicle_registration")
              
              const guidance = getAppealGuidance(selectedTicketType)
              botResponse = `✅ **Ticket Number Confirmed: ${ticketNumber}**\n\n🎯 **Ticket Type: ${selectedTicketType.name}**\n📋 **Category:** ${selectedTicketType.category.charAt(0).toUpperCase() + selectedTicketType.category.slice(1)} penalty\n⚖️ **Appeal Route:** ${guidance.appealRoute}\n📅 **Time Limit:** ${guidance.timeLimit}\n💷 **Typical Range:** £${selectedTicketType.fineRange.min}-£${selectedTicketType.fineRange.max}\n\n🚗 **Next Step:** I need your vehicle registration number (e.g., AB12 CDE)`
            } else {
              botResponse = `❌ **Invalid ${selectedTicketType.name} Format**\n\n🔍 **Expected format for ${selectedTicketType.name}:**\n${selectedTicketType.description}\n\n📝 **Examples:**\n${selectedTicketType.examples.map(ex => `• ${ex}`).join('\n')}\n\n🔢 **Please check your penalty notice and enter the correct ticket number**`
            }
            break

          case "vehicle_registration":
            const vehicleReg = userInput.replace(/\s+/g, '').toUpperCase()
            if (vehicleReg.length >= 5) {
              setAppealData(prev => ({ ...prev, vehicleRegistration: vehicleReg }))
              setAppealStep("amount")
              botResponse = `Great! Vehicle registration ${vehicleReg} recorded.\n\nWhat is the fine amount? Please provide the amount in pounds (e.g., £60.00 or just 60).`
            } else {
              botResponse = "Please provide a valid vehicle registration number (e.g., AB12 CDE, AB12CDE)."
            }
            break

          case "amount":
            const amountMatch = userInput.match(/(\d+(?:\.\d{2})?)/)
            if (amountMatch) {
              const amount = parseFloat(amountMatch[1])
              setAppealData(prev => ({ ...prev, fineAmount: amount }))
              setAppealStep("issue_date")
              
              const discountedAmount = amount * 0.5
              const totalSavings = amount
              
              botResponse = `💰 **Perfect! Fine Amount: £${amount.toFixed(2)}**\n\n📊 **Your Potential Savings:**\n• Early payment discount: £${discountedAmount.toFixed(2)} (you still pay £${discountedAmount.toFixed(2)})\n• **Successful appeal: £${totalSavings.toFixed(2)} (you pay nothing!)** ⭐\n\n⏰ **Next: When did this happen?**\nI need the issue date from your penalty notice.\n\n📅 **Please provide the date the fine was issued:**\n• Format: DD/MM/YYYY (e.g., 15/03/2024)`
            } else {
              botResponse = "💷 **I need the fine amount to calculate your potential savings!**\n\nPlease tell me the amount from your penalty notice (e.g., \"60\" or \"£60.00\")."
            }
            break

          case "issue_date":
            const issueDateMatch = userInput.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/)
            if (issueDateMatch) {
              const [, day, month, year] = issueDateMatch
              const issueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
              setAppealData(prev => ({ ...prev, issueDate }))
              setAppealStep("due_date")
              botResponse = `Thank you! Issue date recorded as ${day}/${month}/${year}.\n\nWhat is the payment due date? Please provide the date in DD/MM/YYYY format.`
            } else {
              botResponse = "Please provide the issue date in DD/MM/YYYY format (e.g., 15/03/2024)."
            }
            break

          case "due_date":
            const dueDateMatch = userInput.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/)
            if (dueDateMatch) {
              const [, day, month, year] = dueDateMatch
              const dueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
              setAppealData(prev => ({ ...prev, dueDate }))
              setAppealStep("location")
              botResponse = `Due date recorded as ${day}/${month}/${year}.\n\nWhere did this incident occur? Please provide the location (e.g., "High Street Car Park, Birmingham").`
            } else {
              botResponse = "Please provide the due date in DD/MM/YYYY format (e.g., 28/03/2024)."
            }
            break

          case "location":
            if (userInput.length >= 5) {
              setAppealData(prev => ({ ...prev, location: userInput }))
              setAppealStep("reason")
              botResponse = `📍 **Location Recorded: ${userInput}**\n\n🎯 **Now for the crucial part - your appeal reason!**\n\nChoose the reason that best matches your situation:\n\n**1️⃣ Invalid signage** 🚫\n**2️⃣ Permit displayed** 🎫\n**3️⃣ Medical emergency** 🏥\n**4️⃣ Vehicle breakdown** 🔧\n**5️⃣ Loading/unloading** 📦\n**6️⃣ Payment system error** 💳\n**7️⃣ Other reason** 📝\n\n**Type 1-7 or describe your specific situation!**`
            } else {
              botResponse = "Please provide a more specific location (e.g., \"High Street, Birmingham\" or \"Tesco Car Park, Manchester\")."
            }
            break

          case "reason":
            let reason = ""
            if (userInput === "1") reason = "Invalid or unclear signage"
            else if (userInput === "2") reason = "Valid permit displayed"
            else if (userInput === "3") reason = "Medical emergency"
            else if (userInput === "4") reason = "Vehicle breakdown"
            else if (userInput === "5") reason = "Loading/unloading permitted"
            else if (userInput === "6") reason = "Payment system malfunction"
            else if (userInput === "7" || userInput.toLowerCase().includes("other")) reason = "Other circumstances"
            else if (userInput.length >= 10) reason = userInput
            else {
              botResponse = "Please choose a number from 1-7 or provide a detailed reason for your appeal."
              break
            }
            
            setAppealData(prev => ({ ...prev, reason }))
            setAppealStep("description")
            botResponse = `✅ **Appeal Reason: ${reason}**\n\n📝 **Final Step: Your Appeal Description**\n\nYou have two options:\n\n🤖 **1. AI Professional Writer** (Recommended)\n   • Type **"generate"** and I'll craft a legally-optimized description\n   • Uses UK traffic law precedents and winning arguments\n\n✍️ **2. Write It Yourself**\n   • Provide your own detailed description\n   • Include timeline, circumstances, and why the penalty should be cancelled\n\nWhat's your choice? Type **"generate"** for AI help or write your own description!`
            break

          case "description":
            if (userInput.toLowerCase().includes("generate")) {
              const appealCaseData = {
                ticketNumber: appealData.ticketNumber,
                fineAmount: appealData.fineAmount,
                issueDate: appealData.issueDate,
                dueDate: appealData.dueDate,
                location: appealData.location,
                reason: appealData.reason!,
                description: '',
                circumstances: '',
                evidence: []
              }
              
              // Try AI generation first
              try {
                const generatedDescription = await UKTrafficLawAssistant.generateAppealDescription(appealCaseData)
                setAppealData(prev => ({ ...prev, description: generatedDescription }))
                setAppealStep("complete")
                
                botResponse = `🤖 **AI-Generated Unique Appeal Description!**\n\n📋 **Your Personalized Appeal:**\n"${generatedDescription}"\n\n✅ **Appeal Complete!** Your unique AI-powered appeal includes:\n• OpenAI-generated unique content\n• UK traffic law expertise\n• Case-specific legal arguments\n• Professional language optimized for success\n• Zero placeholders or generic terms\n\n📄 **Next Steps:**\n1. Review your unique appeal\n2. Submit to the appropriate authority\n3. Keep copies of all correspondence\n\n� **AI Advantage:** This appeal is completely unique and tailored specifically to your case circumstances!`
              } catch (error) {
                // Fallback to sync template generation
                const generatedDescription = UKTrafficLawAssistant.generateAppealDescriptionSync(appealCaseData)
                setAppealData(prev => ({ ...prev, description: generatedDescription }))
                setAppealStep("complete")
                
                botResponse = `🏆 **Professional Appeal Description Generated!**\n\n📋 **Your Customized Appeal:**\n"${generatedDescription}"\n\n✅ **Appeal Complete!** Your professional appeal has been generated with:\n• Legal precedents and case law\n• Specific circumstances of your case\n• Professional language that appeals panels respect\n• Strategic arguments for maximum success\n\n📄 **Next Steps:**\n1. Review the generated appeal\n2. Submit to the appropriate authority\n3. Keep copies of all correspondence\n\n🎯 **Success Strategy:** This appeal uses proven legal arguments that have helped thousands of drivers successfully challenge their penalties!`
              }
            } else if (userInput.length >= 20) {
              setAppealData(prev => ({ ...prev, description: userInput }))
              setAppealStep("complete")
              botResponse = `✅ **Your Custom Description Recorded!**\n\n📝 **Description:** "${userInput}"\n\n✅ **Appeal Complete!** Your appeal is ready for submission.\n\n📄 **Next Steps:**\n1. Submit your appeal to the appropriate authority\n2. Keep copies of all correspondence\n3. Follow up if no response within the required timeframe`
            } else {
              botResponse = "Please provide a more detailed description (at least 20 characters) or type 'generate' for AI assistance."
            }
            break

          // TE7 Form Steps
          case "te7_details":
            // Store name and start collecting other details
            setAppealData(prev => ({ ...prev, applicantName: userInput }))
            setAppealStep("te7_reason")
            botResponse = `✅ **Name Recorded: ${userInput}**\n\nNow please provide:\n\n2️⃣ **Your Complete Address** (including postcode)\n3️⃣ **Court Reference/Case Number**\n4️⃣ **Vehicle Registration** \n5️⃣ **Original Penalty Amount** (£)\n6️⃣ **Detailed Reason** for requesting extension\n\nPlease provide all these details (you can use separate lines for each):`
            break

          case "te7_reason":
            // Generate filled TE7 form
            const lines = userInput.split('\n').filter(line => line.trim())
            const te7Data = {
              applicantName: appealData.applicantName || 'Not provided',
              applicantAddress: lines[0] || 'Address not provided',
              courtReference: lines[1] || 'Case number not provided',
              vehicleRegistration: lines[2] || 'Reg not provided',
              penaltyAmount: lines[3] || 'Amount not provided',
              extensionReason: lines.slice(4).join('\n') || 'Reason not provided'
            }
            
            const te7FormData = generateFilledTE7Form(te7Data)
            setAppealData(prev => ({ ...prev, te7Form: te7FormData, ...te7Data }))
            
            // Automatically prompt for signature
            botResponse = `📋 **TE7 Form Generated Successfully!**\n\n**Your Completed TE7 Application:**\n\n${te7FormData}\n\n✍️ **Now I need your signature to make this form legally valid!**\n\n🖊️ To complete your TE7 application, I'll need you to provide a digital signature. This will:\n• ✅ Make your form legally binding\n• ✅ Allow immediate submission to court\n• ✅ Save time compared to printing and manual signing\n• ✅ Create a professional PDF ready for the Traffic Enforcement Centre\n\n**Please use the signature pad below to sign your TE7 form. Your signature will be automatically embedded in the final PDF.**\n\n👇 **Digital Signature Required Below** 👇`
            
            // Automatically move to signature step
            setTimeout(() => {
              setAppealStep("te7_signature")
            }, 100)
            break

          // TE9 Form Steps  
          case "te9_details":
            // Store penalty charge number and start collecting other details
            setAppealData(prev => ({ ...prev, ticketNumber: userInput }))
            setAppealStep("te9_ground")
            botResponse = `✅ **Penalty Charge Number Recorded: ${userInput}**\n\nNow please provide:\n\n2️⃣ **Vehicle Registration Number**\n3️⃣ **Your Full Name** (witness/applicant)\n4️⃣ **Your Complete Address** (including postcode)\n5️⃣ **Company Name** (if applicable, leave blank if personal vehicle)\n6️⃣ **Date of Contravention** (DD/MM/YYYY)\n7️⃣ **Location of Contravention**\n8️⃣ **Which ground applies to you?**\n   • A) I did not receive the penalty charge notice\n   • B) I made representations but did not receive a reply\n   • C) I appealed but got no response or unfavorable response  \n   • D) The penalty charge has been paid in full\n\n**Please provide all details above (use separate lines for each):**`
            break

          case "te9_ground":
            // Generate filled TE9 form with official format
            const te9Lines = userInput.split('\n').filter(line => line.trim())
            const groundMap = {
              'A': 'I did not receive the penalty charge notice.',
              'B': 'I made representations about the penalty charge to the Charging Authority concerned, within 28 days of the service of the Penalty Charge Notice, but did not receive a rejection notice.',
              'C': 'I appealed to an adjudicator against the Charging Authority\'s decision to reject my representation, within 28 days of service of the Rejection notice, but have either: Had no response to your appeal, or The appeal had not been determined by the time that the charge certificate had been served, or The appeal was determined in my favour.',
              'D': 'The penalty charge has been paid in full.'
            }
            
            const selectedGround = te9Lines[7]?.toUpperCase()?.match(/[ABCD]/)?.[0] || 'A'
            
            const te9Data = {
              penaltyChargeNo: appealData.ticketNumber || 'Not provided',
              vehicleRegistration: te9Lines[0] || 'Not provided',
              witnessName: te9Lines[1] || 'Not provided', 
              witnessAddress: te9Lines[2] || 'Not provided',
              companyName: te9Lines[3] || '',
              dateOfContravention: te9Lines[4] || 'Not provided',
              locationOfContravention: te9Lines[5] || 'Not provided',
              selectedGround: selectedGround,
              groundDescription: groundMap[selectedGround as keyof typeof groundMap]
            }
            
            const te9FormData = generateFilledTE9Form(te9Data)
            setAppealData(prev => ({ 
              ...prev, 
              te9Form: te9FormData,
              declarantName: te9Data.witnessName,
              declarantAddress: te9Data.witnessAddress
            }))
            
            // Automatically prompt for signature  
            botResponse = `⚖️ **TE9 Form Generated Successfully!**\n\n**Your Completed TE9 Witness Statement:**\n\n${te9FormData}\n\n✍️ **Now I need your signature to make this legal document complete!**\n\n🖊️ To finalize your TE9 witness statement, I'll need you to provide a digital signature. This will:\n• ✅ Create a sworn legal document\n• ✅ Prepare your form for qualified witness validation\n• ✅ Generate a professional PDF for court submission\n• ✅ Ensure compliance with UK traffic law requirements\n\n⚖️ **Important Legal Note:** While you can sign digitally now, TE9 forms must also be witnessed by a qualified person (solicitor, commissioner for oaths, or magistrate) for final court submission.\n\n**Please use the signature pad below to sign your TE9 witness statement.**\n\n👇 **Digital Signature Required Below** 👇`
            
            // Automatically move to signature step
            setTimeout(() => {
              setAppealStep("te9_signature")
            }, 100)
            break

          default:
            botResponse = "I'm not sure how to help with that. Would you like to start a new appeal?"
            resetConversation()
            break
        }
      }

      const botMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: botResponse,
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error processing message:", error)
      const errorMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "I'm sorry, there was an error processing your message. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 overflow-hidden">
        <div className="w-full h-full flex flex-col">
          {/* Penalty Type Selection Buttons */}
          {!isCreatingAppeal && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('pcn')}
                className="h-20 flex flex-col items-center gap-1"
              >
                🅿️ <span className="text-xs">Parking Penalty</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('fpn')}
                className="h-20 flex flex-col items-center gap-1"
              >
                🏎️ <span className="text-xs">Speeding Fine</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('bus_lane')}
                className="h-20 flex flex-col items-center gap-1"
              >
                🚌 <span className="text-xs">Bus Lane</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('red_light')}
                className="h-20 flex flex-col items-center gap-1"
              >
                🔴 <span className="text-xs">Traffic Light</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('congestion_charge')}
                className="h-20 flex flex-col items-center gap-1"
              >
                💰 <span className="text-xs">Congestion/ULEZ</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('tec')}
                className="h-20 flex flex-col items-center gap-1"
              >
                🚗 <span className="text-xs">TEC Court Fine</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('unknown')}
                className="h-20 flex flex-col items-center gap-1"
              >
                📋 <span className="text-xs">DVLA Fine</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('private_parking')}
                className="h-20 flex flex-col items-center gap-1"
              >
                🏢 <span className="text-xs">Private Parking</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('te7')}
                className="h-20 flex flex-col items-center gap-1"
              >
                📝 <span className="text-xs">TE7 Court Form</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('te9')}
                className="h-20 flex flex-col items-center gap-1"
              >
                ⚖️ <span className="text-xs">TE9 Witness Form</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('pe2')}
                className="h-20 flex flex-col items-center gap-1"
              >
                🏛️ <span className="text-xs">PE2 Court Application</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('pe3')}
                className="h-20 flex flex-col items-center gap-1"
              >
                📋 <span className="text-xs">PE3 Statutory Declaration</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('n244')}
                className="h-20 flex flex-col items-center gap-1"
              >
                📝 <span className="text-xs">N244 Notice Application</span>
              </Button>
            </div>
          )}
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  {/* Add download buttons for completed forms */}
                  {message.type === "bot" && (appealStep === "te7_complete" || appealStep === "te9_complete") && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-semibold text-green-600 mb-2">📥 Download Options Available Below</div>
                      <div className="text-xs text-green-600">
                        👇 Use the download buttons below the chat for signed PDF forms
                      </div>
                    </div>
                  )}
                  <div className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Signature Forms */}
          {appealStep === "te7_signature" && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6 mb-4 shadow-lg">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500 text-white rounded-full mb-3">
                  ✍️
                </div>
                <h3 className="text-xl font-bold text-purple-800 mb-2">Digital Signature Required</h3>
                <p className="text-purple-700">
                  Your TE7 form is ready! Please provide your signature to make it legally binding.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <TE7SignatureForm onSignatureComplete={handleTE7SignatureComplete} />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-purple-600">
                  🔒 Your signature will be securely embedded in the PDF and is legally valid for court submission.
                </p>
              </div>
            </div>
          )}

          {appealStep === "te9_signature" && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-xl p-6 mb-4 shadow-lg">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-500 text-white rounded-full mb-3">
                  ⚖️
                </div>
                <h3 className="text-xl font-bold text-indigo-800 mb-2">Legal Signature Required</h3>
                <p className="text-indigo-700">
                  Your TE9 witness statement is complete! Please provide your signature to create the legal document.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <TE9SignatureForm onSignatureComplete={handleTE9SignatureComplete} />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-indigo-600">
                  ⚖️ Your signature creates the base legal document. Final court submission requires qualified witness validation.
                </p>
              </div>
            </div>
          )}

          {/* New Court Forms */}
          {appealStep === "pe2_form" && (
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-300 rounded-xl p-6 mb-4 shadow-lg">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-500 text-white rounded-full mb-3">
                  🏛️
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">PE2 Court Application Form</h3>
                <p className="text-slate-700">
                  Complete your PE2 application form with court details and order information.
                </p>
              </div>
              
              <PE2DataCollectionForm
                onDataComplete={async (data) => {
                  try {
                    const response = await fetch('/api/generate-pe2-pdf', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data),
                    });
                    
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `PE2_Application_${data.claimNumber || 'form'}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      
                      toast.success('PE2 PDF generated and downloaded successfully!');
                      
                      const botMessage: Message = {
                        id: messages.length + 1,
                        type: "bot",
                        content: `🎉 **PE2 Application Completed Successfully!**\n\n✅ **Your PE2 form has been generated and downloaded**\n\n📄 **Next Steps:**\n• Review the downloaded PDF\n• Submit to the appropriate court\n• Keep copies for your records\n\n🏛️ **Court Submission:** Your PE2 application is ready for court filing.`,
                        timestamp: new Date(),
                      };
                      setMessages(prev => [...prev, botMessage]);
                      setIsCreatingAppeal(false);
                      setAppealStep("ticket_type_selection");
                    } else {
                      throw new Error('Failed to generate PDF');
                    }
                  } catch (error) {
                    console.error('Error generating PE2 PDF:', error);
                    toast.error('Failed to generate PE2 PDF. Please try again.');
                  }
                }}
              />
            </div>
          )}

          {appealStep === "pe3_form" && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6 mb-4 shadow-lg">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500 text-white rounded-full mb-3">
                  📋
                </div>
                <h3 className="text-xl font-bold text-amber-800 mb-2">PE3 Statutory Declaration Form</h3>
                <p className="text-amber-700">
                  Complete your PE3 statutory declaration for unpaid penalty charges.
                </p>
              </div>
              
              <PE3DataCollectionForm
                onDataComplete={async (data) => {
                  try {
                    const response = await fetch('/api/generate-pe3-pdf', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data),
                    });
                    
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `PE3_Statutory_Declaration_${data.claimNumber || 'form'}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      
                      toast.success('PE3 PDF generated and downloaded successfully!');
                      
                      const botMessage: Message = {
                        id: messages.length + 1,
                        type: "bot",
                        content: `🎉 **PE3 Statutory Declaration Completed Successfully!**\n\n✅ **Your PE3 form has been generated and downloaded**\n\n📄 **Next Steps:**\n• Review the downloaded PDF\n• Submit to the Traffic Enforcement Centre or Magistrates' Court\n• Keep copies for your records\n\n� **Statutory Declaration:** Your PE3 application is ready for court processing.`,
                        timestamp: new Date(),
                      };
                      setMessages(prev => [...prev, botMessage]);
                      setIsCreatingAppeal(false);
                      setAppealStep("ticket_type_selection");
                    } else {
                      throw new Error('Failed to generate PDF');
                    }
                  } catch (error) {
                    console.error('Error generating PE3 PDF:', error);
                    toast.error('Failed to generate PE3 PDF. Please try again.');
                  }
                }}
              />
            </div>
          )}

          {appealStep === "n244_form" && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl p-6 mb-4 shadow-lg">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500 text-white rounded-full mb-3">
                  📝
                </div>
                <h3 className="text-xl font-bold text-emerald-800 mb-2">N244 Application Notice</h3>
                <p className="text-emerald-700">
                  Complete your N244 application notice for court proceedings.
                </p>
              </div>
              
              <N244DataCollectionForm
                onDataComplete={async (data) => {
                  try {
                    const response = await fetch('/api/generate-n244-pdf', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data),
                    });
                    
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `N244_Application_Notice_${data.claimNumber || 'form'}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      
                      toast.success('N244 PDF generated and downloaded successfully!');
                      
                      const botMessage: Message = {
                        id: messages.length + 1,
                        type: "bot",
                        content: `🎉 **N244 Application Notice Completed Successfully!**\n\n✅ **Your N244 form has been generated and downloaded**\n\n📄 **Next Steps:**\n• Review the downloaded PDF\n• Submit to the appropriate court\n• Keep copies for your records\n\n⚖️ **Court Application:** Your N244 notice is ready for submission.`,
                        timestamp: new Date(),
                      };
                      setMessages(prev => [...prev, botMessage]);
                      setIsCreatingAppeal(false);
                      setAppealStep("ticket_type_selection");
                    } else {
                      throw new Error('Failed to generate PDF');
                    }
                  } catch (error) {
                    console.error('Error generating N244 PDF:', error);
                    toast.error('Failed to generate N244 PDF. Please try again.');
                  }
                }}
              />
            </div>
          )}

          {/* Updated download buttons for completed forms with signatures */}
          {(appealStep === "te7_complete" || appealStep === "te9_complete") && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                📥 {appealStep === "te7_complete" ? "TE7" : "TE9"} Form Ready for Download
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Your form has been completed with digital signature and is ready for download.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={appealStep === "te7_complete" ? downloadTE7WithSignature : downloadTE9WithSignature}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  📄 Download Signed PDF
                </Button>
                <Button
                  onClick={() => {
                    const formText = appealData.te7Form || appealData.te9Form || ''
                    const blob = new Blob([formText], { type: 'text/plain' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${appealStep === "te7_complete" ? 'TE7' : 'TE9'}_Form_Text.txt`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    window.URL.revokeObjectURL(url)
                    toast.success('Text version downloaded!')
                  }}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  📝 Download Text Version
                </Button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage()
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? "..." : "Send"}
            </Button>
            <Button
              onClick={resetConversation}
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Appeals

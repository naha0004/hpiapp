"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { api, handleApiError } from "@/lib/api"
import { UKTrafficLawAssistant } from "@/lib/uk-traffic-law-assistant"
import { AIAppealGenerator } from "@/lib/ai-appeal-generator"
import { detectTicketType, validateTicketNumber, validateTicketNumberForType, getAppealGuidance, TICKET_TYPES } from "@/lib/ticket-types"
import { Button } from "@/components/ui/button"
import { TE7SignatureForm, TE9SignatureForm, PE2SignatureForm, PE3SignatureForm, N244SignatureForm, useSignature } from "@/components/signature-canvas"
import { PE2Data, PE3Data, N244Data } from "@/types/appeal"

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
    content: "🏛️ **Welcome to ClearRideAI Traffic Appeals Assistant!**\n\nI'm your expert AI companion for challenging ALL types of UK traffic penalties using comprehensive UK legal framework integration including:\n\n📋 **Legal Framework Coverage:**\n• Civil Enforcement Regulations 2022\n• Traffic Management Act 2004\n• Traffic Signs Regulations (TSRGD) 2016\n• Road Traffic Acts 1988\n• Key case law (Moses v Barnet, Herron v Sunderland)\n\n⏰ **Deadline Awareness:**\n• 14 days PCN discount period\n• 28 days formal representations\n• 28 days tribunal appeals\n\n📋 **Court Forms Available:**\n• **TE7** - Request more time for court challenges\n• **TE9** - Witness statements for penalty charges\n• **PE2** - Application for permission to appeal\n• **PE3** - Appellant's notice for appeals\n• **N244** - General application notice\n\n🎯 **What Type of Ticket Are You Appealing?**\n\nPlease select your penalty type by clicking one of the buttons below, or simply tell me what form you need:",
    timestamp: new Date(),
  },
]

export function Appeals() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [appealData, setAppealData] = useState<Partial<AppealData>>({})
  const [appealStep, setAppealStep] = useState<"ticket_type_selection" | "ticket" | "vehicle_registration" | "amount" | "issue_date" | "due_date" | "location" | "reason" | "description" | "complete" | "te7_details" | "te7_reason" | "te7_signature" | "te7_complete" | "te9_details" | "te9_ground" | "te9_signature" | "te9_complete" | "pe2_details" | "pe2_appeal" | "pe2_signature" | "pe2_complete" | "pe3_details" | "pe3_appeal" | "pe3_signature" | "pe3_complete" | "n244_details" | "n244_application" | "n244_signature" | "n244_complete">("ticket_type_selection")
  const [isCreatingAppeal, setIsCreatingAppeal] = useState(false)
  
  // Signature functionality
  const { signatures, addSignature, hasSignature, getSignature } = useSignature()
  const [te7Signatures, setTE7Signatures] = useState<{ applicant?: string; witness?: string }>({})
  const [te9Signatures, setTE9Signatures] = useState<{ declarant?: string; witness?: string }>({})
  const [pe2Signatures, setPE2Signatures] = useState<{ applicant?: string }>({})
  const [pe3Signatures, setPE3Signatures] = useState<{ appellant?: string }>({})
  const [n244Signatures, setN244Signatures] = useState<{ applicant?: string }>({})
  
  // Form data states
  const [pe2Data, setPE2Data] = useState<Partial<PE2Data>>({})
  const [pe3Data, setPE3Data] = useState<Partial<PE3Data>>({})
  const [n244Data, setN244Data] = useState<Partial<N244Data>>({})
  const [te7Data, setTE7Data] = useState<any>({})
  const [te9Data, setTE9Data] = useState<any>({})

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

  // AI Appeal Generation
  const generateAIAppeal = async (appealCaseData: any) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/ai/generate-appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appealData: {
            reason: appealCaseData.reason,
            ticketNumber: appealCaseData.ticketNumber,
            issueDate: appealCaseData.issueDate,
            location: appealCaseData.location,
            vehicleRegistration: appealCaseData.vehicleRegistration,
            description: appealCaseData.description,
            evidence: appealCaseData.evidence || []
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI appeal')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('🤖 Unique AI appeal generated successfully!')
        return result.appeal
      } else {
        throw new Error(result.error || 'Failed to generate appeal')
      }
    } catch (error) {
      console.error('AI Appeal Generation Error:', error)
      toast.error('❌ Failed to generate AI appeal. Using standard template.')
      // Fallback to standard generation
      return UKTrafficLawAssistant.generateAppealLetter(appealCaseData)
    } finally {
      setIsLoading(false)
    }
  }

  // PDF download functions for appeal letters
  const downloadAppealLetterPDF = async (appealData: AppealData) => {
    if (!appealData.ticketNumber) {
      toast.error('Please complete the appeal details first.')
      return
    }

    try {
      // Generate the appeal letter text
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

      // Generate AI-powered appeal letter (unique for each user/case)
      const appealLetter = await generateAIAppeal(appealCase)

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

  const handlePE2SignatureComplete = (signatures: { applicant?: string }) => {
    setPE2Signatures(signatures)
    // Store signature for later PDF generation
    setPE2Data(prev => ({ ...prev, applicantSignature: signatures.applicant }))
    
    setAppealStep("pe2_complete")
    
    const botMessage: Message = {
      id: messages.length + 1,
      type: "bot",
      content: `🎉 **Perfect! Your PE2 Application for Permission to Appeal is Complete!**\n\n✅ **What I've Done for You:**\n• ✍️ Captured your digital signature\n• 📄 Embedded signature into your PE2 PDF\n• 🏛️ Prepared form for court submission\n• 📋 Generated professional legal document\n\n🚀 **Your PE2 Application is Ready!**\n\n**Next Steps:**\n1. **📥 Download** your signed PE2 PDF below\n2. **✉️ Submit** to the original court that made the decision\n3. **📁 Keep** copies for your records\n4. **⏰ Await** the court's decision on permission\n\n📍 **Submit to the court that made the original decision**\n\n💡 **Important:** You must submit within the time limit specified in the court rules (usually 21 days from the decision).`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, botMessage])
  }

  const handlePE3SignatureComplete = (signatures: { appellant?: string }) => {
    setPE3Signatures(signatures)
    // Store signature for later PDF generation
    setPE3Data(prev => ({ ...prev, appellantSignature: signatures.appellant }))
    
    setAppealStep("pe3_complete")
    
    const botMessage: Message = {
      id: messages.length + 1,
      type: "bot",
      content: `🎉 **Excellent! Your PE3 Appellant's Notice is Complete!**\n\n✅ **What I've Done for You:**\n• ✍️ Captured your digital signature\n• 📄 Embedded signature into your PE3 PDF\n• 🏛️ Prepared form for appeal court submission\n• 📋 Generated professional legal document\n\n🚀 **Your PE3 Appeal Notice is Ready!**\n\n**Next Steps:**\n1. **📥 Download** your signed PE3 PDF below\n2. **✉️ Submit** to the appeal court\n3. **📄 File** any supporting evidence separately\n4. **📁 Keep** copies for your records\n5. **⏰ Prepare** for the appeal hearing\n\n📍 **Submit to the appropriate appeal court (usually Court of Appeal)**\n\n💡 **Important:** Ensure you have permission to appeal before submitting this form.`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, botMessage])
  }

  const handleN244SignatureComplete = (signatures: { applicant?: string }) => {
    setN244Signatures(signatures)
    // Store signature for later PDF generation
    setN244Data(prev => ({ ...prev, applicantSignature: signatures.applicant }))
    
    setAppealStep("n244_complete")
    
    const botMessage: Message = {
      id: messages.length + 1,
      type: "bot",
      content: `🎉 **Outstanding! Your N244 Application Notice is Complete!**\n\n✅ **What I've Done for You:**\n• ✍️ Captured your digital signature\n• 📄 Embedded signature into your N244 PDF\n• 🏛️ Prepared form for court submission\n• 📋 Generated professional legal document\n\n🚀 **Your N244 Application is Ready!**\n\n**Next Steps:**\n1. **📥 Download** your signed N244 PDF below\n2. **💰 Pay** the application fee (usually £100)\n3. **✉️ Submit** to the relevant court\n4. **📤 Serve** copies on other parties as required\n5. **📁 Keep** copies for your records\n\n📍 **Submit to the court handling your case**\n\n💡 **Important:** Check if you need to serve copies on other parties and whether a hearing is required.`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, botMessage])
  }
  
  // PDF download functions
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
  
  const downloadPE2WithSignature = async () => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'PE2',
          formData: pe2Data
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `PE2_Application_${pe2Data.caseNumber || 'form'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PE2 PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading PE2 PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
    }
  }

  const downloadPE3WithSignature = async () => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'PE3',
          formData: pe3Data
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `PE3_Appellant_Notice_${pe3Data.caseNumber || 'form'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PE3 PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading PE3 PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
    }
  }

  const downloadN244WithSignature = async () => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'N244',
          formData: n244Data
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `N244_Application_${n244Data.caseNumber || 'form'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('N244 PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading N244 PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
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
    // Handle TE7 and TE9 as special form services
    if (ticketTypeId === 'te7' || ticketTypeId === 'te9') {
      setIsCreatingAppeal(true)
      
      if (ticketTypeId === 'te7') {
        setAppealStep("te7_details")
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `📋 **TE7 Form Service - Court Order Challenge**\n\n**Form Purpose:** Request more time to challenge a court order ('order of recovery') for traffic enforcement charges\n\n🏛️ **Submission To:** Traffic Enforcement Centre\n📝 **Form Type:** Official court form TE7 (we'll fill out your blank template)\n\n**This form is used when:**\n• You need more time to challenge a court order\n• You missed the original deadline to respond\n• You want to apply for an extension\n\n**📝 Required Information to Complete Your TE7 Form:**\n\n1️⃣ **Your Full Name**\n2️⃣ **Your Complete Address** \n3️⃣ **Court Reference/Case Number**\n4️⃣ **Vehicle Registration**\n5️⃣ **Reason for requesting extension**\n6️⃣ **Original penalty amount**\n\n**Let's start - please provide your full name:**`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      } else { // te9
        setAppealStep("te9_details")
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `⚖️ **TE9 Form Service - Witness Statement (Unpaid Penalty Charge)**\n\n**Form Purpose:** Official witness statement for unpaid penalty charges at Traffic Enforcement Centre\n\n🏛️ **Submission To:** Traffic Enforcement Centre, Northampton County Court\n📝 **Form Type:** Official court form TE9 (we'll fill out your blank template)\n\n**📋 Required Information (from official TE9 form):**\n\n**BASIC DETAILS:**\n1️⃣ **Penalty Charge Number**\n2️⃣ **Vehicle Registration Number**\n3️⃣ **Your Name** (witness)\n4️⃣ **Your Address** (including postcode)\n5️⃣ **Company Name** (if vehicle owned by company)\n6️⃣ **Date of Contravention**\n7️⃣ **Location of Contravention**\n\n**WITNESS STATEMENT GROUNDS** (you must choose one):\n• You did not receive the penalty charge notice\n• You made representations but got no reply\n• You appealed but got no response or unfavorable response\n• The penalty charge has been paid in full\n\n**Let's start - please provide your Penalty Charge Number:**`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      }
      return
    }

    // Handle PE2, PE3, N244 forms
    if (['pe2', 'pe3', 'n244'].includes(ticketTypeId)) {
      setIsCreatingAppeal(true)
      
      if (ticketTypeId === 'pe2') {
        setAppealStep("pe2_details")
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `📋 **PE2 Form Service - Application for Permission to Appeal**\n\n**Form Purpose:** Request permission to appeal a court decision to a higher court\n\n🏛️ **Submission To:** Court that made the original decision\n📝 **Form Type:** Official court form PE2\n\n**This form is used when:**\n• You want to appeal a court decision\n• You need permission to appeal\n• You're challenging a judgment or order\n\n**📝 Required Information to Complete Your PE2 Form:**\n\n1️⃣ **Your Full Name**\n2️⃣ **Your Complete Address** \n3️⃣ **Case Number**\n4️⃣ **Court Name**\n5️⃣ **Date of Original Decision**\n6️⃣ **Decision Being Appealed**\n7️⃣ **Grounds for Appeal**\n\n**Let's start - please provide your full name:**`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      } else if (ticketTypeId === 'pe3') {
        setAppealStep("pe3_details")
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `📑 **PE3 Form Service - Appellant's Notice**\n\n**Form Purpose:** Formal notice of your intention to appeal to a higher court\n\n🏛️ **Submission To:** Appeal court (usually Court of Appeal)\n📝 **Form Type:** Official court form PE3\n\n**This form is used when:**\n• You have permission to appeal\n• You're formally notifying the court of your appeal\n• You're setting out your case for appeal\n\n**📝 Required Information to Complete Your PE3 Form:**\n\n1️⃣ **Your Full Name (Appellant)**\n2️⃣ **Your Complete Address** \n3️⃣ **Case Number**\n4️⃣ **Original Court Name**\n5️⃣ **Appeal Court Name**\n6️⃣ **Respondent Details**\n7️⃣ **Date of Decision**\n8️⃣ **Grounds of Appeal**\n\n**Let's start - please provide your full name:**`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      } else { // n244
        setAppealStep("n244_details")
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `📄 **N244 Form Service - Application Notice**\n\n**Form Purpose:** Make an application to the court for a specific order or direction\n\n🏛️ **Submission To:** Relevant court handling your case\n📝 **Form Type:** Official court form N244\n\n**This form is used when:**\n• You need to ask the court for a specific order\n• You want to apply for a hearing\n• You're requesting a procedural direction\n• You need to vary an existing order\n\n**📝 Required Information to Complete Your N244 Form:**\n\n1️⃣ **Your Full Name**\n2️⃣ **Your Capacity** (Claimant/Defendant/Other)\n3️⃣ **Your Complete Address** \n4️⃣ **Case Number**\n5️⃣ **Court Name**\n6️⃣ **Order Sought**\n7️⃣ **Reason for Application**\n8️⃣ **Supporting Evidence**\n\n**Let's start - please provide your full name:**`,
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
        content: `✅ **${selectedType.name} Selected!**\n\n🎫 **Appeal Type:** ${selectedType.name}\n📋 **Category:** ${selectedType.category.charAt(0).toUpperCase() + selectedType.category.slice(1)} penalty\n⚖️ **Appeal Route:** ${selectedType.authority}\n\n📝 **Enter Your Ticket Number**\n\n${selectedType.description}\n\n🔍 **Expected Format:** ${selectedType.patterns[0].source}\n📝 **Example:** ${selectedType.examples[0]}\n\n**Please enter your ${selectedType.name.toLowerCase()} number:**`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMessage])
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user" , 
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = inputValue.trim()
    setInputValue("")
    setIsLoading(true)

    try {
      let botResponse = ""

      // Check if user is asking for specific forms in natural language
      const lowerInput = userInput.toLowerCase()
      if (!isCreatingAppeal) {
        if (lowerInput.includes('pe2') || (lowerInput.includes('permission') && lowerInput.includes('appeal'))) {
          handleTicketTypeSelection('pe2')
          return
        }
        if (lowerInput.includes('pe3') || (lowerInput.includes('appellant') && lowerInput.includes('notice'))) {
          handleTicketTypeSelection('pe3')
          return
        }
        if (lowerInput.includes('n244') || (lowerInput.includes('application') && lowerInput.includes('notice'))) {
          handleTicketTypeSelection('n244')
          return
        }
        if (lowerInput.includes('te7') || (lowerInput.includes('more time') && lowerInput.includes('court'))) {
          handleTicketTypeSelection('te7')
          return
        }
        if (lowerInput.includes('te9') || (lowerInput.includes('witness') && lowerInput.includes('statement'))) {
          handleTicketTypeSelection('te9')
          return
        }
      }

      // Continue with existing form handling logic...
      if (isCreatingAppeal) {
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
              
              // Generate AI-powered unique description
              try {
                const aiDescription = await generateAIAppeal(appealCaseData)
                setAppealData(prev => ({ ...prev, description: aiDescription }))
                setAppealStep("complete")
                botResponse = `🤖 **Unique AI Appeal Generated Successfully!**\n\n📋 **Your Personalized Appeal:**\n"${aiDescription.substring(0, 200)}..."\n\n✅ **AI-Powered Appeal Complete!** Your unique appeal includes:\n• 🧠 AI-generated unique content (never templated)\n• ⚖️ Legal precedents specific to your case\n• 📝 Professional language tailored to your circumstances\n• 🎯 Strategic arguments for maximum success\n• 🔒 Completely unique to your case and user ID\n\n📄 **Next Steps:**\n1. Review your AI-generated appeal\n2. Submit to the appropriate authority\n3. Keep copies of all correspondence\n\n🚀 **AI Advantage:** This appeal is completely unique and generated specifically for your case using advanced AI!`
              } catch (error) {
                console.error('AI generation failed, using fallback:', error)
                const generatedDescription = UKTrafficLawAssistant.generateAppealDescription(appealCaseData)
                setAppealData(prev => ({ ...prev, description: generatedDescription }))
                setAppealStep("complete")
                botResponse = `📋 **Professional Appeal Generated!**\n\n📋 **Your Appeal:**\n"${generatedDescription}"\n\n✅ **Appeal Complete!** (Note: AI generation temporarily unavailable, used professional template)`
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

          // PE2 Form Steps
          case "pe2_details":
            setPE2Data(prev => ({ ...prev, applicantName: userInput }))
            setAppealStep("pe2_appeal")
            botResponse = `✅ **Name Recorded: ${userInput}**\n\nNow please provide the remaining information:\n\n2️⃣ **Your Complete Address** (including postcode)\n3️⃣ **Case Number**\n4️⃣ **Court Name**\n5️⃣ **Date of Original Decision** (DD/MM/YYYY)\n6️⃣ **Decision Being Appealed** (brief description)\n7️⃣ **Grounds for Appeal** (detailed explanation)\n8️⃣ **Do you have legal representation?** (Yes/No)\n\n**Please provide all details above (use separate lines for each):**`
            break

          case "pe2_appeal":
            const pe2Lines = userInput.split('\n').filter(line => line.trim())
            const hasLegalRep = (pe2Lines[6]?.toLowerCase() || '').includes('yes')
            
            const completePE2Data: PE2Data = {
              caseNumber: pe2Lines[1] || 'Not provided',
              courtName: pe2Lines[2] || 'Not provided',
              applicantName: pe2Data.applicantName || 'Not provided',
              applicantAddress: pe2Lines[0] || 'Not provided',
              applicantPostcode: pe2Lines[0]?.split(',').pop()?.trim() || 'Not provided',
              originalDecisionDate: pe2Lines[3] || 'Not provided',
              decisionBeingAppealed: pe2Lines[4] || 'Not provided',
              groundsForAppeal: pe2Lines[5] || 'Not provided',
              hasLegalRepresentation: hasLegalRep,
              signatureDate: new Date().toLocaleDateString('en-GB')
            }
            
            setPE2Data(completePE2Data)
            setAppealStep("pe2_signature")
            botResponse = `📋 **PE2 Form Completed Successfully!**\n\n**Summary of Your Application:**\n• **Applicant:** ${completePE2Data.applicantName}\n• **Case:** ${completePE2Data.caseNumber}\n• **Court:** ${completePE2Data.courtName}\n• **Decision Date:** ${completePE2Data.originalDecisionDate}\n• **Legal Representation:** ${hasLegalRep ? 'Yes' : 'No'}\n\n✍️ **Digital signature required to finalize your PE2 form.**\n\n👇 **Please sign below** 👇`
            setTimeout(() => {
              setAppealStep("pe2_signature")
            }, 100)
            break

          // PE3 Form Steps
          case "pe3_details":
            setPE3Data(prev => ({ ...prev, appellantName: userInput }))
            setAppealStep("pe3_appeal")
            botResponse = `✅ **Appellant Name Recorded: ${userInput}**\n\nNow please provide the remaining information:\n\n2️⃣ **Your Complete Address** (including postcode)\n3️⃣ **Case Number**\n4️⃣ **Original Court Name**\n5️⃣ **Appeal Court Name**\n6️⃣ **Respondent Name**\n7️⃣ **Date of Decision** (DD/MM/YYYY)\n8️⃣ **Decision Being Appealed**\n9️⃣ **Order Sought from Appeal Court**\n🔟 **Grounds of Appeal** (detailed explanation)\n\n**Please provide all details above (use separate lines for each):**`
            break

          case "pe3_appeal":
            const pe3Lines = userInput.split('\n').filter(line => line.trim())
            
            const completePE3Data: PE3Data = {
              caseNumber: pe3Lines[1] || 'Not provided',
              originalCourtName: pe3Lines[2] || 'Not provided',
              courtName: pe3Lines[3] || 'Not provided',
              appellantName: pe3Data.appellantName || 'Not provided',
              appellantAddress: pe3Lines[0] || 'Not provided',
              appellantPostcode: pe3Lines[0]?.split(',').pop()?.trim() || 'Not provided',
              respondentName: pe3Lines[4] || 'Not provided',
              dateOfDecision: pe3Lines[5] || 'Not provided',
              decisionAppealed: pe3Lines[6] || 'Not provided',
              orderSought: pe3Lines[7] || 'Not provided',
              groundsOfAppeal: pe3Lines[8] || 'Not provided',
              evidenceFiledSeparately: false,
              skeletonArgumentFiled: false,
              signatureDate: new Date().toLocaleDateString('en-GB')
            }
            
            setPE3Data(completePE3Data)
            setAppealStep("pe3_signature")
            botResponse = `📑 **PE3 Appellant's Notice Completed Successfully!**\n\n**Summary of Your Appeal:**\n• **Appellant:** ${completePE3Data.appellantName}\n• **Case:** ${completePE3Data.caseNumber}\n• **From:** ${completePE3Data.originalCourtName}\n• **To:** ${completePE3Data.courtName}\n• **Respondent:** ${completePE3Data.respondentName}\n• **Decision Date:** ${completePE3Data.dateOfDecision}\n\n✍️ **Digital signature required to finalize your PE3 form.**\n\n👇 **Please sign below** 👇`
            setTimeout(() => {
              setAppealStep("pe3_signature")
            }, 100)
            break

          // N244 Form Steps
          case "n244_details":
            setN244Data(prev => ({ ...prev, applicantName: userInput }))
            setAppealStep("n244_application")
            botResponse = `✅ **Applicant Name Recorded: ${userInput}**\n\nNow please provide the remaining information:\n\n2️⃣ **Your Capacity** (Claimant/Defendant/Other)\n3️⃣ **Your Complete Address** (including postcode)\n4️⃣ **Case Number**\n5️⃣ **Court Name**\n6️⃣ **Order Sought** (what you want the court to do)\n7️⃣ **Reason for Application** (why you need this order)\n8️⃣ **Supporting Evidence** (evidence for your application)\n9️⃣ **Do you need a hearing?** (Yes/No)\n🔟 **Service Required On** (who needs to be notified)\n\n**Please provide all details above (use separate lines for each):**`
            break

          case "n244_application":
            const n244Lines = userInput.split('\n').filter(line => line.trim())
            const needsHearing = (n244Lines[7]?.toLowerCase() || '').includes('yes')
            
            const completeN244Data: N244Data = {
              caseNumber: n244Lines[2] || 'Not provided',
              courtName: n244Lines[3] || 'Not provided',
              applicantName: n244Data.applicantName || 'Not provided',
              applicantCapacity: (n244Lines[0] as any) || 'Other',
              applicantAddress: n244Lines[1] || 'Not provided',
              applicantPostcode: n244Lines[1]?.split(',').pop()?.trim() || 'Not provided',
              orderSought: n244Lines[4] || 'Not provided',
              reasonForApplication: n244Lines[5] || 'Not provided',
              evidenceSupport: n244Lines[6] || 'Not provided',
              hearingRequired: needsHearing,
              serviceRequiredOn: [n244Lines[8] || 'Not provided'],
              proposedServiceMethod: 'By post',
              feeRequired: '£100',
              signatureDate: new Date().toLocaleDateString('en-GB')
            }
            
            setN244Data(completeN244Data)
            setAppealStep("n244_signature")
            botResponse = `📄 **N244 Application Notice Completed Successfully!**\n\n**Summary of Your Application:**\n• **Applicant:** ${completeN244Data.applicantName}\n• **Capacity:** ${completeN244Data.applicantCapacity}\n• **Case:** ${completeN244Data.caseNumber}\n• **Court:** ${completeN244Data.courtName}\n• **Order Sought:** ${completeN244Data.orderSought}\n• **Hearing Required:** ${needsHearing ? 'Yes' : 'No'}\n\n✍️ **Digital signature required to finalize your N244 form.**\n\n👇 **Please sign below** 👇`
            setTimeout(() => {
              setAppealStep("n244_signature")
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
                📋 <span className="text-xs">PE2 Appeal Permission</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('pe3')}
                className="h-20 flex flex-col items-center gap-1"
              >
                📑 <span className="text-xs">PE3 Appellant Notice</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleTicketTypeSelection('n244')}
                className="h-20 flex flex-col items-center gap-1"
              >
                📄 <span className="text-xs">N244 Application</span>
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

          {appealStep === "pe2_signature" && (
            <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-300 rounded-xl p-6 mb-4 shadow-lg">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full mb-3">
                  ✔️
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Signature Required</h3>
                <p className="text-green-700">
                  Your PE2 form is ready! Please provide your signature to complete your application.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <PE2SignatureForm onSignatureComplete={handlePE2SignatureComplete} />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-green-600">
                  🔒 Your signature will be securely embedded in the PDF and is required for court submission.
                </p>
              </div>
            </div>
          )}

          {appealStep === "pe3_signature" && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-6 mb-4 shadow-lg">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full mb-3">
                  📄
                </div>
                <h3 className="text-xl font-bold text-blue-800 mb-2">Signature Required</h3>
                <p className="text-blue-700">
                  Your PE3 form is ready! Please provide your signature to complete your appellant's notice.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <PE3SignatureForm onSignatureComplete={handlePE3SignatureComplete} />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-blue-600">
                  🔒 Your signature will be securely embedded in the PDF and is required for court submission.
                </p>
              </div>
            </div>
          )}

          {appealStep === "n244_signature" && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl p-6 mb-4 shadow-lg">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 text-white rounded-full mb-3">
                  📋
                </div>
                <h3 className="text-xl font-bold text-orange-800 mb-2">Signature Required</h3>
                <p className="text-orange-700">
                  Your N244 application notice is ready! Please provide your signature to complete your application.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <N244SignatureForm onSignatureComplete={handleN244SignatureComplete} />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-orange-600">
                  🔒 Your signature will be securely embedded in the PDF and is required for court submission.
                </p>
              </div>
            </div>
          )}

          {/* Updated download buttons for completed forms with signatures */}
          {(appealStep === "te7_complete" || appealStep === "te9_complete" || appealStep === "pe2_complete" || appealStep === "pe3_complete" || appealStep === "n244_complete") && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                📥 {appealStep === "te7_complete" ? "TE7" : appealStep === "te9_complete" ? "TE9" : appealStep === "pe2_complete" ? "PE2" : appealStep === "pe3_complete" ? "PE3" : "N244"} Form Ready for Download
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Your form has been completed with digital signature and is ready for download.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={appealStep === "te7_complete" ? downloadTE7WithSignature : appealStep === "te9_complete" ? downloadTE9WithSignature : appealStep === "pe2_complete" ? downloadPE2WithSignature : appealStep === "pe3_complete" ? downloadPE3WithSignature : downloadN244WithSignature}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  📄 Download Signed PDF
                </Button>
                <Button
                  onClick={() => {
                    const formType = appealStep === "te7_complete" ? 'TE7' : 
                                   appealStep === "te9_complete" ? 'TE9' : 
                                   appealStep === "pe2_complete" ? 'PE2' : 
                                   appealStep === "pe3_complete" ? 'PE3' : 'N244'
                    const formText = `${formType} Form Completed Successfully\n\nForm Type: ${formType}\nCompletion Date: ${new Date().toLocaleDateString('en-GB')}\n\nThis form has been digitally signed and is ready for submission.`
                    const blob = new Blob([formText], { type: 'text/plain' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${formType}_Form_Summary.txt`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    window.URL.revokeObjectURL(url)
                    toast.success('Form summary downloaded!')
                  }}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  📝 Download Summary
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

"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { api, handleApiError } from "@/lib/api"
import { UKTrafficLawAssistant } from "@/lib/uk-traffic-law-assistant"
import { detectTicketType, validateTicketNumber, validateTicketNumberForType, getAppealGuidance, TICKET_TYPES } from "@/lib/ticket-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaymentModal } from "@/components/payment-modal"
import Link from "next/link"
import { 
  Send, 
  User, 
  Bot, 
  FileText, 
  Calendar,
  Clock,
  CheckCircle,
  Sparkles,
  XCircle,
  AlertCircle,
  Plus,
  Save,
  Upload,
  Paperclip,
  X,
  Image,
  File,
  Camera,
  Scan,
  Wand2,
  Download,
  Car,
  CreditCard
} from "lucide-react"

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  timestamp: Date
}

interface Appeal {
  id: string
  ticketNumber: string
  ticketType?: string // Type of ticket (pcn, fpn, tec, etc.)
  category?: 'civil' | 'criminal' | 'private' // Appeal category
  fineAmount: number
  issueDate: string
  dueDate: string
  location: string
  reason: string
  description: string
  evidence?: string[] | string | null
  status: "SUBMITTED" | "UNDER_REVIEW" | "ADDITIONAL_INFO_REQUIRED" | "APPROVED" | "REJECTED" | "WITHDRAWN"
  submissionDate: string
  createdAt: string
  vehicle?: {
    registration: string
  }
  te7Form?: TE7FormData
  te9Form?: TE9FormData
  selectedForms?: string[]
}

interface AppealData {
  ticketNumber: string
  ticketType?: string // Type of ticket detected
  category?: 'civil' | 'criminal' | 'private' // Appeal category
  vehicleRegistration?: string // Vehicle registration number
  fineAmount: number
  issueDate: string
  dueDate: string
  location: string
  reason: string
  description: string
  vehicleId?: string
  evidence?: string[]
  te7Form?: TE7FormData
  te9Form?: TE9FormData
  selectedForms?: string[]
}

interface TE7FormData {
  // Witness Statement Form
  witnessName: string
  witnessAddress: string
  witnessPhone: string
  witnessEmail: string
  relationshipToDriver: string
  statementDate: string
  witnessStatement: string
  witnessSignature?: string
}

interface TE9FormData {
  // Statutory Declaration Form
  declarantName: string
  declarantAddress: string
  declarantPhone: string
  declarantEmail: string
  declarationDate: string
  declarationType: "not_driver" | "not_received" | "other"
  declarationStatement: string
  declarantSignature?: string
  witnessName?: string
  witnessAddress?: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: Date
}

const initialMessages: Message[] = [
  {
    id: 1,
    type: "bot",
    content:
      "🏛️ **Welcome to ClearRideAI Traffic Appeals Assistant!**\n\nI'm your expert AI companion for challenging ALL types of UK traffic penalties and fines. I've helped thousands of drivers successfully appeal their penalties using advanced legal analysis and comprehensive UK traffic law expertise.\n\n🎯 **What Type of Ticket Are You Appealing?**\n\nPlease select your penalty type by clicking one of the buttons below:\n\n🅿️ **Parking Penalty (PCN)** - Council/private parking violations\n🏎️ **Speeding Fine (FPN)** - Speed cameras, police stops\n🚌 **Bus Lane Violation** - Unauthorized bus lane use\n🔴 **Traffic Light Fine** - Red light camera violations\n💰 **Congestion/ULEZ Charge** - London zone penalties\n🚗 **TEC Court Fine** - Traffic Enforcement Centre penalties\n📋 **DVLA Fine** - Tax, insurance, MOT violations\n🏢 **Private Parking** - Car park operators, retail sites\n⚡ **Clean Air Zone** - Low emission zone charges\n🛑 **Other Traffic Fine** - Any other UK traffic penalty\n\n📸 **Alternative**: Upload a photo of your penalty notice and I'll automatically detect the type!\n\n**Choose your penalty type to get started with a personalized appeal strategy.**",
    timestamp: new Date(),
  },
]

export function Appeals() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAppeals, setIsLoadingAppeals] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  
  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [userUsage, setUserUsage] = useState<any>(null)
  const [pendingAppealData, setPendingAppealData] = useState<any>(null)
  
  // Appeal creation state
  const [appealData, setAppealData] = useState<Partial<AppealData>>({})
  const [appealStep, setAppealStep] = useState<"ticket_type_selection" | "ticket" | "vehicle_registration" | "amount" | "issue_date" | "due_date" | "location" | "reason" | "description" | "form_selection" | "te7_form" | "te9_form" | "evidence" | "complete">("ticket_type_selection")
  const [isCreatingAppeal, setIsCreatingAppeal] = useState(false)
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Document scanning state
  const [isScanning, setIsScanning] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Auto-fill state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [extractedData, setExtractedData] = useState<Partial<AppealData> | null>(null)
  const [showAutoFillPrompt, setShowAutoFillPrompt] = useState(false)
  
  // Vehicle registration popup state
  const [showVehicleRegModal, setShowVehicleRegModal] = useState(false)
  const [vehicleRegInput, setVehicleRegInput] = useState("")
  const [isCheckingTrialStatus, setIsCheckingTrialStatus] = useState(false)
  
  const rejectAutoFill = () => {
    setShowAutoFillPrompt(false)
    setExtractedData(null)
  }
  
  const applyAutoFill = () => {
    if (extractedData) {
      setAppealData(prev => ({ ...prev, ...extractedData }))
      if (extractedData.ticketNumber) setAppealStep("amount")
      else if (extractedData.fineAmount) setAppealStep("issue_date")
      else if (extractedData.issueDate) setAppealStep("due_date")
      else if (extractedData.dueDate) setAppealStep("location")
      else if (extractedData.location) setAppealStep("reason")
      else if (extractedData.reason) setAppealStep("description")
      setShowAutoFillPrompt(false)
      setExtractedData(null)
    }
  }

  const triggerDemoAutoFill = () => {
    // Example extracted data for demo
    const demoData: Partial<AppealData> = {
      ticketNumber: "PCN123456",
      fineAmount: 60.00,
      issueDate: "2024-03-15",
      dueDate: "2024-04-15",
      location: "High Street Car Park, Birmingham",
      reason: "Invalid signage"
    }
    setExtractedData(demoData)
    setShowAutoFillPrompt(true)
  }
  
  // Form state
  const [te7Data, setTE7Data] = useState<Partial<TE7FormData>>({})
  const [te9Data, setTE9Data] = useState<Partial<TE9FormData>>({})
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  
  // PDF generation state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [generatedPDFs, setGeneratedPDFs] = useState<{te7?: string, te9?: string}>({})
  const [showPDFModal, setShowPDFModal] = useState(false)

  // Fetch appeals on component mount
  useEffect(() => {
    if (session?.user) {
      fetchAppeals()
      fetchUserUsage()
    }
  }, [session])

  const fetchUserUsage = async () => {
    try {
      const response = await fetch('/api/user/usage')
      if (response.ok) {
        const data = await response.json()
        setUserUsage(data)
      }
    } catch (error) {
      console.error('Error fetching user usage:', error)
    }
  }

  // Show vehicle registration popup on component mount (only if not already creating appeal)
  useEffect(() => {
    if (!isCreatingAppeal && !appealData.vehicleRegistration) {
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        setShowVehicleRegModal(true)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isCreatingAppeal, appealData.vehicleRegistration])

  // Keyboard shortcuts for quick actions
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Only handle shortcuts on the chat tab and when no messages exist
      if (activeTab === 'chat' && messages.length === 0 && !isLoading) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setInputValue("🏎️ I received a speeding fine and want to challenge it. I believe I was not exceeding the speed limit, or there may have been issues with the speed detection equipment, calibration, or the statutory notice requirements under UK traffic law.");
            setTimeout(() => handleSendMessage(), 100);
            break;
          case '2':
            e.preventDefault();
            setInputValue("🅿️ I got a parking penalty charge notice (PCN) but I believe it was issued unfairly. This could be due to unclear signage, valid permit displayed, payment machine issues, or I was legally entitled to park there for loading/medical reasons.");
            setTimeout(() => handleSendMessage(), 100);
            break;
          case '3':
            e.preventDefault();
            setInputValue("🔴 I received a red light camera penalty but I believe the traffic light system was faulty, the amber phase was too short, or I had already crossed the stop line before the light changed to red. I want to challenge this penalty.");
            setTimeout(() => handleSendMessage(), 100);
            break;
          case '4':
            e.preventDefault();
            setInputValue("🚌 I got a bus lane violation penalty but I believe I was legally entitled to use the bus lane at that time, the signage was unclear about operating hours, or there was an emergency/obstruction that forced me to enter the bus lane.");
            setTimeout(() => handleSendMessage(), 100);
            break;
          case '5':
            e.preventDefault();
            setInputValue("💰 I received a congestion charge penalty notice but I believe I had a valid exemption, had already paid the charge, the vehicle is exempt, or there were technical issues with the payment system or camera detection.");
            setTimeout(() => handleSendMessage(), 100);
            break;
          case '6':
            e.preventDefault();
            setInputValue("📋 I received a traffic penalty for a different type of violation and want to challenge it. This could be related to box junctions, yellow lines, residents' parking, school streets, or other traffic restrictions that I believe were incorrectly applied.");
            setTimeout(() => handleSendMessage(), 100);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [activeTab, messages.length, isLoading, setInputValue]);

  // Auto-fill TE7 and TE9 forms with collected customer data
  const autoFillFormData = (formType: 'te7' | 'te9') => {
    const currentDate = new Date().toISOString().split('T')[0]
    
    if (formType === 'te7') {
      const autoFilledTE7: Partial<TE7FormData> = {
        // Pre-fill from existing appeal data where available
        witnessName: '', // Will be collected from user
        witnessAddress: '', // Will be collected from user  
        witnessPhone: '', // Will be collected from user
        witnessEmail: '', // Will be collected from user
        relationshipToDriver: appealData.vehicleRegistration || '',
        statementDate: currentDate,
        witnessStatement: '', // Will be generated by AI
      }
      setTE7Data(autoFilledTE7)
    } else if (formType === 'te9') {
      const autoFilledTE9: Partial<TE9FormData> = {
        // Pre-fill from existing appeal data where available
        declarantName: '', // Will be collected from user
        declarantAddress: '', // Will be collected from user
        declarantPhone: '', // Will be collected from user
        declarantEmail: '', // Will be collected from user
        declarationDate: currentDate,
        declarationType: 'not_received', // Default, can be changed
        declarationStatement: '', // Will be generated by AI
      }
      setTE9Data(autoFilledTE9)
    }
  }

  // Enhanced form step navigation with auto-fill
  const handleFormStepWithAutoFill = (formType: 'te7' | 'te9', step: string, userInput: string) => {
    let response = ''
    
    if (formType === 'te7') {
      switch (step) {
        case 'start':
          // Auto-fill what we can and ask for what we need
          const autoFillPreview = showAutoFillPreview('te7')
          response = `🤖 **Smart Auto-Fill Activated for TE7 Form**\n\n✅ **Pre-filled from your appeal data:**\n${autoFillPreview}\n\n📋 **Additional auto-fills:**\n• Filing Date: ${new Date().toLocaleDateString('en-GB')}\n• Form Template: Official TE7 PDF will be generated\n• Court Address: Traffic Enforcement Centre, Northampton\n\n⚡ **Time Saved**: Approximately 15 minutes of form filling!\n\n📝 **I still need from you:**\n\n**Step 1**: What is your full legal name? (as it should appear on official court documents)\n\n💡 **Tip**: This will be used to generate a professional, court-ready TE7 form that you can print and submit.`
          autoFillFormData('te7')
          break
      }
    } else if (formType === 'te9') {
      switch (step) {
        case 'start':
          const autoFillPreview = showAutoFillPreview('te9')
          response = `🤖 **Smart Auto-Fill Activated for TE9 Form**\n\n✅ **Pre-filled from your appeal data:**\n${autoFillPreview}\n\n📋 **Additional auto-fills:**\n• Declaration Date: ${new Date().toLocaleDateString('en-GB')}\n• Court Template: Official TE9 PDF will be generated\n• Filing Location: Traffic Enforcement Centre, Northampton\n• Legal Framework: Traffic Management Act 2004\n\n⚡ **Time Saved**: Approximately 20 minutes of complex legal form completion!\n\n📝 **I still need from you:**\n\n**Step 1**: What is your full legal name? (as it should appear on the statutory declaration)\n\n💡 **Tip**: This generates a legally compliant TE9 form that you can download, print, and file at court.`
          autoFillFormData('te9')
          break
      }
    }
    
    return response
  }

  // Generate completed PDF forms with auto-filled data
  const generateCompletedForm = async (formType: 'te7' | 'te9') => {
    try {
      const formData = formType === 'te7' ? te7Data : te9Data
      const appealDataForForm = {
        ...appealData,
        [formType === 'te7' ? 'te7Form' : 'te9Form']: formData
      }

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType,
          formData: appealDataForForm,
          template: `${formType.toUpperCase()}-template.pdf`
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${formType.toUpperCase()}-Form-${appealData.ticketNumber || 'completed'}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        return true
      }
      return false
    } catch (error) {
      console.error(`Error generating ${formType.toUpperCase()} form:`, error)
      return false
    }
  }

  // Show auto-fill preview to user
  const showAutoFillPreview = (formType: 'te7' | 'te9') => {
    const preview = {
      'PCN Reference': appealData.ticketNumber || 'Not provided',
      'Vehicle Registration': appealData.vehicleRegistration || 'Not provided',
      'Incident Location': appealData.location || 'Not provided',
      'Penalty Amount': appealData.fineAmount ? `£${appealData.fineAmount.toFixed(2)}` : 'Not provided',
      'Issue Date': appealData.issueDate ? new Date(appealData.issueDate).toLocaleDateString('en-GB') : 'Not provided',
      'Due Date': appealData.dueDate ? new Date(appealData.dueDate).toLocaleDateString('en-GB') : 'Not provided',
      'Appeal Reason': appealData.reason || 'Not provided',
      'Description': appealData.description ? `${appealData.description.substring(0, 100)}...` : 'Not provided'
    }

    return Object.entries(preview)
      .filter(([key, value]) => value !== 'Not provided')
      .map(([key, value]) => `• ${key}: ${value}`)
      .join('\n')
  }

  const fetchAppeals = async () => {
    try {
      setIsLoadingAppeals(true)
      const data = await api.get("/api/appeals")
      setAppeals(data.appeals || [])
    } catch (error) {
      console.error("Failed to fetch appeals:", error)
    } finally {
      setIsLoadingAppeals(false)
    }
  }

  // Handle vehicle registration popup submission
  const handleVehicleRegSubmit = async () => {
    if (!vehicleRegInput.trim()) return
    
    const cleanReg = vehicleRegInput.replace(/\s+/g, '').toUpperCase()
    if (cleanReg.length < 5) {
      toast.error("Please enter a valid vehicle registration number")
      return
    }
    
    // For now, always proceed - the free trial check will happen when AI prediction is called
    setAppealData({ vehicleRegistration: cleanReg })
    setShowVehicleRegModal(false)
    setVehicleRegInput("")
    setIsCreatingAppeal(true)
    setAppealStep("ticket")
    
    const welcomeMessage: Message = {
      id: messages.length + 1,
      type: "bot",
      content: `🚗 **Vehicle Registration Confirmed: ${cleanReg}**\n\n✅ Starting your AI appeal process!\n\n📋 **Next Step: Your Penalty Reference Number**\n\nI need your penalty/ticket number to identify the type and build your appeal. This could be called:\n\n🎯 **Common Names:**\n• **PCN Number** (Penalty Charge Notice - parking)\n• **FPN Number** (Fixed Penalty Notice - speeding/moving violations)\n• **TEC Number** (Traffic Enforcement Centre - court fines)\n• **NIP Number** (Notice of Intended Prosecution - cameras)\n• **Reference Number** or **Case Number**\n\n🔍 **Where to Find It:**\n• Usually at the TOP of your penalty notice\n• Typically 8-12 characters (letters + numbers)\n• Examples: PCN123456789, FPN987654, TEC2024001234\n\n🤖 **Smart Recognition:** I'll automatically detect your penalty type and show you the correct appeal route!\n\n**Just type your penalty number below:**`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, welcomeMessage])
  }

  const resetConversation = () => {
    setMessages(initialMessages)
    setIsCreatingAppeal(false)
    setAppealStep("ticket")
    setAppealData({})
    setInputValue("")
    setUploadedFiles([])
    setTE7Data({})
    setTE9Data({})
    setSelectedForms([])
    setShowVehicleRegModal(false)
    setVehicleRegInput("")
    
    // Show the vehicle registration popup again after reset
    setTimeout(() => {
      setShowVehicleRegModal(true)
    }, 1000)
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
      // Process the conversation based on current step
      let botResponse = ""
      
      // Handle reset command
      if (userInput.toLowerCase() === "reset" || userInput.toLowerCase() === "restart" || userInput.toLowerCase() === "start over") {
        resetConversation()
        botResponse = "🔄 **Fresh Start - Let's Win This Appeal!**\n\n✅ **Chat has been reset** - all previous information cleared\n\n🚀 **Ready to challenge your penalty?** Here are your quickest options:\n\n**📱 Quick Start Buttons:**\n• Press **1** for Speeding Fines\n• Press **2** for Parking Violations\n• Press **3** for Red Light Cameras\n• Press **4** for Bus Lane Fines\n• Press **5** for Congestion Charges\n• Press **6** for Other Traffic Issues\n\n**📸 Smart Photo Upload:**\n• Click the camera button below to upload your penalty notice\n• I'll automatically extract all the details and build your case\n\n**💬 Just Tell Me:**\n• Describe your situation in your own words\n• I'll guide you through every step to build a winning appeal\n\n**🎯 Goal**: Get your penalty cancelled and save you money!\n\nWhat's the best way for you to get started?"
      } else if (!isCreatingAppeal) {
        // If no vehicle registration provided yet, show popup automatically
        if (!appealData.vehicleRegistration) {
          // Always show the popup when user tries to interact without registration
          setShowVehicleRegModal(true)
          botResponse = "🚗 **Let's Get Started - Vehicle Registration**\n\n**Why do I need this?**\nYour vehicle registration helps me:\n• 🔍 Pull DVLA data to pre-fill your appeal\n• 📊 Check your free AI analysis eligibility\n• 🎯 Provide vehicle-specific legal guidance\n• 📋 Auto-complete official forms (TE7/TE9)\n\n**Your Privacy**: This information is securely processed and not shared with third parties.\n\n✅ **Free Trial**: Each vehicle gets **one complimentary AI success prediction** (normally £15 value)\n\nI've opened a popup for your vehicle registration - please enter it to unlock your personalized appeal assistance!\n\n**Having trouble with the popup?** Just type your vehicle registration here (e.g., AB12 CDE)"
        } else if (userInput.toLowerCase().includes("appeal") || userInput.toLowerCase().includes("fine") || userInput.toLowerCase().includes("ticket") || userInput.toLowerCase().includes("pcn") || userInput.match(/^[A-Z0-9]{8,}$/)) {
          // Vehicle registration already provided, start appeal process
          setIsCreatingAppeal(true)
          setAppealStep("ticket")
          
          // Check if they provided a ticket number in their message
          const ticketMatch = userInput.match(/[A-Z0-9]{8,}/)
          if (ticketMatch) {
            setAppealData(prev => ({ ...prev, ticketNumber: ticketMatch[0] }))
            setAppealStep("amount")
            botResponse = `🎯 **Excellent! I've Found Your Ticket Number: ${ticketMatch[0]}**\n\n✅ **What's next?** I need the fine amount to calculate your potential savings and assess the case strength.\n\n💷 **Please tell me the fine amount:**\n• Look for the amount on your penalty notice\n• It might show both 'early payment' and 'full amount'\n• Just tell me the number - for example: \"£60\" or \"60\" or \"£130\"\n\n💡 **Pro tip**: If you pay early, you usually get a 50% discount. But if I can help you win this appeal, you pay nothing at all! Let's see if we can save you the full amount.`
          } else {
            botResponse = "🎯 **Perfect! Let's Build Your Winning Appeal**\n\n📋 **I need your penalty reference number** - this could be called:\n\n🏷️ **Penalty Charge Notice (PCN)** - Parking fines\n• Format: PCN123456789, LB12345678, TK987654321\n• Issued by: Local councils for parking violations\n\n🚔 **Fixed Penalty Notice (FPN)** - Moving violations\n• Format: FPN123456789, HO1234567, MP12345678\n• Issued by: Police for speeding, traffic lights, etc.\n\n⚖️ **Traffic Enforcement Centre (TEC)** - Court fines\n• Format: TEC1234567890, TE9876543210\n• Issued by: Magistrates court for unpaid penalties\n\n📸 **Speed Camera Notice (NIP)**\n• Format: NIP123456789, SC12345678, CAM987654321\n• Issued by: Police/camera partnerships\n\n🚌 **Other Common Types:**\n• Bus Lane: BL123456789, TFL987654321\n• Congestion Charge: CC123456789, CCN12345678\n• Red Light: RLC123456789, TL12345678\n\n🔍 **Where to find it:** Usually at the TOP of your penalty notice\n\n📸 **Quick tip**: Upload a photo of your penalty notice using the camera button - I'll scan and extract everything automatically!\n\n**Just type your penalty reference number:**"
          }
        } else {
          // Use the expert UK Traffic Law Assistant for general queries
          botResponse = UKTrafficLawAssistant.generateResponse(userInput, {
            appealData,
            messages,
            isCreatingAppeal
          })
        }
      } else {
        // Check for restart command  
        if (userInput.toLowerCase().trim() === "restart") {
          setAppealData({})
          setAppealStep("ticket_type_selection")
          botResponse = `🔄 **Restarting Your Appeal Process**

🎯 **What Type of Ticket Are You Appealing?**

Please select your penalty type:

🅿️ Type **"parking"** - Council/private parking violations
🏎️ Type **"speeding"** - Speed cameras, police stops  
🚌 Type **"bus lane"** - Unauthorized bus lane use
🔴 Type **"traffic light"** - Red light camera violations
💰 Type **"congestion"** - London zone penalties
🚗 Type **"tec"** - Traffic Enforcement Centre penalties
📋 Type **"dvla"** - Tax, insurance, MOT violations
🏢 Type **"private parking"** - Car park operators
⚡ Type **"clean air"** - Low emission zone charges
🛑 Type **"other"** - Any other UK traffic penalty`
        } else {
          // Handle appeal creation steps
          switch (appealStep) {
          case "ticket_type_selection":
            // Handle ticket type selection
            let selectedTypeKey = userInput.toLowerCase().trim()
            
            // Handle different input formats
            if (userInput.includes("parking") || userInput.includes("pcn") || selectedTypeKey === "parking") {
              selectedTypeKey = "pcn"
            } else if (userInput.includes("speeding") || userInput.includes("speed") || userInput.includes("fpn") || selectedTypeKey === "speeding") {
              selectedTypeKey = "fpn"
            } else if (userInput.includes("bus lane") || userInput.includes("bus") || selectedTypeKey === "bus_lane") {
              selectedTypeKey = "bus_lane"
            } else if (userInput.includes("traffic light") || userInput.includes("red light") || selectedTypeKey === "traffic_light") {
              selectedTypeKey = "traffic_light"
            } else if (userInput.includes("congestion") || userInput.includes("ulez") || userInput.includes("lez") || selectedTypeKey === "congestion") {
              selectedTypeKey = "congestion"
            } else if (userInput.includes("tec") || userInput.includes("court") || selectedTypeKey === "tec") {
              selectedTypeKey = "tec"
            } else if (userInput.includes("dvla") || userInput.includes("tax") || userInput.includes("ved") || selectedTypeKey === "dvla") {
              selectedTypeKey = "dvla"
            } else if (userInput.includes("private parking") || userInput.includes("private") || selectedTypeKey === "private_parking") {
              selectedTypeKey = "private_parking"
            } else if (userInput.includes("clean air") || userInput.includes("caz") || selectedTypeKey === "clean_air") {
              selectedTypeKey = "clean_air"
            } else if (userInput.includes("other") || selectedTypeKey === "other") {
              selectedTypeKey = "unknown"
            }
            
            const selectedType = TICKET_TYPES[selectedTypeKey]
            if (selectedType) {
              setAppealData(prev => ({ 
                ...prev, 
                ticketType: selectedType.id,
                category: selectedType.category
              }))
              setAppealStep("ticket")
              
              botResponse = `✅ **${selectedType.name} Selected!**\n\n🎫 **Appeal Type:** ${selectedType.name}\n📋 **Category:** ${selectedType.category}\n🏛️ **Appeals Route:** ${selectedType.authority}\n\n📝 **Enter Your Ticket Number**\n\n${selectedType.description}\n\n🔍 **Expected Format:** ${selectedType.patterns[0].source}\n📝 **Example:** ${selectedType.examples[0]}\n\n**Please enter your ${selectedType.name.toLowerCase()} number:**`
            } else {
              botResponse = `❌ **Please Select a Valid Ticket Type**\n\nI didn't recognize "${userInput}". Please choose from these options:\n\n🅿️ Type **"parking"** - Parking penalties (PCN)\n🏎️ Type **"speeding"** - Speed cameras, police fines\n🚌 Type **"bus lane"** - Bus lane violations\n🔴 Type **"traffic light"** - Red light cameras\n💰 Type **"congestion"** - London zone charges\n🚗 Type **"tec"** - Court enforcement fines\n📋 Type **"dvla"** - DVLA penalties\n🏢 Type **"private parking"** - Private car parks\n⚡ Type **"clean air"** - Low emission zones\n🛑 Type **"other"** - Any other traffic penalty\n\nOr simply type the penalty type name.`
            }
            break

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
              botResponse = `✅ **Ticket Number Confirmed: ${ticketNumber}**\n\n🎯 **Ticket Type: ${selectedTicketType.name}**\n📋 **Category:** ${selectedTicketType.category.charAt(0).toUpperCase() + selectedTicketType.category.slice(1)} penalty\n⚖️ **Appeal Route:** ${guidance.appealRoute}\n📅 **Time Limit:** ${guidance.timeLimit}\n💷 **Typical Range:** £${selectedTicketType.fineRange.min}-£${selectedTicketType.fineRange.max}\n\n🚗 **Next Step:** I need your vehicle registration number (e.g., AB12 CDE)\n\n💡 **Good News:** This penalty type ${selectedTicketType.category === 'civil' ? 'goes to an independent tribunal (free appeals!)' : selectedTicketType.id === 'tec' ? 'can use TE7/TE9 forms for emergency relief' : 'can be challenged in court with proper defense'}`
            } else {
              botResponse = `❌ **Invalid ${selectedTicketType.name} Format**\n\n🔍 **Expected format for ${selectedTicketType.name}:**\n${selectedTicketType.description}\n\n📝 **Examples:**\n${selectedTicketType.examples.map(ex => `• ${ex}`).join('\n')}\n\n🔢 **Please check your penalty notice and enter the correct ticket number**\n\n💡 **Wrong ticket type?** Type "restart" to choose a different penalty type`
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
              
              // Calculate potential savings
              const discountedAmount = amount * 0.5
              const totalSavings = amount
              
              botResponse = `💰 **Perfect! Fine Amount: £${amount.toFixed(2)}**\n\n📊 **Your Potential Savings:**\n• Early payment discount: £${discountedAmount.toFixed(2)} (you still pay £${discountedAmount.toFixed(2)})\n• **Successful appeal: £${totalSavings.toFixed(2)} (you pay nothing!)** ⭐\n\n⏰ **Next: When did this happen?**\nI need the issue date from your penalty notice to check important deadlines.\n\n📅 **Please provide the date the fine was issued:**\n• Format: DD/MM/YYYY (e.g., 15/03/2024)\n• Usually labeled "Date of Notice" or "Issue Date"\n• Found on the front of your penalty notice\n\n🔍 **Why this matters**: The date determines your appeal rights and which legal procedures apply.`
            } else {
              botResponse = "💷 **I need the fine amount to calculate your potential savings!**\n\n📋 Please tell me the amount from your penalty notice:\n• Just the number is fine: \"60\" or \"130\"\n• Or with the £ symbol: \"£60.00\" or \"£130\"\n• If there are two amounts shown, give me the higher 'full amount'\n\n🔍 **Where to look**: Usually shown clearly on the front of your penalty notice under \"Amount Due\" or \"Penalty Amount\"."
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
              botResponse = `Due date recorded as ${day}/${month}/${year}.\n\nWhere did this incident occur? Please provide the location (e.g., "High Street Car Park, Birmingham" or "Outside 123 Main Road, London").`
            } else {
              botResponse = "Please provide the due date in DD/MM/YYYY format (e.g., 28/03/2024)."
            }
            break

          case "location":
            if (userInput.length >= 5) {
              setAppealData(prev => ({ ...prev, location: userInput }))
              setAppealStep("reason")
              botResponse = `📍 **Location Recorded: ${userInput}**\n\n🎯 **Now for the crucial part - your appeal reason!**\n\nThis determines your legal strategy and success probability. Choose the reason that best matches your situation:\n\n**1️⃣ Invalid signage** 🚫\n   • Signs unclear, missing, or poorly positioned\n   • Contradictory or confusing parking signs\n   • Success rate: Usually High\n\n**2️⃣ Permit displayed** 🎫\n   • Valid parking permit/ticket was displayed\n   • Resident's permit or visitor permit shown\n   • Success rate: Usually High\n\n**3️⃣ Medical emergency** 🏥\n   • Emergency situation requiring immediate parking\n   • Medical assistance needed urgently\n   • Success rate: High with evidence\n\n**4️⃣ Vehicle breakdown** 🔧\n   • Car broke down and couldn't be moved\n   • Mechanical failure or accident\n   • Success rate: High with evidence\n\n**5️⃣ Loading/unloading** 📦\n   • Legally loading/unloading items\n   • Brief stop for permitted activity\n   • Success rate: Medium to High\n\n**6️⃣ Payment system error** 💳\n   • Machine broken, no change, or system fault\n   • Unable to pay despite trying\n   • Success rate: High with evidence\n\n**7️⃣ Other reason** 📝\n   • Different circumstances (please specify)\n   • Custom legal argument needed\n\n**Type 1-7 or describe your specific situation!**`
            } else {
              botResponse = "🏠 **I need a more specific location to build your case**\n\n📍 Please provide details like:\n• Street name and area (e.g., \"High Street, Birmingham\")\n• Car park name (e.g., \"Tesco Car Park, Manchester\")\n• Specific address or nearby landmarks\n\n**Why location matters**: Different councils have different rules, and I need to check the local parking regulations that apply to your case."
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
            
            // Provide immediate legal analysis using expert system
            const partialAppealData = {
              ticketNumber: appealData.ticketNumber,
              fineAmount: appealData.fineAmount,
              issueDate: appealData.issueDate,
              dueDate: appealData.dueDate,
              location: appealData.location,
              reason: reason,
              description: '',
              circumstances: '',
              evidence: []
            }
            
            const legalAnalysis = UKTrafficLawAssistant.analyzeLegalGrounds(partialAppealData)
            const strengthAssessment = legalAnalysis.successLikelihood === 'HIGH' ? '🟢 **Strong legal grounds**' : 
                                      legalAnalysis.successLikelihood === 'MEDIUM' ? '🟡 **Moderate grounds**' : 
                                      '🔴 **Challenging case**'
            
            setAppealStep("description")
            botResponse = `✅ **Appeal Reason: ${reason}**\n\n⚖️ **AI Legal Analysis**: ${strengthAssessment}\n\n${legalAnalysis.strongGrounds.length > 0 ? 
              `🔥 **Strong Legal Grounds Identified:**\n${legalAnalysis.strongGrounds.map(g => `• ${g}`).join('\n')}\n\n` : ''}${legalAnalysis.recommendations.length > 0 ? 
              `💡 **Strategic Recommendations:**\n${legalAnalysis.recommendations.slice(0, 3).map(r => `• ${r}`).join('\n')}\n\n` : ''}📝 **Final Step: Your Appeal Description**\n\nThis is where we build your winning argument! You have two powerful options:\n\n🤖 **1. AI Professional Writer** (Recommended)\n   • Type **"generate"** and I'll craft a legally-optimized description\n   • Uses UK traffic law precedents and winning arguments\n   • Incorporates your specific circumstances and evidence\n   • Professional tone that appeals panels respect\n\n✍️ **2. Write It Yourself**\n   • Provide your own detailed description\n   • Include specific timeline and circumstances\n   • Explain why the penalty should be cancelled\n   • I'll review and suggest improvements\n\n🎯 **For custom descriptions, include:**\n• **Timeline**: What you were doing and when\n• **Circumstances**: Why you parked there specifically\n• **Evidence**: What supports your case\n• **Impact**: Why this penalty is unfair\n\n**Most successful appeals use AI-generated descriptions because they include proven legal arguments and professional language that gets results.**\n\nWhat's your choice? Type **"generate"** for AI help or write your own description!\n\n**Legal Disclaimer:** This is AI-generated guidance for information only, not formal legal advice.`
            break

          case "description":
            if (userInput.toLowerCase().includes("generate") || userInput.toLowerCase().includes("write") || userInput.toLowerCase().includes("auto")) {
              // Generate AI description using expert system
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
              const generatedDescription = UKTrafficLawAssistant.generateAppealDescription(appealCaseData)
              setAppealData(prev => ({ ...prev, description: generatedDescription }))
              
              // Route based on ticket type
              const ticketType = TICKET_TYPES[appealData.ticketType || 'unknown']
              const guidance = getAppealGuidance(ticketType)
              
              if (ticketType.id === 'tec') {
                setAppealStep("form_selection")
                botResponse = `🏆 **AI Professional Appeal Description Generated!**\n\n📋 **Your Customized Appeal:**\n"${generatedDescription.substring(0, 250)}..."\n\n⚖️ **TEC Case - Official Court Forms Available**\n\nSince this is a **Traffic Enforcement Centre** case, you can strengthen your position with official legal forms:\n\n📋 **TE9 Form (Statutory Declaration)**\n• Challenges enforcement on strict legal grounds\n• Common grounds: Did not receive notices, not the driver, no response to representations\n\n📋 **TE7 Form (Appeal Against Conviction)**\n• Appeals the underlying conviction or evidence\n• Required for post-deadline submissions\n\n🎯 **Your Options:**\n• **"te9"** - File statutory declaration\n• **"te7"** - File appeal against conviction\n• **"both"** - File comprehensive legal challenge\n• **"skip"** - Proceed with appeal letter only\n\nWhat's your choice?`
              } else {
                setAppealStep("evidence")
                botResponse = `🏆 **AI Professional Appeal Description Generated!**\n\n📋 **Your Customized Appeal:**\n"${generatedDescription.substring(0, 250)}..."\n\n🎯 **Appeal Route for ${ticketType.name}:**\n📋 **Route:** ${guidance.appealRoute}\n⏰ **Deadline:** ${guidance.timeLimit}\n💰 **Cost:** ${guidance.costImplications}\n\n📁 **Supporting Evidence**\n\nWould you like to upload supporting documents to strengthen your case? Click 📎 to upload or type 'continue' to proceed.`
              }
              
            } else if (userInput.length >= 20) {
              setAppealData(prev => ({ ...prev, description: userInput }))
              
              // Generate AI prediction for the appeal
              const currentAppealData = {
                ...appealData,
                description: userInput
              }
              
              // Route based on ticket type
              const ticketType = TICKET_TYPES[appealData.ticketType || 'unknown']
              
              if (ticketType.id === 'tec') {
                setAppealStep("form_selection")
                botResponse = `✅ **Your Custom Description Recorded!**\n\n📝 **Description:** "${userInput.substring(0, 150)}..."\n\n⚖️ **TEC Case - Form Selection**\n\nSince this is a Traffic Enforcement Centre case, you have access to powerful legal forms:\n\n📋 **Available Forms:**\n• **"te9"** - Statutory declaration\n• **"te7"** - Appeal against conviction\n• **"assess"** - Let me analyze which forms suit your case\n• **"skip"** - Continue with appeal letter only\n\nWhat's your choice?`
              } else {
                const guidance = getAppealGuidance(ticketType)
                setAppealStep("evidence")
                botResponse = `✅ **Your Custom Description Recorded!**\n\n📝 **Description:** "${userInput.substring(0, 150)}..."\n\n🎯 **Appeal Route for ${ticketType.name}:**\n📋 **Route:** ${guidance.appealRoute}\n⏰ **Deadline:** ${guidance.timeLimit}\n💰 **Cost:** ${guidance.costImplications}\n\n📁 **Supporting Evidence**\n\nWould you like to upload supporting documents to strengthen your case? Click 📎 to upload or type 'continue' to proceed.`
              }
            }
            break

          case "form_selection":
            const formChoice = userInput.toLowerCase()
            let selectedFormsList: string[] = []
            
            if (formChoice.includes("te7") || formChoice.includes("both")) selectedFormsList.push("te7")
            if (formChoice.includes("te9") || formChoice.includes("both")) selectedFormsList.push("te9")
            
            setSelectedForms(selectedFormsList)
            
            if (formChoice.includes("skip") || formChoice.includes("none")) {
              setAppealStep("evidence")
              botResponse = `No problem! Continuing without additional legal forms.\n\n**Disclaimer**: This is general guidance and not a substitute for advice from a qualified solicitor.\n\nNow, would you like to upload any supporting documents or evidence? This could include:\n\n📄 **Photos** of your parking permit, signs, or vehicle position\n📄 **Receipts** or proof of payment\n📄 **Medical certificates** (if applicable)\n📄 **Correspondence** with parking authorities\n📄 **Any other relevant documents**\n\nYou can:\n• Click the 📎 attachment button to upload files\n• Type 'skip' if you don't have any documents to upload\n• Type 'continue' when you're done uploading`
            } else if (formChoice.includes("help") || formChoice.includes("assess") || formChoice.includes("which")) {
              botResponse = `⚖️ **Legal Forms Assessment Help**\n\n**Disclaimer**: This is general guidance and not a substitute for advice from a qualified solicitor.\n\nTo determine which forms you need, please answer:\n\n**1. Did you receive the original Penalty Charge Notice (PCN)?**\n   • If NO → You likely need TE9 (did not receive notice)\n\n**2. Did you receive the Notice to Owner?**\n   • If NO → You likely need TE9 (did not receive notice)\n\n**3. Did you make representations to the council?**\n   • If YES and no response → You likely need TE9 (no response to representations)\n\n**4. Are you filing after the statutory deadline?**\n   • If YES → You need BOTH TE7 and TE9\n   • If NO → You need TE9 only\n\n**5. Were you the driver at the time?**\n   • If NO → You likely need TE9 (was not driver)\n\nBased on your situation, please type:\n• **"te9"** - For statutory declaration only\n• **"te7"** - For both TE7 and TE9 (late filing)\n• **"assess"** - Let me determine the best forms for your case\n• **"skip"** - Proceed with appeal letter only`
            } else if (selectedFormsList.length > 0) {
              const firstForm = selectedFormsList[0]
              setAppealStep(firstForm === "te7" ? "te7_form" : "te9_form")
              
              if (firstForm === "te7") {
                botResponse = handleFormStepWithAutoFill('te7', 'start', '')
              } else {
                botResponse = handleFormStepWithAutoFill('te9', 'start', '')
              }
            } else {
              botResponse = `⚖️ **Legal Forms Assessment**\n\nBased on your case, I recommend:\n\n**Choose your situation**:\n• **"te7"** - If you need to file after the deadline (requires TE7 + TE9)\n• **"te9"** - If filing within deadline (TE9 only)\n• **"both"** - If you need both forms\n• **"help"** - For guidance on which forms apply to your case\n• **"skip"** - To continue without legal forms\n\n**Note**: Most penalty challenges require a TE9. A TE7 is only needed if filing after the statutory deadline.`
            }
            break

          case "evidence":
            if (userInput.toLowerCase().includes("skip") || userInput.toLowerCase().includes("continue") || userInput.toLowerCase().includes("done") || userInput.toLowerCase().includes("submit")) {
              setAppealStep("complete")
              
              // Build forms summary
              let formsText = ""
              if (selectedForms.length > 0) {
                formsText = `\n**Forms included:**`
                if (selectedForms.includes("te7")) {
                  formsText += `\n• TE7 Witness Statement (Witness: ${te7Data.witnessName})`
                }
                if (selectedForms.includes("te9")) {
                  formsText += `\n• TE9 Statutory Declaration (${te9Data.declarationType?.replace("_", " ")})`
                }
              }
              
              // Show summary and submit
              const summary = `Perfect! Here's a summary of your appeal:\n\n**Ticket Number:** ${appealData.ticketNumber}\n**Amount:** £${appealData.fineAmount?.toFixed(2)}\n**Issue Date:** ${new Date(appealData.issueDate!).toLocaleDateString()}\n**Due Date:** ${new Date(appealData.dueDate!).toLocaleDateString()}\n**Location:** ${appealData.location}\n**Reason:** ${appealData.reason}\n**Description:** ${appealData.description}\n**Evidence:** ${uploadedFiles.length} file(s) uploaded${formsText}\n\nI'll now submit your appeal. Please wait a moment...`
              
              botResponse = summary
              
              // Submit the appeal after showing summary
              setTimeout(async () => {
                await submitAppeal({
                  ...appealData,
                  description: appealData.description!,
                  evidence: uploadedFiles.map(f => f.url),
                  te7Form: selectedForms.includes("te7") ? te7Data as TE7FormData : undefined,
                  te9Form: selectedForms.includes("te9") ? te9Data as TE9FormData : undefined,
                  selectedForms: selectedForms.length > 0 ? selectedForms : undefined
                } as AppealData)
              }, 2000)
              
            } else {
              botResponse = "You can upload documents using the 📎 attachment button below, or type 'continue' to proceed without uploading files, or 'skip' if you don't have any evidence to upload."
            }
            break

          case "te7_form":
            // Enhanced TE7 Application with smart auto-fill
            if (!te7Data.witnessName) {
              setTE7Data(prev => ({ 
                ...prev, 
                witnessName: userInput,
                // Auto-fill additional fields from appeal data
                relationshipToDriver: appealData.vehicleRegistration || prev.relationshipToDriver || '',
                statementDate: new Date().toISOString().split('T')[0]
              }))
              botResponse = `✅ **Name Recorded: ${userInput}**\n\n🤖 **Auto-filled from your appeal:**\n• Vehicle Registration: ${appealData.vehicleRegistration || 'From appeal data'}\n• Filing Date: ${new Date().toLocaleDateString('en-GB')}\n• PCN Reference: ${appealData.ticketNumber || 'From appeal data'}\n\n📝 **Step 2**: What is your full address (including postcode)?\n\n💡 This should be your current residential address for legal correspondence.`
            } else if (!te7Data.witnessAddress) {
              setTE7Data(prev => ({ ...prev, witnessAddress: userInput }))
              botResponse = `✅ **Address Recorded**\n\n📝 **Step 3**: What is your phone number?\n\n📞 This will be used if the court needs to contact you about your TE7 application.`
            } else if (!te7Data.witnessPhone) {
              setTE7Data(prev => ({ ...prev, witnessPhone: userInput }))
              botResponse = `✅ **Phone Number Recorded**\n\n📝 **Step 4**: What is your email address?\n\n📧 Important for receiving court correspondence and updates about your case.`
            } else if (!te7Data.witnessEmail) {
              setTE7Data(prev => ({ ...prev, witnessEmail: userInput }))
              botResponse = `✅ **Contact Details Complete**\n\n📋 **Already auto-filled:**\n• PCN Reference: ${appealData.ticketNumber}\n• Vehicle Registration: ${appealData.vehicleRegistration}\n• Application Date: ${new Date().toLocaleDateString('en-GB')}\n\n📝 **Step 5 - Critical Legal Requirement**:\n\n⚖️ **Why are you filing this TE9 statutory declaration late?**\n\nThis is the most important part - you must provide a valid legal reason for the delay. Choose the option that best fits your situation:\n\n**Common Valid Reasons:**\n🏠 **"Postal Issues"** - Did not receive notices at your address\n🏥 **"Medical Emergency"** - Incapacity prevented timely filing\n✈️ **"Away from Address"** - Traveling or temporarily relocated\n📮 **"Service Failure"** - Council failed to serve notices properly\n🏢 **"Administrative Error"** - Council or DVLA administrative mistake\n\nPlease provide a detailed explanation of your specific circumstances and why you could not file within the statutory 28-day timeframe.`
            } else if (!te7Data.witnessStatement) {
              setTE7Data(prev => ({ 
                ...prev, 
                witnessStatement: userInput, 
                statementDate: new Date().toISOString().split('T')[0] 
              }))
              
              // Generate professional TE7 statement using expert system
              const appealCaseData = {
                ticketNumber: appealData.ticketNumber,
                fineAmount: appealData.fineAmount,
                issueDate: appealData.issueDate,
                dueDate: appealData.dueDate,
                location: appealData.location,
                reason: appealData.reason,
                description: userInput,
                circumstances: userInput,
                evidence: uploadedFiles.map(f => f.url)
              }
              const professionalStatement = UKTrafficLawAssistant.generateTE7Form(appealCaseData, te7Data)
              setTE7Data(prev => ({ ...prev, witnessStatement: professionalStatement }))
              
              // Check if we need to fill TE9 next
              const remainingForms = selectedForms.filter(form => form !== "te7")
              if (remainingForms.includes("te9")) {
                setAppealStep("te9_form")
                // Generate auto-filled PDF and prepare download
                try {
                  const formData = {
                    ...appealData,
                    te7Data: { ...te7Data, witnessStatement: professionalStatement },
                    professionalStatement
                  }
                  const response = await fetch('/api/generate-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ formType: 'TE7', formData })
                  })
                  
                  if (response.ok) {
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `TE7_Form_${appealData.vehicleRegistration || appealData.ticketNumber || 'Appeal'}_${new Date().toISOString().split('T')[0]}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    window.URL.revokeObjectURL(url)
                    
                    botResponse = `✅ **TE7 Application completed!**\n\n**Generated Legal Document**:\n"${professionalStatement.substring(0, 200)}..."\n\n📋 **Auto-filled PDF downloaded successfully**\n\n**Next**: Let's complete your **TE9 Statutory Declaration**.\n\n**Disclaimer**: This is general guidance and not a substitute for advice from a qualified solicitor.\n\n**Step 1**: Please confirm your full legal name for the TE9 declaration:`
                  } else {
                    botResponse = `✅ **TE7 Application completed!**\n\n**Generated Legal Document**:\n"${professionalStatement.substring(0, 200)}..."\n\n**Next**: Let's complete your **TE9 Statutory Declaration**.\n\n**Disclaimer**: This is general guidance and not a substitute for advice from a qualified solicitor.\n\n**Step 1**: Please confirm your full legal name for the TE9 declaration:`
                  }
                } catch (error) {
                  botResponse = `✅ **TE7 Application completed!**\n\n**Generated Legal Document**:\n"${professionalStatement.substring(0, 200)}..."\n\n**Next**: Let's complete your **TE9 Statutory Declaration**.\n\n**Disclaimer**: This is general guidance and not a substitute for advice from a qualified solicitor.\n\n**Step 1**: Please confirm your full legal name for the TE9 declaration:`
                }
              } else {
                setAppealStep("evidence")
                botResponse = `✅ **TE7 Application completed!**\n\n**Generated Legal Document**:\n"${professionalStatement.substring(0, 200)}..."\n\n**Submission**: This form must be filed at Traffic Enforcement Centre, Northampton.\n\n**Next**: Upload supporting evidence or type 'continue' to proceed.`
              }
            }
            break

          case "te9_form":
            // Enhanced TE9 Statutory Declaration with smart auto-fill
            if (!te9Data.declarantName) {
              setTE9Data(prev => ({ 
                ...prev, 
                declarantName: userInput,
                // Auto-fill from appeal data
                declarationDate: new Date().toISOString().split('T')[0]
              }))
              botResponse = `✅ **Declarant Name: ${userInput}**\n\n🤖 **Auto-filled from your appeal:**\n• PCN Reference: ${appealData.ticketNumber || 'From appeal data'}\n• Vehicle Registration: ${appealData.vehicleRegistration || 'From appeal data'}\n• Incident Date: ${appealData.issueDate ? new Date(appealData.issueDate).toLocaleDateString('en-GB') : 'From appeal data'}\n• Declaration Date: ${new Date().toLocaleDateString('en-GB')}\n\n📝 **Step 2**: What is your full address (including postcode)?\n\n🏠 This must be your current residential address for legal service.`
            } else if (!te9Data.declarantAddress) {
              setTE9Data(prev => ({ ...prev, declarantAddress: userInput }))
              botResponse = `✅ **Address Recorded**\n\n📝 **Step 3**: What is your phone number?\n\n📞 Required for court correspondence about your statutory declaration.`
            } else if (!te9Data.declarantPhone) {
              setTE9Data(prev => ({ ...prev, declarantPhone: userInput }))
              botResponse = `✅ **Phone Number Recorded**\n\n📝 **Step 4**: What is your email address?\n\n📧 Important for receiving official court communications and case updates.`
            } else if (!te9Data.declarantEmail) {
              setTE9Data(prev => ({ ...prev, declarantEmail: userInput }))
              botResponse = `✅ **Contact Information Complete**\n\n📋 **Summary of Auto-filled Data:**\n• PCN Reference: ${appealData.ticketNumber}\n• Vehicle Registration: ${appealData.vehicleRegistration}\n• Incident Location: ${appealData.location}\n• Penalty Amount: £${appealData.fineAmount?.toFixed(2)}\n• Declaration Date: ${new Date().toLocaleDateString('en-GB')}\n\n📝 **Step 5 - Legal Grounds Selection**:\n\n⚖️ **What is the legal basis for your statutory declaration?**\n\nSelect the ground that best matches your situation:\n\n**1️⃣ Did not receive Notice to Owner** 📪\n   • The statutory notice was never properly served\n   • Postal issues prevented delivery\n   • Success Rate: Very High with evidence\n\n**2️⃣ Made representations but no response** 📝\n   • You submitted formal representations to the council\n   • No reply received within statutory 56-day period\n   • Success Rate: Very High (statutory breach)\n\n**3️⃣ Filed appeal but no response** ⚖️\n   • You appealed to adjudicator but got no response\n   • Breach of statutory response obligations\n   • Success Rate: Very High\n\n**4️⃣ Was not the driver/keeper** 🚫\n   • Vehicle was sold, stolen, or you weren't driving\n   • Mistaken identity or ownership issues\n   • Success Rate: High with proof\n\n**Type 1, 2, 3, or 4 to select your legal ground.**`
            } else if (!te9Data.declarationType) {
              let declarationType: "not_driver" | "not_received" | "other" = "other"
              let nextPrompt = ""
              
              if (userInput === "1") {
                declarationType = "not_received"
                nextPrompt = `✅ **Legal Ground Selected: Did not receive Notice to Owner**\n\n⚖️ **This is a strong legal ground with high success rates!**\n\n📝 **Step 6**: Please provide detailed circumstances:\n\n**Include these details:**\n• When did you first become aware of this penalty?\n• What is your normal postal address and arrangements?\n• Any factors that prevented proper service (e.g., moved house, postal issues)?\n• Have you checked with Royal Mail or your local sorting office?\n• Any evidence of postal problems in your area?\n\n**Example response:**\n"I first became aware of this penalty on [date] when I received the charge certificate. I have lived at [address] since [date] and regularly receive mail. I did not receive the original PCN or Notice to Owner. I have checked with Royal Mail and there were no delivery issues reported for my address during the relevant period."\n\n**Provide your detailed statement:**`
              } else if (userInput === "2") {
                declarationType = "not_received"
                nextPrompt = `**Legal Ground**: Made representations but no response\n\n**Step 7**: Please provide details. When did you submit your representations? What was the nature of your representations? Confirm that you received no response within the statutory timeframe (56 days).`
              } else if (userInput === "3") {
                declarationType = "other" // Appeal case
                nextPrompt = `**Legal Ground**: Filed appeal but no response\n\n**Step 7**: Please provide details. When did you file your appeal with the adjudicator? What was the case reference? Confirm that you received no response within the statutory timeframe.`
              } else if (userInput === "4") {
                declarationType = "not_driver"
                nextPrompt = `**Legal Ground**: Was not the driver/keeper\n\n**Step 7**: Please provide details. Were you the registered keeper at the time? If yes, who was the driver? If no, provide details of when you sold/transferred the vehicle and to whom.`
              } else {
                botResponse = "Please select 1, 2, 3, or 4 for the legal ground of your declaration."
                break
              }
              
              setTE9Data(prev => ({ ...prev, declarationType }))
              botResponse = nextPrompt
            } else {
              // Final statement completion using expert system
              const appealCaseData = {
                ticketNumber: appealData.ticketNumber,
                fineAmount: appealData.fineAmount,
                issueDate: appealData.issueDate,
                dueDate: appealData.dueDate,
                location: appealData.location,
                reason: appealData.reason,
                description: appealData.description,
                circumstances: userInput,
                evidence: uploadedFiles.map(f => f.url)
              }
              const professionalStatement = UKTrafficLawAssistant.generateTE9Form(appealCaseData, te9Data, te9Data.declarationType!, userInput)
              setTE9Data(prev => ({ 
                ...prev, 
                declarationStatement: professionalStatement,
                declarationDate: new Date().toISOString().split('T')[0]
              }))
              
              // Generate auto-filled TE9 PDF
              try {
                const formData = {
                  ...appealData,
                  te9Data: { ...te9Data, declarationStatement: professionalStatement, declarationDate: new Date().toISOString().split('T')[0] },
                  professionalStatement
                }
                const response = await fetch('/api/generate-pdf', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ formType: 'TE9', formData })
                })
                
                if (response.ok) {
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `TE9_Form_${appealData.vehicleRegistration || appealData.ticketNumber || 'Appeal'}_${new Date().toISOString().split('T')[0]}.pdf`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  window.URL.revokeObjectURL(url)
                }
              } catch (error) {
                console.error('PDF generation failed:', error)
              }
              
              setAppealStep("evidence")
              botResponse = `✅ **TE9 Statutory Declaration completed!**\n\n**Generated Legal Document**:\n"${professionalStatement.substring(0, 200)}..."\n\n📋 **Auto-filled PDF downloaded successfully**\n\n**Important**: This statutory declaration must be:\n• Signed in the presence of a solicitor, commissioner for oaths, or magistrate\n• Filed at Traffic Enforcement Centre, Northampton County Court\n• Submitted with appropriate fee (if applicable)\n\n**Disclaimer**: This is general guidance and not a substitute for advice from a qualified solicitor.\n\n**Next**: Upload supporting evidence or type 'continue' to proceed.`
            }
            break

          default:
            botResponse = "I'm not sure how to help with that. Would you like to start a new appeal?"
            setIsCreatingAppeal(false)
            setAppealStep("ticket")
            setAppealData({})
            break
        }
      }

      // Add bot response
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
        content: "I'm sorry, there was an error processing your message. Please try again, or type 'reset' to start over.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }


  // File upload functions
  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return

    setIsUploading(true)
    const newFiles: UploadedFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        continue
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} is not a supported format. Please upload images, PDFs, or documents.`)
        continue
      }

      try {
        // Create a mock upload (in a real app, you'd upload to cloud storage)
        const fileUrl = URL.createObjectURL(file)
        
        const uploadedFile: UploadedFile = {
          id: `${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl,
          uploadedAt: new Date()
        }

        newFiles.push(uploadedFile)
        
        // In a real application, you would upload to cloud storage here
        // const uploadResponse = await api.post('/api/upload', formData)
        
      } catch (error) {
        console.error('File upload error:', error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles])
    setIsUploading(false)

    if (newFiles.length > 0) {
      toast.success(`Successfully uploaded ${newFiles.length} file(s)`)
      
      // Try to analyze the first document for auto-fill if we're creating an appeal
      if (isCreatingAppeal && newFiles.length > 0) {
        const firstDocument = newFiles[0]
        if (firstDocument.type.startsWith('image/') || firstDocument.type === 'application/pdf') {
          // Analyze the document for auto-fill
          await analyzeDocumentForAutoFill(firstDocument)
        }
      }
      
      // Add a bot message about the uploaded files
      const botMessage: Message = {
        id: messages.length + 1,
        type: "bot",
        content: `Great! I've received ${newFiles.length} file(s): ${newFiles.map(f => f.name).join(', ')}. These will be included as evidence with your appeal.${isCreatingAppeal ? "\n\n🤖 I'm analyzing your document to see if I can automatically fill in some appeal information for you..." : ""}\n\n${isCreatingAppeal && appealStep === "evidence" ? "You can upload more files if needed, or type 'continue' to proceed with submitting your appeal." : ""}`,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, botMessage])
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    toast.success("File removed")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const parseEvidence = (evidence: string | string[] | null): string[] => {
    if (!evidence) return []
    if (Array.isArray(evidence)) return evidence
    try {
      return JSON.parse(evidence) || []
    } catch {
      return []
    }
  }

  // Document scanning functions
  const startDocumentScan = async () => {
    try {
      setIsScanning(true)
      setShowScanModal(true)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera for document scanning
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Unable to access camera. Please check permissions or use file upload instead.')
      setIsScanning(false)
      setShowScanModal(false)
    }
  }

  const captureDocument = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return

      // Create a file-like object from the blob
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `scanned-document-${timestamp}.jpg`

      // Create uploaded file object
      const scannedFile: UploadedFile = {
        id: `scan-${Date.now()}`,
        name: fileName,
        size: blob.size,
        type: 'image/jpeg',
        url: URL.createObjectURL(blob),
        uploadedAt: new Date()
      }

      setUploadedFiles(prev => [...prev, scannedFile])
      
      // Stop scanning
      stopScanning()
      
      toast.success('Document scanned successfully!')
      
      // Try to analyze the scanned document for auto-fill if we're creating an appeal
      if (isCreatingAppeal) {
        analyzeDocumentForAutoFill(scannedFile)
      }
      
      // Add bot message about scanned document
      const botMessage: Message = {
        id: messages.length + 1,
        type: "bot",
        content: `Great! I've captured your document scan: "${fileName}". The scanned document will be included as evidence with your appeal.${isCreatingAppeal ? " 🤖 I'm analyzing the scan to see if I can automatically fill in some appeal information for you..." : ""} You can scan more documents or continue with your appeal.`,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, botMessage])
      
    }, 'image/jpeg', 0.9)
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    setIsScanning(false)
    setShowScanModal(false)
  }

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const submitAppeal = async (data: AppealData) => {
    try {
      // Check if user has access first
      const vehicleReg = data.vehicleRegistration || vehicleRegInput
      if (!vehicleReg) {
        toast.error("Vehicle registration is required for appeals")
        return
      }

      try {
        const accessResponse = await fetch('/api/user/usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service: 'appeal',
            data: { registration: vehicleReg.toUpperCase() }
          }),
        })

        if (!accessResponse.ok) {
          const accessData = await accessResponse.json()
          if (accessData.error === 'Payment required') {
            setPendingAppealData(data)
            setShowPaymentModal(true)
            return
          } else if (accessData.error === 'Trial already used') {
            setPendingAppealData(data)
            setShowPaymentModal(true)
            return
          } else {
            throw new Error(accessData.error || 'Access check failed')
          }
        }

        // Check if access was denied
        const accessData = await accessResponse.json()
        if (accessData.access === 'denied' && accessData.reason === 'payment_required') {
          setPendingAppealData(data)
          setShowPaymentModal(true)
          return
        }
      } catch (error) {
        console.error('Error checking access:', error)
        toast.error("Access check failed. Please try again or contact support")
        return
      }

      // Generate professional appeal letter using expert system
      const appealCaseData = {
        ticketNumber: data.ticketNumber,
        fineAmount: data.fineAmount,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        location: data.location,
        reason: data.reason,
        description: data.description,
        circumstances: data.description,
        evidence: data.evidence || []
      }
      
      const appealLetter = UKTrafficLawAssistant.generateAppealLetter(appealCaseData)
      
      // Include form data and generated appeal letter if available
      const submissionData = {
        ...data,
        appealLetter: appealLetter,
        te7Form: selectedForms.includes("te7") ? te7Data : undefined,
        te9Form: selectedForms.includes("te9") ? te9Data : undefined,
        selectedForms: selectedForms.length > 0 ? selectedForms : undefined
      }
      
      await api.post("/api/appeals", submissionData)
      
      const formsText = selectedForms.length > 0 ? `\n\n📋 **Forms included**: ${selectedForms.map(f => f.toUpperCase()).join(", ")}` : ""
      
      const successMessage: Message = {
        id: messages.length + 3,
        type: "bot",
        content: `🎉 **Appeal submitted successfully!**\n\nYour professional appeal letter and forms have been generated and submitted. You should receive a reference number via email shortly. You can track the progress of your appeal in the 'My Appeals' tab.${formsText}\n\n📄 **Professional appeal letter generated** with proper legal framework and references.\n\nIs there anything else I can help you with?\n\n**Disclaimer:** This information is generated by AI and is for guidance only. It does not constitute formal legal advice.`,
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, successMessage])
      
      // Reset appeal creation state
      setIsCreatingAppeal(false)
      setAppealStep("ticket")
      setAppealData({})
      setTE7Data({})
      setTE9Data({})
      setSelectedForms([])
      
      // Refresh appeals list
      await fetchAppeals()
      
      // Show success toast
      toast.success("Appeal submitted successfully!")
      
    } catch (error) {
      console.error("Failed to submit appeal:", error)
      const errorMessage: Message = {
        id: messages.length + 3,
        type: "bot",
        content: "❌ I'm sorry, there was an error submitting your appeal. Please try again or contact support if the problem persists.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      
      toast.error("Failed to submit appeal. Please try again.")
    }
  }

  // PDF generation function
  const generatePDFDocuments = async () => {
    if (!appealData.ticketNumber || !te7Data.witnessName || !te9Data.declarantName) {
      toast.error("Please complete all form data before generating PDFs")
      return
    }

    setIsGeneratingPDF(true)

    try {
      // Prepare data for PDF generation
      const pdfData = {
        full_name: te7Data.witnessName || te9Data.declarantName,
        address: te7Data.witnessAddress || te9Data.declarantAddress,
        dob: te7Data.witnessPhone || te9Data.declarantPhone, // This should be DOB field
        pcn_number: appealData.ticketNumber,
        vehicle_registration: te7Data.relationshipToDriver, // This should be vehicle reg field
        email: te7Data.witnessEmail || te9Data.declarantEmail,
        te9: {
          ground_selected: getTE9GroundText(te9Data.declarationType),
          statement: te9Data.declarationStatement || "Statement as provided in form"
        },
        te7: {
          reason_for_delay: te7Data.witnessStatement || "Reason as provided in form"
        }
      }

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pdfData),
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedPDFs({
          te7: result.downloadLinks?.te7,
          te9: result.downloadLinks?.te9
        })
        setShowPDFModal(true)
        toast.success("PDF documents generated successfully!")

        // Add bot message about PDF generation
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `🎉 **PDF Documents Generated Successfully!**\n\n📄 Your professional TE7 and TE9 legal documents are ready for download.\n\n**Next Steps**:\n1. Download the PDF forms\n2. Review all information carefully\n3. Get them signed by a qualified solicitor, commissioner for oaths, or magistrate\n4. Submit to Traffic Enforcement Centre, Northampton\n\n**Important**: These are fillable PDF forms that you can complete and print for official submission.`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMessage])

      } else {
        toast.error(`PDF generation failed: ${result.details?.join(", ") || result.error}`)
      }

    } catch (error) {
      console.error("PDF generation error:", error)
      toast.error("Failed to generate PDF documents. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Email submission function
  const submitToTEC = async () => {
    if (!generatedPDFs.te7 && !generatedPDFs.te9) {
      toast.error("Please generate PDF forms before submitting to TEC")
      return
    }

    if (!te7Data.witnessEmail && !te9Data.declarantEmail) {
      toast.error("Email address is required for submission confirmation")
      return
    }

    const confirmSubmission = window.confirm(
      "This will automatically submit your TE7 and TE9 forms to the Traffic Enforcement Centre via email. " +
      "Are you sure you want to proceed with the official submission?"
    )

    if (!confirmSubmission) return

    setIsGeneratingPDF(true) // Reuse loading state

    try {
      // Prepare submission data
      const submissionData = {
        full_name: te7Data.witnessName || te9Data.declarantName,
        address: te7Data.witnessAddress || te9Data.declarantAddress,
        dob: te7Data.witnessPhone || te9Data.declarantPhone, // This should be DOB field
        pcn_number: appealData.ticketNumber,
        vehicle_registration: te7Data.relationshipToDriver, // This should be vehicle reg field
        email: te7Data.witnessEmail || te9Data.declarantEmail,
        te9: {
          ground_selected: getTE9GroundText(te9Data.declarationType),
          statement: te9Data.declarationStatement || "Statement as provided in form"
        },
        te7: {
          reason_for_delay: te7Data.witnessStatement || "Reason as provided in form"
        },
        te7_path: generatedPDFs.te7 ? generatedPDFs.te7.replace('/api/download/pdf?file=', '') : null,
        te9_path: generatedPDFs.te9 ? generatedPDFs.te9.replace('/api/download/pdf?file=', '') : null
      }

      const response = await fetch("/api/submit-to-tec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Forms successfully submitted to Traffic Enforcement Centre!")

        // Add bot message about successful submission
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `🎉 **Forms Successfully Submitted to Traffic Enforcement Centre!**\n\n📧 **Submission Details**:\n• Submission ID: ${result.submission_id}\n• Date: ${new Date().toLocaleDateString()}\n• TEC Email: ${result.details?.tec_email}\n• Confirmation sent to: ${submissionData.email}\n\n**Next Steps**:\n1. You should receive an acknowledgment from TEC within 10-14 working days\n2. Processing time is typically 4-6 weeks\n3. Keep your submission ID for reference: ${result.submission_id}\n4. Check your email for confirmation copy\n\n**Important**: Monitor your email for any requests for additional information from TEC.`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMessage])

        // Close PDF modal and reset state
        setShowPDFModal(false)
        setGeneratedPDFs({})

      } else {
        toast.error(`TEC submission failed: ${result.details?.join(", ") || result.error}`)
        
        // Add bot message about submission failure
        const botMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `❌ **TEC Submission Failed**\n\nThere was an error submitting your forms to the Traffic Enforcement Centre.\n\n**Error Details**: ${result.details?.join(", ") || result.error}\n\n**Alternative Options**:\n1. Download the PDF forms manually and email them yourself\n2. Print and post the forms to TEC\n3. Try the submission again later\n\n**TEC Contact**: tec@justice.gov.uk\n**TEC Address**: Traffic Enforcement Centre, Northampton County Court`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMessage])
      }

    } catch (error) {
      console.error("TEC submission error:", error)
      toast.error("Failed to submit forms to TEC. Please try again or submit manually.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Helper function to get TE9 ground text
  const getTE9GroundText = (declarationType?: string): string => {
    switch (declarationType) {
      case "not_received":
        return "I did not receive the Notice to Owner"
      case "not_driver":
        return "I was not the driver of the vehicle at the time"
      case "other":
        return "Other statutory grounds as detailed in statement"
      default:
        return "Legal grounds as specified in declaration"
    }
  }

  const getStatusBadgeVariant = (status: Appeal["status"]) => {
    switch (status) {
      case "APPROVED":
        return "default"
      case "REJECTED":
        return "destructive"
      case "UNDER_REVIEW":
        return "secondary"
      case "SUBMITTED":
        return "outline"
      case "ADDITIONAL_INFO_REQUIRED":
        return "secondary"
      case "WITHDRAWN":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: Appeal["status"]) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />
      case "REJECTED":
        return <XCircle className="h-4 w-4" />
      case "UNDER_REVIEW":
        return <Clock className="h-4 w-4" />
      case "SUBMITTED":
        return <AlertCircle className="h-4 w-4" />
      case "ADDITIONAL_INFO_REQUIRED":
        return <AlertCircle className="h-4 w-4" />
      case "WITHDRAWN":
        return <XCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // AI-Enhanced Functions
  const analyzeDocumentForAutoFill = async (file: UploadedFile) => {
    try {
      // Create FormData for OCR API
      const formData = new FormData()
      
      // Convert the file URL back to a Blob for upload
      const response = await fetch(file.url)
      const blob = await response.blob()
      formData.append('file', blob, file.name)
      
      // Call AI OCR API
      const ocrResponse = await api.post('/api/ai/extract-pcn', formData)
      
      if (ocrResponse.extracted_data) {
        const extractedData = ocrResponse.extracted_data
        
        // Auto-fill appeal data if we have good extraction
        if (extractedData.confidence_score > 0.3) {
          const updates: Partial<AppealData> = {}
          
          if (extractedData.pcn_number) updates.ticketNumber = extractedData.pcn_number
          if (extractedData.fine_amount) updates.fineAmount = extractedData.fine_amount
          if (extractedData.issue_date) updates.issueDate = extractedData.issue_date
          if (extractedData.location) updates.location = extractedData.location
          
          setAppealData(prev => ({ ...prev, ...updates }))
          
          // Show analysis results to user
          const analysisMessage: Message = {
            id: messages.length + 2,
            type: "bot",
            content: `🤖 **AI Document Analysis Complete!**\n\n📋 **Extracted Information:**\n${extractedData.pcn_number ? `• PCN Number: ${extractedData.pcn_number}\n` : ''}${extractedData.fine_amount ? `• Fine Amount: £${extractedData.fine_amount}\n` : ''}${extractedData.issue_date ? `• Issue Date: ${extractedData.issue_date}\n` : ''}${extractedData.location ? `• Location: ${extractedData.location}\n` : ''}\n🎯 **Confidence Score: ${(extractedData.confidence_score * 100).toFixed(0)}%**\n\n${ocrResponse.validation.is_valid_pcn ? '✅ Document appears to be a valid PCN' : '⚠️ Please verify extracted data manually'}\n\n${extractedData.confidence_score > 0.7 ? "High confidence extraction - you can proceed with the auto-filled data." : "Moderate confidence - please review and correct any errors before proceeding."}\n\n**Disclaimer:** AI extraction is for guidance only. Please verify all details against your original PCN.`,
            timestamp: new Date(),
          }
          
          setMessages(prev => [...prev, analysisMessage])
        }
      }
      
    } catch (error) {
      console.error('OCR analysis error:', error)
      
      // Fallback message if OCR fails
      const fallbackMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: `📄 Document uploaded successfully! Unfortunately, I couldn't automatically extract the PCN information. Please continue entering the details manually.\n\n💡 **Tip:** Make sure the image is clear and well-lit for better automatic recognition in the future.`,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, fallbackMessage])
    }
  }

  const isPredictionEnvelope = (obj: any): obj is { prediction: any; strategy?: any } => {
    return obj && typeof obj === 'object' && 'prediction' in obj
  }

  const generateAIPrediction = async (appealData: Partial<AppealData>) => {
    try {
      // Only generate prediction if we have enough data including vehicle registration
      if (!appealData.reason || !appealData.description || !appealData.vehicleRegistration) {
        console.log('Missing required data for AI prediction:', { 
          reason: !!appealData.reason, 
          description: !!appealData.description, 
          vehicleRegistration: !!appealData.vehicleRegistration 
        })
        return null
      }
      
      // Call AI prediction API
      const predictionResponse = await api.post('/api/ai/predict-appeal', {
        ticketNumber: appealData.ticketNumber,
        fineAmount: appealData.fineAmount,
        issueDate: appealData.issueDate,
        dueDate: appealData.dueDate,
        location: appealData.location,
        reason: appealData.reason,
        description: appealData.description,
        evidence: uploadedFiles.map(f => f.url),
        vehicle_reg: appealData.vehicleRegistration // Vehicle registration is now required
      })
      
      if (isPredictionEnvelope(predictionResponse)) {
        const prediction = predictionResponse.prediction as any
        const strategy = predictionResponse.strategy as any

        const details = [
          prediction.success_probability !== undefined ? `Success probability: ${(prediction.success_probability * 100).toFixed(0)}% (${prediction.confidence_level})` : '',
          prediction.recommendation ? `Recommendation: ${prediction.recommendation}` : '',
          prediction.appeal_category ? `Category: ${prediction.appeal_category}` : '',
          Array.isArray(prediction.key_factors) && prediction.key_factors.length ? `Key factors:\n- ${prediction.key_factors.slice(0,5).join('\n- ')}` : '',
          Array.isArray(prediction.risk_flags) && prediction.risk_flags.length ? `Risks:\n- ${prediction.risk_flags.join('\n- ')}` : '',
          Array.isArray(prediction.recommended_evidence) && prediction.recommended_evidence.length ? `Recommended evidence:\n- ${prediction.recommended_evidence.join('\n- ')}` : '',
          Array.isArray(prediction.checklist) && prediction.checklist.length ? `Checklist:\n- ${prediction.checklist.join('\n- ')}` : '',
        ].filter(Boolean).join('\n\n')

        const predictionMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `🤖 AI Appeal Analysis\n\n${details}`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, predictionMessage])
      }
      
    } catch (error: any) {
      console.error('AI prediction error:', error)
      
      // Handle free trial limit reached error
      if (error?.response?.status === 403) {
        const errorData = error.response.data
        let errorContent = `💳 **Free Trial Limit Reached**\n\n`
        
        if (errorData?.message) {
          errorContent += `${errorData.message}\n\n`
        } else {
          errorContent += `This vehicle registration has already been used for a free AI appeal analysis. Each vehicle can only receive one free analysis.\n\n`
        }
        
        errorContent += `To continue using our AI appeal analysis:\n• Upgrade to a paid plan for unlimited AI appeals\n• Get professional appeal letters\n• Access advanced legal analysis\n• Analyze multiple vehicle registrations\n\n[Upgrade Now](/#pricing) to unlock all features!`
        
        const errorMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: errorContent,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
      } else {
        // Handle other errors
        const errorMessage: Message = {
          id: messages.length + 1,
          type: "bot",
          content: `⚠️ **AI Analysis Temporarily Unavailable**\n\nI'm sorry, but I couldn't generate an AI prediction right now. This might be due to:\n• High system load\n• Temporary service interruption\n\nYou can still continue with your appeal - I'll help you create a professional appeal letter and legal forms. The AI analysis will be available again shortly.`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
      }
      
      return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="chat">AI Assistant</TabsTrigger>
            <TabsTrigger value="appeals">My Appeals</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="shrink-0 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI Appeal Assistant
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetConversation}
                    disabled={isLoading}
                  >
                    Reset Chat
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 p-6 pt-0">
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0 pr-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.type === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          message.type === "user"
                            ? "bg-red-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {message.type === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.type === "user"
                            ? "bg-red-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isUploading && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                        <p className="text-sm">Uploading files...</p>
                      </div>
                    </div>
                  )}
                  {isLoading && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                        <p className="text-sm">Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Ticket Type Selection Buttons */}
                {appealStep === "ticket_type_selection" && (
                  <div className="shrink-0 space-y-4 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      Select Your Penalty Type
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">Click the penalty type you want to appeal:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("parking");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🅿️</div>
                            <div>
                              <div className="font-medium">Parking Penalty (PCN)</div>
                              <div className="text-xs text-gray-500">Council parking violations</div>
                            </div>
                          </div>
                        </div>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("speeding");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🏎️</div>
                            <div>
                              <div className="font-medium">Speeding Fine (FPN)</div>
                              <div className="text-xs text-gray-500">Speed cameras, police stops</div>
                            </div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("bus lane");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🚌</div>
                            <div>
                              <div className="font-medium">Bus Lane Violation</div>
                              <div className="text-xs text-gray-500">Unauthorized bus lane use</div>
                            </div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("traffic light");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🔴</div>
                            <div>
                              <div className="font-medium">Red Light Camera</div>
                              <div className="text-xs text-gray-500">Traffic light violations</div>
                            </div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("congestion");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">💰</div>
                            <div>
                              <div className="font-medium">Congestion/ULEZ</div>
                              <div className="text-xs text-gray-500">London zone penalties</div>
                            </div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("tec");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🚗</div>
                            <div>
                              <div className="font-medium">TEC Court Fine</div>
                              <div className="text-xs text-gray-500">Traffic Enforcement Centre</div>
                            </div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("dvla");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">📋</div>
                            <div>
                              <div className="font-medium">DVLA Fine</div>
                              <div className="text-xs text-gray-500">Tax, insurance, MOT</div>
                            </div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("private parking");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🏢</div>
                            <div>
                              <div className="font-medium">Private Parking</div>
                              <div className="text-xs text-gray-500">Car park operators</div>
                            </div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons */}
                {messages.length === 0 && appealStep !== "ticket_type_selection" && (
                  <div className="shrink-0 space-y-4 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      Quick Appeal Generator
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">Choose your situation to get started instantly:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("I had a valid ticket displayed but still got a penalty charge notice. The payment machine was working and I displayed my ticket clearly.");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-600 group-hover:text-green-700" />
                            <div>
                              <div className="font-medium">Valid Ticket Displayed</div>
                              <div className="text-xs text-gray-500">Had valid payment/permit</div>
                            </div>
                          </div>
                          <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">1</kbd>
                        </div>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("The payment machine was broken or out of order when I tried to pay. I couldn't purchase a ticket despite attempting to.");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <XCircle className="h-6 w-6 text-red-600 group-hover:text-red-700" />
                            <div>
                              <div className="font-medium">Payment Machine Broken</div>
                              <div className="text-xs text-gray-500">Machine was out of order</div>
                            </div>
                          </div>
                          <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">2</kbd>
                        </div>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("The parking signs were unclear, missing, or contradictory. I couldn't understand the parking restrictions from the signage.");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-yellow-600 group-hover:text-yellow-700" />
                            <div>
                              <div className="font-medium">Confusing Signage</div>
                              <div className="text-xs text-gray-500">Signs were unclear/missing</div>
                            </div>
                          </div>
                          <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">3</kbd>
                        </div>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("I had a medical emergency and needed to park immediately to help someone or get medical assistance. This was an emergency situation.");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <Plus className="h-6 w-6 text-red-600 group-hover:text-red-700" />
                            <div>
                              <div className="font-medium">Medical Emergency</div>
                              <div className="text-xs text-gray-500">Emergency situation</div>
                            </div>
                          </div>
                          <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">4</kbd>
                        </div>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("I was only briefly loading or unloading items from my vehicle. I had my hazard lights on and it took less than a few minutes.");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <Car className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
                            <div>
                              <div className="font-medium">Loading/Unloading</div>
                              <div className="text-xs text-gray-500">Brief stop for items</div>
                            </div>
                          </div>
                          <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">5</kbd>
                        </div>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-16 text-left justify-start p-4 border-2 hover:border-blue-500 hover:bg-blue-50 group transition-all duration-200"
                        onClick={() => {
                          setInputValue("The penalty charge notice has incorrect information such as wrong registration number, time, date, or location details.");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-purple-600 group-hover:text-purple-700" />
                            <div>
                              <div className="font-medium">Incorrect PCN Details</div>
                              <div className="text-xs text-gray-500">Wrong information on ticket</div>
                            </div>
                          </div>
                          <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">6</kbd>
                        </div>
                      </Button>
                    </div>
                    
                    <div className="text-center pt-2">
                      <p className="text-xs text-gray-500">Click any option above, press the number keys (1-6), or type your own message below</p>
                    </div>
                  </div>
                )}
                
                {/* Bottom section with files and input */}
                <div className="shrink-0 space-y-3 mt-auto">
                  {/* Uploaded files display */}
                  {uploadedFiles.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            Uploaded Files ({uploadedFiles.length})
                          </span>
                        </div>
                        {isCreatingAppeal && uploadedFiles.some(f => f.type.startsWith('image/') || f.type === 'application/pdf') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const firstDocument = uploadedFiles.find(f => f.type.startsWith('image/') || f.type === 'application/pdf')
                              if (firstDocument) analyzeDocumentForAutoFill(firstDocument)
                            }}
                            disabled={isAnalyzing}
                            className="text-xs h-6 px-2"
                          >
                            <Wand2 className="h-3 w-3 mr-1" />
                            {isAnalyzing ? 'Analyzing...' : 'Auto-Fill'}
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getFileIcon(file.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Auto-fill analyzing indicator */}
                  {isAnalyzing && (
                    <Alert>
                      <Wand2 className="h-4 w-4 animate-pulse" />
                      <AlertDescription>
                        🤖 Analyzing your document for auto-fill information...
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Auto-fill prompt */}
                  {showAutoFillPrompt && extractedData && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <AlertDescription>
                        <div className="space-y-3">
                          <p className="font-medium text-blue-800">
                            🎉 I found information in your document! Would you like me to auto-fill the form?
                          </p>
                          
                          <div className="text-sm space-y-1 max-h-24 overflow-y-auto">
                            {extractedData.ticketNumber && (
                              <p><strong>Ticket Number:</strong> {extractedData.ticketNumber}</p>
                            )}
                            {extractedData.fineAmount && (
                              <p><strong>Fine Amount:</strong> £{extractedData.fineAmount}</p>
                            )}
                            {extractedData.issueDate && (
                              <p><strong>Issue Date:</strong> {new Date(extractedData.issueDate).toLocaleDateString()}</p>
                            )}
                            {extractedData.dueDate && (
                              <p><strong>Due Date:</strong> {new Date(extractedData.dueDate).toLocaleDateString()}</p>
                            )}
                            {extractedData.location && (
                              <p><strong>Location:</strong> {extractedData.location}</p>
                            )}
                            {extractedData.reason && (
                              <p><strong>Reason:</strong> {extractedData.reason}</p>
                            )}
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm" 
                              onClick={applyAutoFill}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Wand2 className="h-3 w-3 mr-1" />
                              Yes, Auto-Fill
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={rejectAutoFill}
                            >
                              Continue Manually
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Input area */}
                  <div className="flex gap-2 pt-3 border-t bg-background">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isUploading}
                      className="shrink-0"
                      title="Upload files"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={startDocumentScan}
                      disabled={isLoading || isUploading || isScanning}
                      className="shrink-0"
                      title="Scan document"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    {isCreatingAppeal && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={triggerDemoAutoFill}
                        disabled={isLoading || isAnalyzing}
                        className="shrink-0"
                        title="Try demo auto-fill"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    )}
                    {isCreatingAppeal && appealStep === "description" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInputValue("generate")
                          setTimeout(() => handleSendMessage(), 100)
                        }}
                        disabled={isLoading}
                        className="shrink-0 px-3"
                        title="Generate AI description"
                      >
                        <Wand2 className="h-4 w-4 mr-1" />
                        Generate
                      </Button>
                    )}
                    {selectedForms.length > 0 && (te7Data.witnessName || te9Data.declarantName) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generatePDFDocuments}
                        disabled={isGeneratingPDF}
                        className="shrink-0 px-3"
                        title="Generate PDF legal forms"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {isGeneratingPDF ? 'Generating...' : 'PDF Forms'}
                      </Button>
                    )}
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your message here..."
                      onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      size="icon" 
                      disabled={isLoading}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appeals" className="flex-1 mt-4 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-lg font-semibold">My Appeals</h3>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoadingAppeals ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 mx-auto border-b-2 border-red-500 mb-4" />
                      <p className="text-gray-600">Loading your appeals...</p>
                    </CardContent>
                  </Card>
                ) : appeals.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No appeals submitted yet</p>
                      <p className="text-sm text-muted-foreground">
                        Use the AI Assistant to get help with your appeals
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {appeals.map((appeal) => {
                      let evidenceCount = 0
                      try {
                        // The evidence is already parsed by the API, so check if it's an array
                        if (Array.isArray(appeal.evidence)) {
                          evidenceCount = appeal.evidence.length
                        } else if (appeal.evidence && typeof appeal.evidence === 'string') {
                          evidenceCount = JSON.parse(appeal.evidence).length
                        }
                      } catch (error) {
                        console.warn('Failed to parse evidence JSON:', error)
                        evidenceCount = 0
                      }
                      const formsUsed = appeal.selectedForms || []
                      
                      return (
                        <Card key={appeal.id} className="w-full">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">Ticket: {appeal.ticketNumber}</CardTitle>
                              <Badge variant={getStatusBadgeVariant(appeal.status)} className="flex items-center gap-1">
                                {getStatusIcon(appeal.status)}
                                {appeal.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-gray-900">Fine Amount</p>
                                <p className="text-gray-600">£{appeal.fineAmount.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Issue Date</p>
                                <p className="text-gray-600">{new Date(appeal.issueDate).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Location</p>
                                <p className="text-gray-600">{appeal.location}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Submitted</p>
                                <p className="text-gray-600">{new Date(appeal.submissionDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="font-medium text-gray-900 text-sm mb-1">Reason</p>
                              <p className="text-gray-600 text-sm">{appeal.reason}</p>
                            </div>
                            
                            <div>
                              <p className="font-medium text-gray-900 text-sm mb-1">Description</p>
                              <p className="text-gray-600 text-sm line-clamp-3">{appeal.description}</p>
                            </div>
                            
                            {(evidenceCount > 0 || formsUsed.length > 0) && (
                              <div className="flex items-center gap-4 pt-2 border-t">
                                {evidenceCount > 0 && (
                                  <div className="flex items-center gap-1 text-sm text-green-600">
                                    <Paperclip className="h-4 w-4" />
                                    <span>{evidenceCount} file{evidenceCount !== 1 ? 's' : ''} attached</span>
                                  </div>
                                )}
                                {formsUsed.length > 0 && (
                                  <div className="flex items-center gap-1 text-sm text-blue-600">
                                    <FileText className="h-4 w-4" />
                                    <span>Forms: {formsUsed.map(f => f.toUpperCase()).join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Document Scan Modal */}
    <Dialog open={showScanModal} onOpenChange={setShowScanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scan Document
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Scan overlay */}
              <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg pointer-events-none opacity-50">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
              </div>
              
              {/* Instructions overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded-md">
                  Position your document within the frame and tap capture
                </p>
              </div>
              
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={stopScanning}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={captureDocument}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Scan className="h-4 w-4 mr-2" />
                Capture Document
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>Tip: Ensure good lighting and position the document flat for best results</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Auto-fill Prompt Dialog */}
      <Dialog open={showAutoFillPrompt} onOpenChange={setShowAutoFillPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Auto-fill Detected</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              I found some information in the scanned document that might help with your appeal:
            </p>
            
            <div className="bg-gray-50 p-4 rounded-md text-sm">
              {Object.entries(extractedData || {}).length === 0 ? (
                <p className="text-gray-500">No relevant information found.</p>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(extractedData || {}).map(([key, value]) => (
                    <li key={key} className="flex gap-2">
                      <span className="font-medium text-gray-800 capitalize">{key}:</span>
                      <span className="text-gray-700">{String(value)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <p className="text-sm text-gray-700">
              Would you like to auto-fill the appeal form with this information?
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={rejectAutoFill}
              disabled={isLoading}
            >
              No, review manually
            </Button>
            <Button
              onClick={applyAutoFill}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Yes, auto-fill
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* PDF Download Modal */}
      <Dialog open={showPDFModal} onOpenChange={setShowPDFModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Download Your PDF Documents</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Your TE7 and TE9 documents have been generated. Click the links below to download your PDF files:
            </p>
            
            <div className="flex flex-col gap-2">
              {generatedPDFs.te7 && (
                <a
                  href={generatedPDFs.te7}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-sm font-medium text-gray-800">TE7 Witness Statement</span>
                  <Download className="h-4 w-4 text-green-600" />
                </a>
              )}
              {generatedPDFs.te9 && (
                <a
                  href={generatedPDFs.te9}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-sm font-medium text-gray-800">TE9 Statutory Declaration</span>
                  <Download className="h-4 w-4 text-green-600" />
                </a>
              )}
            </div>
            
            {/* Automated submission section */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Automated Submission</h4>
                <Badge variant="outline" className="text-xs">Optional</Badge>
              </div>
              
              <p className="text-xs text-gray-600 mb-3">
                Automatically submit your forms to the Traffic Enforcement Centre via email. 
                You'll receive a confirmation copy and submission ID for tracking.
              </p>
              
              <Button
                onClick={submitToTEC}
                disabled={isGeneratingPDF}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting to TEC...
                  </>
                ) : (
                  <>
                    📧 Submit to Traffic Enforcement Centre
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4 pt-3 border-t">
              Note: These documents are fillable PDFs. Open them in a PDF reader to complete and print.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Registration Modal */}
      <Dialog 
        open={showVehicleRegModal} 
        onOpenChange={(open) => {
          // Only allow closing via Cancel button, not by clicking outside or escape
          if (!open && vehicleRegInput.trim()) {
            return // Prevent closing if user has entered data
          }
          setShowVehicleRegModal(open)
        }}
      >
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Registration Required
            </DialogTitle>
            <DialogDescription>
              To access your free AI appeal analysis, please enter your vehicle registration number. Each vehicle registration gets one free analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="vehicleReg" className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Registration Number
              </label>
              <input
                id="vehicleReg"
                type="text"
                value={vehicleRegInput}
                onChange={(e) => setVehicleRegInput(e.target.value.toUpperCase())}
                placeholder="e.g., AB12 CDE"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleVehicleRegSubmit()
                  }
                }}
                disabled={isCheckingTrialStatus}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: Letters and numbers (spaces optional)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowVehicleRegModal(false)
                  setVehicleRegInput("")
                  
                  // Add a message explaining they can't proceed without registration
                  const warningMessage: Message = {
                    id: messages.length + 1,
                    type: "bot",
                    content: "⚠️ **Registration Required**\n\nI can't help you create an AI appeal without your vehicle registration number. This is required to:\n\n• Check your free trial status\n• Ensure proper service delivery\n• Track appeal analytics\n\nWhenever you're ready to continue, just type anything and I'll show the registration popup again! 🚗",
                    timestamp: new Date(),
                  }
                  setMessages(prev => [...prev, warningMessage])
                }}
                variant="outline"
                className="flex-1"
                disabled={isCheckingTrialStatus}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVehicleRegSubmit}
                className="flex-1"
                disabled={isCheckingTrialStatus || !vehicleRegInput.trim()}
              >
                {isCheckingTrialStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
              <strong>Free Trial:</strong> Each vehicle registration can receive one free AI appeal analysis. 
              After that, upgrade to a paid plan for unlimited analyses.
            </div>

            <div className="text-center text-xs text-gray-500 mt-4 pt-3 border-t">
              <p>
                This information is generated by AI for guidance only and does not constitute formal legal advice.{" "}
                <Link href="/terms" target="_blank" className="hover:text-gray-700 underline">
                  Terms & Conditions
                </Link>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        service="appeal"
        trialUsedFor={vehicleRegInput}
        onPaymentSuccess={() => {
          fetchUserUsage()
          // Retry the appeal submission after payment
          if (pendingAppealData) {
            setTimeout(() => {
              submitAppeal(pendingAppealData)
              setPendingAppealData(null)
            }, 1000)
          }
        }}
      />
    </div>
  )
}

export default Appeals

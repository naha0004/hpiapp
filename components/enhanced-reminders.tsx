"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Calendar, Bell, Car, CreditCard, Shield, FileText, Plus, Trash2, Edit, 
  CheckCircle2, AlertTriangle, Clock, Lightbulb, X, Check, Sparkles, TestTube, Pen 
} from "lucide-react"
import { motion } from "framer-motion"
import { TE7SignatureForm, TE9SignatureForm, useSignature } from "@/components/signature-canvas"

const MotionDiv = motion.div
const MotionCard = motion(Card)

interface Reminder {
  id: string
  type: string
  title: string
  vehicleReg?: string
  dueDate: string
  notifyDays: number
  daysLeft: number
  priority: "high" | "medium" | "low"
  description?: string
  make?: string
  model?: string
  year?: number
  isRecurring?: boolean
}

interface Suggestion {
  id: string
  type: string
  title: string
  message: string
  priority: "urgent" | "high" | "medium" | "low"
  vehicleReg: string
  dvlaData?: any
}

const reminderTypes = [
  { value: "MOT_TEST", label: "MOT Test", icon: Car, color: "bg-blue-500" },
  { value: "VEHICLE_TAX", label: "Vehicle Tax", icon: CreditCard, color: "bg-green-500" },
  { value: "INSURANCE", label: "Insurance", icon: Shield, color: "bg-purple-500" },
  { value: "FINE_PAYMENT", label: "Fine Payment", icon: FileText, color: "bg-red-500" },
  { value: "OTHER", label: "Other", icon: Bell, color: "bg-gray-500" },
]

const mockReminders: Reminder[] = [
  {
    id: "1",
    type: "MOT_TEST",
    title: "MOT Test",
    vehicleReg: "AB12 CDE",
    dueDate: "2025-03-15",
    notifyDays: 30,
    daysLeft: 45,
    priority: "medium",
    description: "Annual MOT test due",
    make: "Ford",
    model: "Focus",
    year: 2018,
    isRecurring: true
  },
  {
    id: "2",
    type: "VEHICLE_TAX",
    title: "Vehicle Tax",
    vehicleReg: "XY98 ZAB",
    dueDate: "2025-02-28",
    notifyDays: 14,
    daysLeft: 28,
    priority: "high",
    description: "Vehicle tax renewal due",
    make: "BMW",
    model: "320i",
    year: 2020,
    isRecurring: true
  }
]

const mockSuggestions: Suggestion[] = [
  {
    id: "s1",
    type: "MOT_EXPIRING",
    title: "MOT Test Due Soon",
    message: "Your MOT expires on 15th March 2025. Set up a reminder to book your test.",
    priority: "high",
    vehicleReg: "AB12 CDE"
  },
  {
    id: "s2",
    type: "TAX_EXPIRING",
    title: "Vehicle Tax Due Soon",
    message: "Your vehicle tax expires on 28th February 2025. Renew online to avoid penalties.",
    priority: "medium",
    vehicleReg: "XY98 ZAB"
  }
]

interface EnhancedRemindersProps {
  // Optional vehicle data to auto-suggest reminders
  vehicleData?: {
    registration: string
    make?: string
    model?: string
    year?: number
    dvlaData?: {
      taxStatus?: string
      taxDueDate?: string
      motStatus?: string
      motExpiryDate?: string
      yearOfManufacture?: number
    }
    motTests?: Array<{
      expiryDate: string
      testResult: string
    }>
  }
  userId?: string
}

export function EnhancedReminders({ vehicleData, userId = "demo-user" }: EnhancedRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders)
  const [suggestions, setSuggestions] = useState<Suggestion[]>(mockSuggestions)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  // TE7/TE9 Signature functionality
  const [showTE7Form, setShowTE7Form] = useState(false)
  const [showTE9Form, setShowTE9Form] = useState(false)
  const { signatures, addSignature, hasSignature, getSignature } = useSignature()
  
  const [formData, setFormData] = useState({
    type: "",
    vehicleReg: "",
    dueDate: "",
    notifyDays: "30",
    title: "",
    description: "",
    make: "",
    model: "",
    year: "",
    isRecurring: false
  })

  // Auto-populate form if vehicle data is provided
  useEffect(() => {
    if (vehicleData && showAddForm) {
      setFormData(prev => ({
        ...prev,
        vehicleReg: vehicleData.registration || "",
        make: vehicleData.make || "",
        model: vehicleData.model || "",
        year: vehicleData.year?.toString() || vehicleData.dvlaData?.yearOfManufacture?.toString() || ""
      }))
    }
  }, [vehicleData, showAddForm])

  // Generate suggestions from vehicle data
  const generateSuggestionsFromVehicleData = useCallback(() => {
    if (!vehicleData) return

    const newSuggestions: Suggestion[] = []
    const now = new Date()

    // Check MOT expiry
    if (vehicleData.dvlaData?.motExpiryDate) {
      const motExpiry = new Date(vehicleData.dvlaData.motExpiryDate)
      const daysUntilExpiry = Math.ceil((motExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24))

      if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
        const motSuggestionId = `mot-${vehicleData.registration}`
        newSuggestions.push({
          id: motSuggestionId,
          type: "MOT_EXPIRING",
          title: "MOT Test Due Soon",
          message: `Your MOT expires on ${motExpiry.toLocaleDateString()}. Set up a reminder to book your test.`,
          priority: daysUntilExpiry <= 30 ? "high" : "medium",
          vehicleReg: vehicleData.registration,
          dvlaData: vehicleData.dvlaData
        })
      }
    }

    // Check tax expiry
    if (vehicleData.dvlaData?.taxDueDate && vehicleData.dvlaData?.taxStatus === 'Taxed') {
      const taxExpiry = new Date(vehicleData.dvlaData.taxDueDate)
      const daysUntilExpiry = Math.ceil((taxExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24))

      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        const taxSuggestionId = `tax-${vehicleData.registration}`
        newSuggestions.push({
          id: taxSuggestionId,
          type: "TAX_EXPIRING",
          title: "Vehicle Tax Due Soon",
          message: `Your vehicle tax expires on ${taxExpiry.toLocaleDateString()}. Renew online to avoid penalties.`,
          priority: daysUntilExpiry <= 14 ? "high" : "medium",
          vehicleReg: vehicleData.registration,
          dvlaData: vehicleData.dvlaData
        })
      }
    }

    // Check for untaxed/overdue situations
    if (vehicleData.dvlaData?.taxStatus === 'Untaxed') {
      const taxUrgentId = `tax-urgent-${vehicleData.registration}`
      newSuggestions.push({
        id: taxUrgentId,
        type: "TAX_OVERDUE",
        title: "Vehicle Not Taxed",
        message: "Your vehicle is not currently taxed. This vehicle is not road legal.",
        priority: "urgent",
        vehicleReg: vehicleData.registration,
        dvlaData: vehicleData.dvlaData
      })
    }

    // Add only new suggestions that don't already exist
    if (newSuggestions.length > 0) {
      setSuggestions(prev => {
        const existingIds = prev.map(s => s.id)
        const uniqueNewSuggestions = newSuggestions.filter(s => !existingIds.includes(s.id))
        return uniqueNewSuggestions.length > 0 ? [...uniqueNewSuggestions, ...prev] : prev
      })
    }
  }, [vehicleData])

  // Generate suggestions from vehicle data when vehicleData changes
  useEffect(() => {
    if (vehicleData) {
      generateSuggestionsFromVehicleData()
    }
  }, [vehicleData, generateSuggestionsFromVehicleData])

  const handleAddReminder = async () => {
    if (!formData.type || !formData.dueDate || !formData.title) return

    setIsLoading(true)

    try {
      const dueDate = new Date(formData.dueDate)
      const today = new Date()
      const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      const reminderType = reminderTypes.find((type) => type.value === formData.type)
      const priority: "high" | "medium" | "low" = daysLeft <= 14 ? "high" : daysLeft <= 30 ? "medium" : "low"

      const newReminder: Reminder = {
        id: Date.now().toString(),
        type: formData.type,
        title: formData.title,
        vehicleReg: formData.vehicleReg || undefined,
        dueDate: formData.dueDate,
        notifyDays: Number.parseInt(formData.notifyDays),
        daysLeft,
        priority,
        description: formData.description,
        make: formData.make || undefined,
        model: formData.model || undefined,
        year: formData.year ? Number.parseInt(formData.year) : undefined,
        isRecurring: formData.isRecurring
      }

      setReminders([...reminders, newReminder])
      setFormData({ 
        type: "", vehicleReg: "", dueDate: "", notifyDays: "30", 
        title: "", description: "", make: "", model: "", year: "", isRecurring: false 
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding reminder:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter((reminder) => reminder.id !== id))
  }

  const handleAcceptSuggestion = async (suggestion: Suggestion) => {
    // Check if user is authenticated
    if (!userId || userId === "demo-user") {
      alert('Please log in to create reminders. You need to be signed in to receive email notifications.')
      return
    }

    // First, ask for email address if not available
    const email = prompt('Please enter your email address for reminder notifications:')
    if (!email || !email.includes('@')) {
      alert('Please provide a valid email address to receive reminders.')
      return
    }

    // Ask for notification days
    const reminderTypeText = suggestion.type.includes('MOT') ? 'MOT test' : 
                           suggestion.type.includes('TAX') ? 'tax renewal' : 'reminder'
    const defaultDays = suggestion.type.includes('TAX') ? '14' : '30'
    
    const notifyDaysInput = prompt(
      `⏰ When would you like to be reminded about the ${reminderTypeText}?\n\n` +
      '📅 Popular options:\n' +
      '• 0 = Same day (for testing) 🧪\n' +
      '• 1 = 1 day before ⚡\n' +
      '• 7 = 1 week before 📅\n' +
      '• 14 = 2 weeks before 📋\n' +
      '• 30 = 1 month before ✅ (recommended)\n' +
      '• 60 = 2 months before 📆\n\n' +
      'Enter any number between 0-365:',
      defaultDays
    )
    
    if (notifyDaysInput === null) return // User cancelled
    
    const notifyDays = parseInt(notifyDaysInput)
    if (isNaN(notifyDays) || notifyDays < 0 || notifyDays > 365) {
      alert('Please enter a valid number between 0 and 365 days.')
      return
    }

    setIsLoading(true)
    
    try {
      // Create reminder from suggestion
      let dueDate: Date
      let title: string

      if (suggestion.type === 'MOT_EXPIRING') {
        dueDate = suggestion.dvlaData?.motExpiryDate 
          ? new Date(suggestion.dvlaData.motExpiryDate) 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        title = `MOT Test - ${suggestion.vehicleReg}`
      } else if (suggestion.type === 'TAX_EXPIRING' || suggestion.type === 'TAX_OVERDUE') {
        dueDate = suggestion.dvlaData?.taxDueDate 
          ? new Date(suggestion.dvlaData.taxDueDate) 
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        title = `Vehicle Tax - ${suggestion.vehicleReg}`
      } else {
        dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        title = suggestion.title
      }

      // Create reminder via API
      const reminderData = {
        userId: userId,
        vehicleReg: suggestion.vehicleReg,
        reminderType: suggestion.type === 'MOT_EXPIRING' ? 'MOT_TEST' : 'VEHICLE_TAX',
        title: title,
        description: suggestion.message,
        dueDate: dueDate.toISOString().split('T')[0],
        notifyDays: notifyDays,
        make: vehicleData?.make || undefined,
        model: vehicleData?.model || undefined,
        year: vehicleData?.year || vehicleData?.dvlaData?.yearOfManufacture || undefined,
        isRecurring: true,
        recurringInterval: 365,
        email: email // Include email for notifications
      }

      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Add to local state for immediate UI update
        const today = new Date()
        const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const newReminder: Reminder = {
          id: result.data?.id || `from-suggestion-${Date.now()}`,
          type: suggestion.type === 'MOT_EXPIRING' ? 'MOT_TEST' : 'VEHICLE_TAX',
          title,
          vehicleReg: suggestion.vehicleReg,
          dueDate: dueDate.toISOString().split('T')[0],
          notifyDays,
          daysLeft,
          priority: suggestion.priority === 'urgent' ? 'high' : suggestion.priority as any,
          description: suggestion.message,
          isRecurring: true
        }

        setReminders([...reminders, newReminder])
        setSuggestions(suggestions.filter(s => s.id !== suggestion.id))
        
        // Show success message with timing details
        const reminderType = suggestion.type === 'MOT_EXPIRING' ? 'MOT' : 'TAX'
        const timingText = notifyDays === 0 
          ? 'on the same day' 
          : notifyDays === 1 
          ? '1 day before' 
          : `${notifyDays} days before`
        
        alert(
          `✅ ${reminderType} reminder created successfully!\n\n` +
          `📧 Email notifications will be sent to: ${email}\n` +
          `⏰ Reminder will be sent ${timingText} the due date.\n` +
          `📅 Due date: ${dueDate.toLocaleDateString('en-GB')}`
        )
        
      } else {
        const errorData = await response.json()
        alert(`❌ Failed to create reminder: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error accepting suggestion:', error)
      alert('❌ Error creating reminder. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestions(suggestions.filter(s => s.id !== suggestionId))
  }

  const createQuickReminder = async (type: 'MOT' | 'TAX') => {
    if (!vehicleData) return

    // Check if user is authenticated
    if (!userId || userId === "demo-user") {
      alert('Please log in to create reminders. You need to be signed in to receive email notifications.')
      return
    }

    // First, ask for email address if not available
    const email = prompt('Please enter your email address for reminder notifications:')
    if (!email || !email.includes('@')) {
      alert('Please provide a valid email address to receive reminders.')
      return
    }

    // Ask for notification days
    const notifyDaysInput = prompt(
      `⏰ When would you like to be reminded about the ${type === 'MOT' ? 'MOT test' : 'tax renewal'}?\n\n` +
      '📅 Popular options:\n' +
      '• 0 = Same day (for testing) 🧪\n' +
      '• 1 = 1 day before ⚡\n' +
      '• 7 = 1 week before 📅\n' +
      '• 14 = 2 weeks before 📋\n' +
      '• 30 = 1 month before ✅ (recommended)\n' +
      '• 60 = 2 months before 📆\n\n' +
      'Enter any number between 0-365:',
      type === 'MOT' ? '30' : '14'
    )
    
    if (notifyDaysInput === null) return // User cancelled
    
    const notifyDays = parseInt(notifyDaysInput)
    if (isNaN(notifyDays) || notifyDays < 0 || notifyDays > 365) {
      alert('Please enter a valid number between 0 and 365 days.')
      return
    }

    setIsLoading(true)

    try {
      const today = new Date()
      let dueDate: Date
      let title: string

      if (type === 'MOT') {
        dueDate = vehicleData.dvlaData?.motExpiryDate 
          ? new Date(vehicleData.dvlaData.motExpiryDate)
          : vehicleData.motTests?.[0]?.expiryDate 
          ? new Date(vehicleData.motTests[0].expiryDate)
          : new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)
        title = `MOT Test - ${vehicleData.registration}`
      } else {
        dueDate = vehicleData.dvlaData?.taxDueDate 
          ? new Date(vehicleData.dvlaData.taxDueDate)
          : new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)
        title = `Vehicle Tax - ${vehicleData.registration}`
      }

      // Create reminder via API
      const reminderData = {
        userId: userId,
        vehicleReg: vehicleData.registration,
        reminderType: type === 'MOT' ? 'MOT_TEST' : 'VEHICLE_TAX',
        title: title,
        description: `${type === 'MOT' ? 'MOT test' : 'Vehicle tax'} for ${vehicleData.registration}`,
        dueDate: dueDate.toISOString().split('T')[0],
        notifyDays: notifyDays,
        make: vehicleData.make || undefined,
        model: vehicleData.model || undefined,
        year: vehicleData.year || vehicleData.dvlaData?.yearOfManufacture || undefined,
        isRecurring: true,
        recurringInterval: 365,
        email: email // Include email for notifications
      }

      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Add to local state for immediate UI update
        const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const newReminder: Reminder = {
          id: result.data?.id || `quick-${type.toLowerCase()}-${Date.now()}`,
          type: type === 'MOT' ? 'MOT_TEST' : 'VEHICLE_TAX',
          title,
          vehicleReg: vehicleData.registration,
          dueDate: dueDate.toISOString().split('T')[0],
          notifyDays,
          daysLeft,
          priority: daysLeft <= 14 ? 'high' : daysLeft <= 30 ? 'medium' : 'low',
          description: `${type === 'MOT' ? 'MOT test' : 'Vehicle tax'} for ${vehicleData.registration}`,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year || vehicleData.dvlaData?.yearOfManufacture,
          isRecurring: true
        }

        setReminders([...reminders, newReminder])
        
        // Show success message with timing details
        const timingText = notifyDays === 0 
          ? 'on the same day' 
          : notifyDays === 1 
          ? '1 day before' 
          : `${notifyDays} days before`
        
        alert(
          `✅ ${type} reminder created successfully!\n\n` +
          `📧 Email notifications will be sent to: ${email}\n` +
          `⏰ Reminder will be sent ${timingText} the due date.\n` +
          `📅 Due date: ${dueDate.toLocaleDateString('en-GB')}`
        )
        
      } else {
        const errorData = await response.json()
        alert(`❌ Failed to create reminder: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating quick reminder:', error)
      alert('❌ Error creating reminder. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "high":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "medium":
        return <Bell className="h-4 w-4 text-blue-500" />
      case "low":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  // Test function for immediate notification
  const createTestReminder = async (type: 'MOT' | 'TAX') => {
    if (!vehicleData) return

    // Check if user is authenticated
    if (!userId || userId === "demo-user") {
      alert('Please log in to create test reminders. You need to be signed in to receive email notifications.')
      return
    }

    // Ask for email address
    const email = prompt('Please enter your email address for the TEST reminder:')
    if (!email || !email.includes('@')) {
      alert('Please provide a valid email address to receive the test reminder.')
      return
    }

    if (!confirm(`This will create a ${type} reminder for TODAY to test the email system. Continue?`)) {
      return
    }

    setIsLoading(true)

    try {
      const today = new Date()
      const title = `TEST ${type} Reminder - ${vehicleData.registration}`

      // Create test reminder for today with 0 days notice
      const reminderData = {
        userId: userId,
        vehicleReg: vehicleData.registration,
        reminderType: type === 'MOT' ? 'MOT_TEST' : 'VEHICLE_TAX',
        title: title,
        description: `TEST ${type === 'MOT' ? 'MOT test' : 'Vehicle tax'} reminder for ${vehicleData.registration} - Created for testing email notifications`,
        dueDate: today.toISOString().split('T')[0], // Today's date
        notifyDays: 0, // Same day notification
        make: vehicleData.make || undefined,
        model: vehicleData.model || undefined,
        year: vehicleData.year || vehicleData.dvlaData?.yearOfManufacture || undefined,
        isRecurring: false, // Test reminders should not recur
        recurringInterval: null,
        email: email
      }

      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData)
      })

      if (response.ok) {
        const result = await response.json()
        
        alert(
          `✅ TEST ${type} reminder created successfully!\n\n` +
          `📧 Test email will be sent to: ${email}\n` +
          `⏰ This is a same-day test reminder\n` +
          `📅 Due date: Today (${today.toLocaleDateString('en-GB')})\n\n` +
          `Check your email for the test notification!`
        )
        
      } else {
        const errorData = await response.json()
        alert(`❌ Failed to create test reminder: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating test reminder:', error)
      alert('❌ Error creating test reminder. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // TE7 and TE9 signature handlers
  const handleTE7SignatureComplete = (signatures: { applicant?: string; witness?: string }) => {
    if (signatures.applicant) {
      addSignature('te7', signatures.applicant)
    }
  }

  const handleTE9SignatureComplete = (signatures: { declarant?: string; witness?: string }) => {
    if (signatures.declarant) {
      addSignature('te9', signatures.declarant)
    }
  }

  const downloadTE7WithSignature = async () => {
    try {
      const signature = getSignature('te7')
      if (!signature) {
        alert('Please complete the signature first')
        return
      }

      // Create TE7 data with signature
      const te7Data = {
        courtName: 'Traffic Enforcement Centre',
        claimNumber: 'TE7-FORM-001',
        applicantName: 'Your Name',
        applicantAddress: 'Your Address',
        applicantPostcode: 'Your Postcode',
        caseReference: 'Case Reference',
        hearingDate: new Date().toLocaleDateString('en-GB'),
        extensionUntil: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-GB'),
        reasonForExtension: 'Application for more time to challenge court order',
        applicantSignature: signature,
        signatureDate: new Date().toLocaleDateString('en-GB')
      }

      const response = await fetch('/api/generate-te7-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(te7Data),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `TE7_Application_with_signature.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        alert('✅ TE7 form with signature downloaded successfully!')
      } else {
        alert('❌ Failed to generate TE7 PDF')
      }
    } catch (error) {
      console.error('Error downloading TE7:', error)
      alert('❌ Error downloading TE7 form')
    }
  }

  const downloadTE9WithSignature = async () => {
    try {
      const signature = getSignature('te9')
      if (!signature) {
        alert('Please complete the signature first')
        return
      }

      // Create TE9 data with signature
      const te9Data = {
        courtName: 'Traffic Enforcement Centre',
        claimNumber: 'TE9-FORM-001',
        witnessName: 'Your Name',
        witnessAddress: 'Your Address',
        witnessPostcode: 'Your Postcode',
        witnessOccupation: 'Your Occupation',
        statementText: 'Witness statement for unpaid penalty charge',
        declarantSignature: signature,
        signatureDate: new Date().toLocaleDateString('en-GB')
      }

      const response = await fetch('/api/generate-te9-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(te9Data),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `TE9_Witness_Statement_with_signature.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        alert('✅ TE9 form with signature downloaded successfully!')
      } else {
        alert('❌ Failed to generate TE9 PDF')
      }
    } catch (error) {
      console.error('Error downloading TE9:', error)
      alert('❌ Error downloading TE9 form')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="flex flex-col items-center h-full p-4 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2 mt-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Smart Reminders
            </h1>
            <p className="text-gray-600">Never miss MOT, tax, or payment deadlines</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl space-y-6">
        {/* Vehicle Quick Actions */}
        {vehicleData && (
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quick Reminders for {vehicleData.registration}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {vehicleData.make} {vehicleData.model} {vehicleData.year}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 flex-wrap">
                <Button 
                  onClick={() => createQuickReminder('MOT')}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isLoading}
                >
                  <Car className="w-4 h-4 mr-2" />
                  Set MOT Reminder
                </Button>
                <Button 
                  onClick={() => createQuickReminder('TAX')}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  disabled={isLoading}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Set Tax Reminder
                </Button>
              </div>
              
              {/* Test buttons for immediate testing */}
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-gray-500 mb-2">🧪 For testing email notifications:</p>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={() => createTestReminder('MOT')}
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-600 hover:bg-purple-50 text-xs"
                    disabled={isLoading}
                  >
                    <TestTube className="w-3 h-3 mr-1" />
                    Test MOT Email
                  </Button>
                  <Button 
                    onClick={() => createTestReminder('TAX')}
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-600 hover:bg-purple-50 text-xs"
                    disabled={isLoading}
                  >
                    <TestTube className="w-3 h-3 mr-1" />
                    Test Tax Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </MotionCard>
        )}

        {/* Smart Suggestions */}
        {suggestions.length > 0 && showSuggestions && (
          <MotionCard
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Smart Suggestions</CardTitle>
                    <p className="text-sm text-gray-600 font-normal">Based on your vehicle data</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSuggestions(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <MotionDiv
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-4 p-4 bg-white rounded-lg border border-yellow-200"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getPriorityIcon(suggestion.priority)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{suggestion.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={getPriorityColor(suggestion.priority)} className="text-xs">
                              {suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {suggestion.vehicleReg}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptSuggestion(suggestion)}
                            disabled={isLoading}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismissSuggestion(suggestion.id)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </MotionDiv>
                ))}
              </div>
            </CardContent>
          </MotionCard>
        )}

        {/* TE7 & TE9 Digital Signature Forms */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50"
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Pen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">TE7 & TE9 Digital Signatures</CardTitle>
                <p className="text-sm text-gray-600 font-normal">
                  Create and sign your traffic court appeal forms digitally
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* TE7 Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">TE7 Application Form</h4>
                    <p className="text-sm text-gray-600">
                      Application for more time to challenge court order
                    </p>
                  </div>
                  <Badge variant={hasSignature('te7') ? 'default' : 'outline'} className="text-xs">
                    {hasSignature('te7') ? 'Signed' : 'Unsigned'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {!showTE7Form ? (
                    <Button
                      onClick={() => setShowTE7Form(true)}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      <Pen className="w-4 h-4 mr-2" />
                      {hasSignature('te7') ? 'Update' : 'Add'} TE7 Signature
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <TE7SignatureForm onSignatureComplete={handleTE7SignatureComplete} />
                      <Button
                        variant="outline"
                        onClick={() => setShowTE7Form(false)}
                        className="w-full"
                      >
                        Close
                      </Button>
                    </div>
                  )}

                  {hasSignature('te7') && (
                    <Button
                      onClick={downloadTE7WithSignature}
                      variant="outline"
                      className="w-full border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download TE7 PDF
                    </Button>
                  )}
                </div>
              </div>

              {/* TE9 Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">TE9 Witness Statement</h4>
                    <p className="text-sm text-gray-600">
                      Witness statement for unpaid penalty charge
                    </p>
                  </div>
                  <Badge variant={hasSignature('te9') ? 'default' : 'outline'} className="text-xs">
                    {hasSignature('te9') ? 'Signed' : 'Unsigned'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {!showTE9Form ? (
                    <Button
                      onClick={() => setShowTE9Form(true)}
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                      <Pen className="w-4 h-4 mr-2" />
                      {hasSignature('te9') ? 'Update' : 'Add'} TE9 Signature
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <TE9SignatureForm onSignatureComplete={handleTE9SignatureComplete} />
                      <Button
                        variant="outline"
                        onClick={() => setShowTE9Form(false)}
                        className="w-full"
                      >
                        Close
                      </Button>
                    </div>
                  )}

                  {hasSignature('te9') && (
                    <Button
                      onClick={downloadTE9WithSignature}
                      variant="outline"
                      className="w-full border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download TE9 PDF
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Digital Signature Information</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Digital signatures are accepted for initial submissions</li>
                    <li>• TE9 forms may require qualified witness signature (solicitor, etc.)</li>
                    <li>• Keep copies for your records and court submission</li>
                    <li>• Forms are automatically filled with your signature data</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </MotionCard>

        {/* Add Reminder Section */}
        <div className="w-full max-w-4xl mx-auto">
          {!showAddForm ? (
            <MotionCard
              whileHover={{ scale: 1.02 }}
              className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => setShowAddForm(true)}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 bg-blue-50 rounded-full mb-4">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Add New Reminder</h3>
                <p className="text-gray-600 text-center">
                  Create custom reminders for MOT, tax, insurance, and more
                </p>
              </CardContent>
            </MotionCard>
          ) : (
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-blue-200"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Create New Reminder
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Reminder Type *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reminder type" />
                        </SelectTrigger>
                        <SelectContent>
                          {reminderTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., MOT Test for AB12 CDE"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vehicleReg">Vehicle Registration</Label>
                      <Input
                        id="vehicleReg"
                        placeholder="AB12 CDE"
                        value={formData.vehicleReg}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicleReg: e.target.value.toUpperCase().replace(/\s/g, "") })
                        }
                        maxLength={8}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="make">Make</Label>
                        <Input
                          id="make"
                          placeholder="Ford"
                          value={formData.make}
                          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          placeholder="Focus"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          placeholder="2020"
                          type="number"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date *</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notifyDays">Notify Me (Days Before)</Label>
                      <Select
                        value={formData.notifyDays}
                        onValueChange={(value) => setFormData({ ...formData, notifyDays: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select notification time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day before</SelectItem>
                          <SelectItem value="3">3 days before</SelectItem>
                          <SelectItem value="7">1 week before</SelectItem>
                          <SelectItem value="14">2 weeks before</SelectItem>
                          <SelectItem value="30">30 days before</SelectItem>
                          <SelectItem value="60">60 days before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Additional notes or details..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        checked={formData.isRecurring}
                        onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isRecurring" className="text-sm font-medium">
                        Recurring reminder (yearly)
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddReminder}
                    disabled={!formData.type || !formData.dueDate || !formData.title || isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Reminder
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </MotionCard>
          )}
        </div>

        {/* Active Reminders */}
        {reminders.length > 0 && (
          <div className="w-full max-w-5xl mx-auto space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Active Reminders</h2>
                <p className="text-gray-600">
                  {reminders.length} reminder{reminders.length === 1 ? '' : 's'} set up
                </p>
              </div>
            </div>
            
            <div className="grid gap-4">
              {reminders
                .sort((a, b) => a.daysLeft - b.daysLeft)
                .map((reminder, index) => {
                  const ReminderIcon = reminderTypes.find((type) => type.value === reminder.type)?.icon || Bell
                  const typeColor = reminderTypes.find((type) => type.value === reminder.type)?.color || "bg-gray-500"
                  
                  return (
                    <MotionCard 
                      key={reminder.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:shadow-lg transition-shadow border-l-4"
                      style={{ borderLeftColor: typeColor.replace('bg-', '').includes('blue') ? '#3b82f6' : 
                                                  typeColor.replace('bg-', '').includes('green') ? '#10b981' :
                                                  typeColor.replace('bg-', '').includes('purple') ? '#8b5cf6' :
                                                  typeColor.replace('bg-', '').includes('red') ? '#ef4444' : '#6b7280' }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`p-3 rounded-full ${typeColor.replace('bg-', 'bg-').replace('500', '100')}`}>
                              <ReminderIcon className="h-6 w-6 text-white" style={{ 
                                color: typeColor.includes('blue') ? '#3b82f6' : 
                                       typeColor.includes('green') ? '#10b981' :
                                       typeColor.includes('purple') ? '#8b5cf6' :
                                       typeColor.includes('red') ? '#ef4444' : '#6b7280' 
                              }} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {reminder.title}
                                    {reminder.vehicleReg && (
                                      <span className="text-gray-500 ml-2 font-normal">
                                        ({reminder.vehicleReg})
                                      </span>
                                    )}
                                  </h3>
                                  {reminder.description && (
                                    <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                                  )}
                                  {(reminder.make || reminder.model || reminder.year) && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {[reminder.make, reminder.model, reminder.year].filter(Boolean).join(' ')}
                                    </p>
                                  )}
                                  <p className="text-sm text-gray-600 mt-2">
                                    Due: {formatDate(reminder.dueDate)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <Badge variant={getPriorityColor(reminder.priority)} className="mb-2">
                                {reminder.daysLeft > 0 ? `${reminder.daysLeft} days left` : "Overdue"}
                              </Badge>
                              <p className="text-xs text-gray-500">
                                Notify {reminder.notifyDays} days before
                              </p>
                              {reminder.isRecurring && (
                                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Recurring
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteReminder(reminder.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </MotionCard>
                  )
                })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {reminders.length === 0 && !showAddForm && (
          <div className="text-center space-y-4 mt-12">
            <div className="p-6 bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">No Reminders Set</h3>
              <p className="text-gray-600 mt-2">Create your first reminder to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

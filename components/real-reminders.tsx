"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Bell, Car, CreditCard, Shield, FileText, Plus, Trash2, Edit, Mail, AlertCircle, CheckCircle } from "lucide-react"

interface Reminder {
  id: string
  vehicleReg: string
  reminderType: string
  title: string
  description?: string
  dueDate: string
  notifyDays: number
  make?: string
  model?: string
  year?: number
  isRecurring?: boolean
  recurringInterval?: number
  createdAt: string
  updatedAt: string
}

const reminderTypes = [
  { value: "MOT_TEST", label: "MOT Test", icon: Car, description: "MOT certificate renewal" },
  { value: "VEHICLE_TAX", label: "Vehicle Tax", icon: CreditCard, description: "Vehicle tax renewal" },
  { value: "INSURANCE", label: "Insurance Renewal", icon: Shield, description: "Vehicle insurance renewal" },
  { value: "SERVICE", label: "Vehicle Service", icon: FileText, description: "Regular vehicle service" },
  { value: "FINE_PAYMENT", label: "Fine Payment", icon: FileText, description: "Traffic fine payment deadline" },
  { value: "APPEAL_DEADLINE", label: "Appeal Deadline", icon: FileText, description: "Traffic appeal deadline" },
  { value: "OTHER", label: "Other", icon: Bell, description: "Custom reminder" },
]

export function RealReminders() {
  const { data: session, status } = useSession()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState("")

  const [formData, setFormData] = useState({
    reminderType: "",
    vehicleReg: "",
    title: "",
    description: "",
    dueDate: "",
    notifyDays: "30",
    make: "",
    model: "",
    year: "",
    isRecurring: false,
    recurringInterval: "365", // yearly by default
    email: ""
  })

  // Initialize email from session
  useEffect(() => {
    if (session?.user?.email) {
      setUserEmail(session.user.email)
      setFormData(prev => ({ ...prev, email: session.user.email || "" }))
    }
  }, [session])

  // Load user's reminders
  useEffect(() => {
    if (session?.user?.id) {
      loadReminders()
    }
  }, [session])

  const loadReminders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reminders?userId=${session?.user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setReminders(data.data || [])
      } else {
        setError("Failed to load reminders")
      }
    } catch (err) {
      setError("Error loading reminders")
      console.error("Error loading reminders:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddReminder = async () => {
    if (!formData.reminderType || !formData.dueDate || !formData.title) {
      setError("Please fill in all required fields")
      return
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError("Please provide a valid email address for reminder notifications")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const reminderData = {
        userId: session?.user?.id,
        vehicleReg: formData.vehicleReg.toUpperCase().replace(/\s/g, ""),
        reminderType: formData.reminderType,
        title: formData.title,
        description: formData.description || undefined,
        dueDate: formData.dueDate,
        notifyDays: parseInt(formData.notifyDays),
        make: formData.make || undefined,
        model: formData.model || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        isRecurring: formData.isRecurring,
        recurringInterval: formData.isRecurring ? parseInt(formData.recurringInterval) : undefined,
        email: formData.email // Include email for the API
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
        setSuccess(`✅ Reminder created successfully! Email notifications will be sent to ${formData.email}`)
        setFormData({
          reminderType: "",
          vehicleReg: "",
          title: "",
          description: "",
          dueDate: "",
          notifyDays: "30",
          make: "",
          model: "",
          year: "",
          isRecurring: false,
          recurringInterval: "365",
          email: userEmail
        })
        setShowAddForm(false)
        await loadReminders() // Reload reminders
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create reminder")
      }
    } catch (err) {
      setError("Error creating reminder")
      console.error("Error creating reminder:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reminders?id=${reminderId}&userId=${session?.user?.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess("Reminder deleted successfully")
        await loadReminders()
      } else {
        setError("Failed to delete reminder")
      }
    } catch (err) {
      setError("Error deleting reminder")
      console.error("Error deleting reminder:", err)
    } finally {
      setLoading(false)
    }
  }

  const calculateDaysLeft = (dueDate: string): number => {
    const due = new Date(dueDate)
    const today = new Date()
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getPriorityColor = (daysLeft: number): "default" | "secondary" | "destructive" => {
    if (daysLeft <= 7) return "destructive"
    if (daysLeft <= 30) return "secondary"
    return "default"
  }

  if (status === "loading") {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  if (!session) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to create and manage vehicle reminders.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MOT & Tax Reminders</h2>
          <p className="text-muted-foreground">
            Never miss important vehicle deadlines with email reminders
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Reminder
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Create New Reminder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Field - Prominent placement */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <Label htmlFor="email" className="text-blue-800 font-medium">
                  Email for Reminder Notifications *
                </Label>
              </div>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-blue-300"
                required
              />
              <p className="text-sm text-blue-600 mt-1">
                We'll send MOT and tax reminder emails to this address using our professional service from enmsservices.co.uk
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reminderType">Reminder Type *</Label>
                <Select value={formData.reminderType} onValueChange={(value) => {
                  const selectedType = reminderTypes.find(t => t.value === value)
                  setFormData({ 
                    ...formData, 
                    reminderType: value,
                    title: selectedType?.label || ""
                  })
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reminder type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          <div>
                            <div>{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
                <Input
                  id="vehicleReg"
                  placeholder="AB12 CDE"
                  value={formData.vehicleReg}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleReg: e.target.value.toUpperCase().replace(/\s/g, "") })
                  }
                  maxLength={8}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Reminder Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. MOT Test - Honda Civic"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">Vehicle Make</Label>
                <Input
                  id="make"
                  placeholder="Ford, Honda, BMW..."
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Vehicle Model</Label>
                <Input
                  id="model"
                  placeholder="Focus, Civic, 3 Series..."
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2020"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notifyDays">Notify Me (Days Before)</Label>
                <Select
                  value={formData.notifyDays}
                  onValueChange={(value) => setFormData({ ...formData, notifyDays: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any additional notes about this reminder..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {(formData.reminderType === "MOT_TEST" || formData.reminderType === "VEHICLE_TAX") && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                />
                <Label htmlFor="isRecurring">
                  Set up recurring reminder (yearly for {formData.reminderType === "MOT_TEST" ? "MOT" : "Tax"})
                </Label>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleAddReminder} 
                disabled={loading || !formData.reminderType || !formData.dueDate || !formData.title || !formData.email}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Reminder"}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowAddForm(false)
                setError(null)
                setSuccess(null)
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reminders List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading && reminders.length === 0 ? (
          <div className="col-span-full text-center py-8">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reminders Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first reminder to get email notifications for important vehicle deadlines
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Reminder
              </Button>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => {
            const daysLeft = calculateDaysLeft(reminder.dueDate)
            const reminderType = reminderTypes.find(t => t.value === reminder.reminderType)
            
            return (
              <Card key={reminder.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {reminderType?.icon && <reminderType.icon className="h-5 w-5 text-primary" />}
                      <div>
                        <CardTitle className="text-sm">{reminder.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">{reminder.vehicleReg}</p>
                      </div>
                    </div>
                    <Badge variant={getPriorityColor(daysLeft)}>
                      {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? "Due today" : "Overdue"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due:</span>
                      <span>{new Date(reminder.dueDate).toLocaleDateString()}</span>
                    </div>
                    {reminder.make && reminder.model && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vehicle:</span>
                        <span>{reminder.make} {reminder.model} {reminder.year && `(${reminder.year})`}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Notify:</span>
                      <span>{reminder.notifyDays} days before</span>
                    </div>
                    {reminder.isRecurring && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recurring:</span>
                        <span>Yearly</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="flex-1"
                      disabled={loading}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {reminders.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          <Mail className="h-4 w-4 inline mr-2" />
          Email reminders will be sent from noreply@enmsservices.co.uk
        </div>
      )}
    </div>
  )
}

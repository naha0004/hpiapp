"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Bell, Car, CreditCard, Shield, FileText, Plus, Trash2, Edit } from "lucide-react"

interface Reminder {
  id: number
  type: string
  title: string
  vehicleReg?: string
  dueDate: string
  notifyDays: number
  daysLeft: number
  priority: "high" | "medium" | "low"
}

const reminderTypes = [
  { value: "mot", label: "MOT Test", icon: Car },
  { value: "tax", label: "Vehicle Tax", icon: CreditCard },
  { value: "insurance", label: "Insurance Renewal", icon: Shield },
  { value: "fine", label: "Fine Payment", icon: FileText },
  { value: "other", label: "Other", icon: Bell },
]

const initialReminders: Reminder[] = [
  {
    id: 1,
    type: "mot",
    title: "MOT Test",
    vehicleReg: "AB12 CDE",
    dueDate: "2024-03-15",
    notifyDays: 30,
    daysLeft: 45,
    priority: "medium",
  },
  {
    id: 2,
    type: "mot",
    title: "MOT Test",
    vehicleReg: "XY98 ZAB",
    dueDate: "2024-02-28",
    notifyDays: 30,
    daysLeft: 28,
    priority: "high",
  },
  {
    id: 3,
    type: "fine",
    title: "Parking Fine Payment",
    dueDate: "2024-02-15",
    notifyDays: 7,
    daysLeft: 15,
    priority: "high",
  },
]

export function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    type: "",
    vehicleReg: "",
    dueDate: "",
    notifyDays: "30",
  })

  const handleAddReminder = () => {
    if (!formData.type || !formData.dueDate) return

    const dueDate = new Date(formData.dueDate)
    const today = new Date()
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    const reminderType = reminderTypes.find((type) => type.value === formData.type)
    const priority: "high" | "medium" | "low" = daysLeft <= 14 ? "high" : daysLeft <= 30 ? "medium" : "low"

    const newReminder: Reminder = {
      id: reminders.length + 1,
      type: formData.type,
      title: reminderType?.label || "Reminder",
      vehicleReg: formData.vehicleReg || undefined,
      dueDate: formData.dueDate,
      notifyDays: Number.parseInt(formData.notifyDays),
      daysLeft,
      priority,
    }

    setReminders([...reminders, newReminder])
    setFormData({ type: "", vehicleReg: "", dueDate: "", notifyDays: "30" })
    setShowAddForm(false)
  }

  const handleDeleteReminder = (id: number) => {
    setReminders(reminders.filter((reminder) => reminder.id !== id))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB")
  }

  return (
    <div className="flex flex-col items-center h-full p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 mt-8">
        <h2 className="text-2xl font-bold">Reminders</h2>
        <p className="text-muted-foreground">Manage your MOT, tax, insurance and fine payment reminders</p>
      </div>

      {/* Add Reminder Section */}
      <div className="w-full max-w-2xl">
        {!showAddForm ? (
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Add New Reminder</h3>
              <p className="text-muted-foreground text-center mb-4">
                Set up notifications for important dates and deadlines
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Reminder
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create New Reminder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Reminder Type</Label>
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
                  <Label htmlFor="vehicleReg">Vehicle Registration (Optional)</Label>
                  <Input
                    id="vehicleReg"
                    placeholder="AB12 CDE"
                    value={formData.vehicleReg}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleReg: e.target.value.toUpperCase().replace(/\s/g, "") })
                    }
                    maxLength={7}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days before</SelectItem>
                      <SelectItem value="14">14 days before</SelectItem>
                      <SelectItem value="30">30 days before</SelectItem>
                      <SelectItem value="60">60 days before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddReminder} disabled={!formData.type || !formData.dueDate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Current Reminders */}
      {reminders.length > 0 && (
        <div className="w-full max-w-4xl space-y-4">
          <h3 className="text-xl font-semibold text-center">Your Active Reminders</h3>
          <div className="grid gap-4">
            {reminders
              .sort((a, b) => a.daysLeft - b.daysLeft)
              .map((reminder) => {
                const ReminderIcon = reminderTypes.find((type) => type.value === reminder.type)?.icon || Bell
                return (
                  <Card key={reminder.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <ReminderIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              {reminder.title}
                              {reminder.vehicleReg && (
                                <span className="text-muted-foreground ml-2">({reminder.vehicleReg})</span>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground">Due: {formatDate(reminder.dueDate)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <Badge variant={getPriorityColor(reminder.priority)}>
                              {reminder.daysLeft > 0 ? `${reminder.daysLeft} days left` : "Overdue"}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Notify {reminder.notifyDays} days before
                            </p>
                          </div>

                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteReminder(reminder.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {reminders.length === 0 && !showAddForm && (
        <div className="text-center space-y-4 mt-8">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No Reminders Set</h3>
            <p className="text-muted-foreground">Create your first reminder to get started</p>
          </div>
        </div>
      )}
    </div>
  )
}

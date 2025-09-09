import { NextRequest, NextResponse } from "next/server"
import { ReminderService } from "@/lib/reminder-service"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Define valid reminder types
const VALID_REMINDER_TYPES = [
  'MOT_TEST', 'VEHICLE_TAX', 'INSURANCE', 'SERVICE', 'FINE_PAYMENT', 'APPEAL_DEADLINE', 'OTHER'
] as const

type ValidReminderType = typeof VALID_REMINDER_TYPES[number]

// GET /api/reminders - Get user's reminders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const reminders = await ReminderService.getUserReminders(userId)
    
    return NextResponse.json({ 
      success: true,
      data: reminders 
    })
  } catch (error) {
    console.error("Error fetching reminders:", error)
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    )
  }
}

// POST /api/reminders - Create new reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      vehicleReg,
      reminderType,
      title,
      description,
      dueDate,
      notifyDays,
      make,
      model,
      year,
      isRecurring,
      recurringInterval,
      email
    } = body

    // Validate required fields
    if (!userId || !vehicleReg || !reminderType || !title || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate reminder type
    if (!VALID_REMINDER_TYPES.includes(reminderType as ValidReminderType)) {
      return NextResponse.json(
        { error: "Invalid reminder type" },
        { status: 400 }
      )
    }

    // If email is provided, update user's email for notifications
    if (email && email.includes('@')) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { email: email }
        })
      } catch (error) {
        console.log('Could not update user email:', error)
        // Don't fail the reminder creation if email update fails
      }
    }

    const reminder = await ReminderService.createReminder({
      userId,
      vehicleReg,
      reminderType: reminderType as ValidReminderType,
      title,
      description,
      dueDate: new Date(dueDate),
      notifyDays: notifyDays !== undefined ? notifyDays : 30,
      make,
      model,
      year,
      isRecurring,
      recurringInterval
    })

    return NextResponse.json({ 
      success: true,
      data: reminder 
    })
  } catch (error) {
    console.error("Error creating reminder:", error)
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    )
  }
}

// DELETE /api/reminders - Delete reminder
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reminderId = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!reminderId || !userId) {
      return NextResponse.json(
        { error: "Reminder ID and User ID are required" },
        { status: 400 }
      )
    }

    await ReminderService.deleteReminder(reminderId, userId)

    return NextResponse.json({ 
      success: true,
      message: "Reminder deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting reminder:", error)
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    )
  }
}

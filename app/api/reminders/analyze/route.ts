import { NextRequest, NextResponse } from "next/server"
import { ReminderService } from "@/lib/reminder-service"

// POST /api/reminders/analyze - Analyze vehicle data and create suggestions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vehicleData } = body

    if (!userId || !vehicleData) {
      return NextResponse.json(
        { error: "User ID and vehicle data are required" },
        { status: 400 }
      )
    }

    const suggestions = await ReminderService.analyzeAndSuggestReminders(userId, vehicleData)
    
    return NextResponse.json({ 
      success: true,
      data: suggestions,
      message: `Generated ${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'}` 
    })
  } catch (error) {
    console.error("Error analyzing vehicle data:", error)
    return NextResponse.json(
      { error: "Failed to analyze vehicle data" },
      { status: 500 }
    )
  }
}

// POST /api/reminders/create-from-vehicle - Create reminder directly from vehicle data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vehicleData, reminderType } = body

    if (!userId || !vehicleData || !reminderType) {
      return NextResponse.json(
        { error: "User ID, vehicle data, and reminder type are required" },
        { status: 400 }
      )
    }

    if (reminderType !== 'MOT' && reminderType !== 'TAX') {
      return NextResponse.json(
        { error: "Reminder type must be 'MOT' or 'TAX'" },
        { status: 400 }
      )
    }

    const reminder = await ReminderService.createReminderFromVehicleData(
      userId, 
      vehicleData, 
      reminderType
    )
    
    return NextResponse.json({ 
      success: true,
      data: reminder,
      message: `${reminderType} reminder created successfully` 
    })
  } catch (error) {
    console.error("Error creating reminder from vehicle data:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create reminder" },
      { status: 500 }
    )
  }
}

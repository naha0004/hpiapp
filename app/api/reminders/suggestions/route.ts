import { NextRequest, NextResponse } from "next/server"
import { ReminderService } from "@/lib/reminder-service"

// GET /api/reminders/suggestions - Get user's suggestions
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

    const suggestions = await ReminderService.getUserSuggestions(userId)
    
    return NextResponse.json({ 
      success: true,
      data: suggestions 
    })
  } catch (error) {
    console.error("Error fetching suggestions:", error)
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    )
  }
}

// POST /api/reminders/suggestions - Accept suggestion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { suggestionId, action } = body

    if (!suggestionId || !action) {
      return NextResponse.json(
        { error: "Suggestion ID and action are required" },
        { status: 400 }
      )
    }

    let result
    if (action === 'accept') {
      result = await ReminderService.acceptSuggestion(suggestionId)
    } else if (action === 'dismiss') {
      result = await ReminderService.dismissSuggestion(suggestionId)
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'accept' or 'dismiss'" },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      data: result 
    })
  } catch (error) {
    console.error("Error handling suggestion:", error)
    return NextResponse.json(
      { error: "Failed to handle suggestion" },
      { status: 500 }
    )
  }
}

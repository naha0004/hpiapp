import { NextRequest, NextResponse } from "next/server"
import { ReminderService } from "@/lib/reminder-service"

// GET /api/reminders/notifications - Get pending notifications (for background service)
export async function GET(request: NextRequest) {
  try {
    const notifications = await ReminderService.getPendingNotifications()
    
    return NextResponse.json({ 
      success: true,
      data: notifications,
      count: notifications.length
    })
  } catch (error) {
    console.error("Error fetching pending notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch pending notifications" },
      { status: 500 }
    )
  }
}

// POST /api/reminders/notifications - Process and send notifications using Resend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if this is a single notification update (legacy support)
    if (body.notificationId) {
      const { notificationId, success, error } = body

      if (!notificationId || success === undefined) {
        return NextResponse.json(
          { error: "Notification ID and success status are required" },
          { status: 400 }
        )
      }

      await ReminderService.markNotificationSent(notificationId, success, error)

      return NextResponse.json({ 
        success: true,
        message: "Notification status updated" 
      })
    }
    
    // Process all pending notifications with Resend
    const results = await ReminderService.processNotifications()
    
    return NextResponse.json({ 
      success: true,
      message: `Processed ${results.processed} notifications`,
      data: results
    })
  } catch (error) {
    console.error("Error processing notifications:", error)
    return NextResponse.json(
      { error: "Failed to process notifications" },
      { status: 500 }
    )
  }
}

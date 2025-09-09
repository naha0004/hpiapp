import { NextRequest, NextResponse } from "next/server"
import { ReminderService } from "@/lib/reminder-service"

// POST /api/reminders/cron - Cron job endpoint to process notifications
export async function POST(request: NextRequest) {
  try {
    console.log('🕐 Cron job started: Processing reminders...')
    
    // Process all pending notifications
    const results = await ReminderService.processNotifications()
    
    console.log('✅ Cron job completed:', results)
    
    return NextResponse.json({ 
      success: true,
      message: `Cron job completed: Processed ${results.processed} notifications`,
      timestamp: new Date().toISOString(),
      data: results
    })
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json(
      { error: "Cron job failed", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/reminders/cron - Get cron job status and pending notifications
export async function GET() {
  try {
    const notifications = await ReminderService.getPendingNotifications()
    
    return NextResponse.json({
      success: true,
      message: "Cron job endpoint ready",
      timestamp: new Date().toISOString(),
      pendingNotifications: notifications.length,
      data: notifications.map(n => ({
        id: n.id,
        type: n.reminder.reminderType,
        vehicleReg: n.reminder.vehicleReg,
        notifyDate: n.notifyDate,
        dueDate: n.reminder.dueDate,
        userEmail: n.reminder.user?.email
      }))
    })
  } catch (error) {
    console.error("Error getting cron status:", error)
    return NextResponse.json(
      { error: "Failed to get cron status" },
      { status: 500 }
    )
  }
}

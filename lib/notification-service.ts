/**
 * Notification Background Service
 * Processes pending reminder notifications and sends emails
 */

export class NotificationService {
  private static isRunning = false
  private static intervalId: NodeJS.Timeout | null = null

  /**
   * Start the notification processing service
   */
  static start(intervalMinutes: number = 30) {
    if (this.isRunning) {
      console.log('Notification service is already running')
      return
    }

    console.log('Starting notification service...')
    this.isRunning = true

    // Process notifications immediately
    this.processNotifications()

    // Set up recurring processing
    this.intervalId = setInterval(() => {
      this.processNotifications()
    }, intervalMinutes * 60 * 1000)

    console.log(`Notification service started, checking every ${intervalMinutes} minutes`)
  }

  /**
   * Stop the notification processing service
   */
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('Notification service stopped')
  }

  /**
   * Process pending notifications
   */
  private static async processNotifications() {
    try {
      console.log('Processing pending notifications...')
      
      // Fetch pending notifications
      const response = await fetch('/api/reminders/notifications')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const notifications = data.data || []

      if (notifications.length === 0) {
        console.log('No pending notifications to process')
        return
      }

      console.log(`Processing ${notifications.length} notification(s)`)

      for (const notification of notifications) {
        await this.processIndividualNotification(notification)
      }

      console.log('Finished processing notifications')
    } catch (error) {
      console.error('Error processing notifications:', error)
    }
  }

  /**
   * Process individual notification
   */
  private static async processIndividualNotification(notification: any) {
    try {
      const { id, reminder, method, subject, message } = notification
      let success = false
      let error = null

      if (method === 'EMAIL') {
        // Send email notification
        success = await this.sendEmailNotification(
          reminder.user.email,
          subject || `Reminder: ${reminder.title}`,
          this.generateEmailContent(reminder, message)
        )
      } else if (method === 'SYSTEM') {
        // For system notifications, we'll just mark as sent
        // In a real app, this might create in-app notifications
        success = true
      }

      // Update notification status
      await fetch('/api/reminders/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId: id,
          success,
          error
        })
      })

      console.log(`Notification ${id} processed: ${success ? 'SUCCESS' : 'FAILED'}`)
    } catch (err) {
      console.error(`Error processing notification ${notification.id}:`, err)
      
      // Mark as failed
      try {
        await fetch('/api/reminders/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            notificationId: notification.id,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        })
      } catch (updateErr) {
        console.error('Failed to update notification status:', updateErr)
      }
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(
    to: string, 
    subject: string, 
    content: string
  ): Promise<boolean> {
    try {
      // Check if email system is available
      const emailResponse = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          subject,
          text: content,
          html: this.generateEmailHtml(subject, content)
        })
      })

      return emailResponse.ok
    } catch (error) {
      console.error('Error sending email notification:', error)
      return false
    }
  }

  /**
   * Generate email content
   */
  private static generateEmailContent(reminder: any, message?: string): string {
    const dueDate = new Date(reminder.dueDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `
Dear Vehicle Owner,

This is a reminder about your upcoming deadline:

📋 Reminder: ${reminder.title}
🚗 Vehicle: ${reminder.vehicleReg || 'N/A'}
📅 Due Date: ${dueDate}
📝 Description: ${reminder.description || 'No additional details'}

${message || ''}

Important: Please ensure you complete this task before the due date to avoid any penalties or legal issues.

Need help? Contact us or visit gov.uk for official information.

Best regards,
Your Vehicle Reminder Service

---
This is an automated reminder. Please do not reply to this email.
    `.trim()
  }

  /**
   * Generate HTML email content
   */
  private static generateEmailHtml(subject: string, textContent: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .content { background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        .reminder-icon { font-size: 24px; }
        .due-date { background: #fef3c7; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔔 Vehicle Reminder</h1>
    </div>
    
    <div class="content">
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${textContent}</pre>
    </div>
    
    <div class="footer">
        <p>This is an automated reminder from your Vehicle Management System</p>
        <p>For support, please visit our help center or contact us directly</p>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Get service status
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.intervalId !== null
    }
  }
}

// Auto-start the service in production
if (process.env.NODE_ENV === 'production') {
  NotificationService.start(30) // Check every 30 minutes
} else if (process.env.NODE_ENV === 'development') {
  // In development, check more frequently
  NotificationService.start(5) // Check every 5 minutes
}

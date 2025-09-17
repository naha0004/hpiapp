/**
 * Resend Email Service
 * Handles MOT and tax reminder emails using Resend API
 */

import { Resend } from 'resend'

const resend = new Resend('re_RRLeGwJg_Gyzb2XF6u2icM9n61QcQ8yMv')

export interface ReminderEmailData {
  to: string
  userName?: string
  vehicleReg: string
  make?: string
  model?: string
  year?: number
  dueDate: Date
  reminderType: 'MOT_TEST' | 'VEHICLE_TAX'
  daysUntilDue: number
}

export class ResendEmailService {
  // Use admin@enmsservices.co.uk as the sender
  private static readonly FROM_EMAIL = 'admin@enmsservices.co.uk'
  private static readonly DOMAIN = 'enmsservices.co.uk'

  /**
   * Send MOT reminder email
   */
  static async sendMOTReminder(data: ReminderEmailData): Promise<boolean> {
    try {
      const subject = `MOT Reminder: ${data.vehicleReg} - ${data.daysUntilDue} days remaining`
      const htmlContent = this.generateMOTEmailHTML(data)
      const textContent = this.generateMOTEmailText(data)

      const result = await resend.emails.send({
        from: this.FROM_EMAIL,
        to: [data.to],
        subject,
        html: htmlContent,
        text: textContent,
      })

      console.log('MOT reminder email sent:', result)
      return true
    } catch (error) {
      console.error('Failed to send MOT reminder email:', error)
      return false
    }
  }

  /**
   * Send Vehicle Tax reminder email
   */
  static async sendTaxReminder(data: ReminderEmailData): Promise<boolean> {
    try {
      const subject = `Vehicle Tax Reminder: ${data.vehicleReg} - ${data.daysUntilDue} days remaining`
      const htmlContent = this.generateTaxEmailHTML(data)
      const textContent = this.generateTaxEmailText(data)

      const result = await resend.emails.send({
        from: this.FROM_EMAIL,
        to: [data.to],
        subject,
        html: htmlContent,
        text: textContent,
      })

      console.log('Tax reminder email sent:', result)
      return true
    } catch (error) {
      console.error('Failed to send tax reminder email:', error)
      return false
    }
  }

  /**
   * Send reminder email (generic method that routes to specific handlers)
   */
  static async sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
    try {
      if (data.reminderType === 'MOT_TEST') {
        return await this.sendMOTReminder(data)
      } else if (data.reminderType === 'VEHICLE_TAX') {
        return await this.sendTaxReminder(data)
      } else {
        console.error('Unsupported reminder type:', data.reminderType)
        return false
      }
    } catch (error) {
      console.error('Failed to send reminder email:', error)
      return false
    }
  }

  /**
   * Generate MOT reminder HTML email content
   */
  private static generateMOTEmailHTML(data: ReminderEmailData): string {
    const vehicleDescription = data.make && data.model 
      ? `${data.make} ${data.model} (${data.year || 'Unknown Year'})`
      : data.vehicleReg

    const urgencyClass = data.daysUntilDue <= 7 ? 'urgent' : 'normal'
    const urgencyMessage = data.daysUntilDue <= 7 
      ? '⚠️ URGENT - Book your MOT test now!'
      : '📅 Time to book your MOT test'

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MOT Reminder - ${data.vehicleReg}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .urgent { color: #e74c3c; font-weight: bold; }
          .normal { color: #27ae60; font-weight: bold; }
          .vehicle-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0066cc; }
          .cta-button { display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚗 MOT Test Reminder</h1>
          <p>Traffic Appeal AI - Vehicle Services</p>
        </div>
        
        <div class="content">
          <p>Hello ${data.userName || 'Vehicle Owner'},</p>
          
          <p class="${urgencyClass}">${urgencyMessage}</p>
          
          <div class="vehicle-info">
            <h3>📋 Vehicle Details</h3>
            <p><strong>Registration:</strong> ${data.vehicleReg}</p>
            <p><strong>Vehicle:</strong> ${vehicleDescription}</p>
            <p><strong>MOT Due:</strong> ${data.dueDate.toLocaleDateString('en-GB')}</p>
            <p><strong>Days Remaining:</strong> ${data.daysUntilDue} days</p>
          </div>
          
          <p><strong>Important:</strong> Your MOT certificate expires in ${data.daysUntilDue} days. You can book your MOT test up to a month before it expires and keep the same expiry date.</p>
          
          <h3>📝 What you need to do:</h3>
          <ul>
            <li>Book your MOT test at an authorized test center</li>
            <li>Ensure your vehicle is roadworthy before the test</li>
            <li>Bring your current MOT certificate (if available)</li>
            <li>Have your V5C registration document ready</li>
          </ul>
          
          <a href="https://www.gov.uk/getting-an-mot" class="cta-button">Find MOT Test Centers 🔍</a>
          
          <p><em>💡 Pro tip: If your MOT expires, you could face a fine of up to £1,000 for driving without a valid MOT certificate.</em></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p><strong>Need help with traffic fines or appeals?</strong><br>
          Visit our main service at <a href="https://enmsservices.co.uk">Traffic Appeal AI</a> for expert assistance with parking tickets, speeding fines, and other traffic-related matters.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from Traffic Appeal AI<br>
          <a href="https://enmsservices.co.uk">enmsservices.co.uk</a></p>
          <p>You're receiving this because you requested MOT reminders for your vehicle.</p>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate MOT reminder text email content
   */
  private static generateMOTEmailText(data: ReminderEmailData): string {
    const vehicleDescription = data.make && data.model 
      ? `${data.make} ${data.model} (${data.year || 'Unknown Year'})`
      : data.vehicleReg

    return `
MOT TEST REMINDER - ${data.vehicleReg}

Hello ${data.userName || 'Vehicle Owner'},

Your MOT certificate expires in ${data.daysUntilDue} days!

Vehicle Details:
- Registration: ${data.vehicleReg}
- Vehicle: ${vehicleDescription}  
- MOT Due: ${data.dueDate.toLocaleDateString('en-GB')}
- Days Remaining: ${data.daysUntilDue} days

What you need to do:
1. Book your MOT test at an authorized test center
2. Ensure your vehicle is roadworthy before the test
3. Bring your current MOT certificate (if available)
4. Have your V5C registration document ready

Find MOT test centers: https://www.gov.uk/getting-an-mot

Important: If your MOT expires, you could face a fine of up to £1,000 for driving without a valid MOT certificate.

Need help with traffic fines or appeals? 
Visit Traffic Appeal AI: https://enmsservices.co.uk

---
Traffic Appeal AI - Vehicle Services
This is an automated reminder. You're receiving this because you requested MOT reminders for your vehicle.
    `.trim()
  }

  /**
   * Generate Tax reminder HTML email content
   */
  private static generateTaxEmailHTML(data: ReminderEmailData): string {
    const vehicleDescription = data.make && data.model 
      ? `${data.make} ${data.model} (${data.year || 'Unknown Year'})`
      : data.vehicleReg

    const urgencyClass = data.daysUntilDue <= 7 ? 'urgent' : 'normal'
    const urgencyMessage = data.daysUntilDue <= 7 
      ? '⚠️ URGENT - Renew your vehicle tax now!'
      : '💰 Time to renew your vehicle tax'

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vehicle Tax Reminder - ${data.vehicleReg}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5f2d; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .urgent { color: #e74c3c; font-weight: bold; }
          .normal { color: #27ae60; font-weight: bold; }
          .vehicle-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2c5f2d; }
          .cta-button { display: inline-block; background: #2c5f2d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💰 Vehicle Tax Reminder</h1>
          <p>Traffic Appeal AI - Vehicle Services</p>
        </div>
        
        <div class="content">
          <p>Hello ${data.userName || 'Vehicle Owner'},</p>
          
          <p class="${urgencyClass}">${urgencyMessage}</p>
          
          <div class="vehicle-info">
            <h3>📋 Vehicle Details</h3>
            <p><strong>Registration:</strong> ${data.vehicleReg}</p>
            <p><strong>Vehicle:</strong> ${vehicleDescription}</p>
            <p><strong>Tax Due:</strong> ${data.dueDate.toLocaleDateString('en-GB')}</p>
            <p><strong>Days Remaining:</strong> ${data.daysUntilDue} days</p>
          </div>
          
          <p><strong>Important:</strong> Your vehicle tax expires in ${data.daysUntilDue} days. You can renew your tax online, by phone, or at a Post Office.</p>
          
          <h3>📝 How to renew your vehicle tax:</h3>
          <ul>
            <li><strong>Online:</strong> Use the DVLA website (fastest option)</li>
            <li><strong>Phone:</strong> Call 0300 123 4321</li>
            <li><strong>Post Office:</strong> Visit your local branch</li>
            <li><strong>DVLA Office:</strong> Visit a local DVLA office</li>
          </ul>
          
          <h3>📄 You'll need:</h3>
          <ul>
            <li>Your vehicle registration number</li>
            <li>Valid MOT certificate (if your vehicle needs one)</li>
            <li>Valid insurance certificate</li>
            <li>Payment method (debit/credit card, Direct Debit)</li>
          </ul>
          
          <a href="https://www.gov.uk/vehicle-tax" class="cta-button">Renew Vehicle Tax Online 💻</a>
          
          <p><em>💡 Pro tip: Driving without valid tax could result in a fine and your vehicle being wheel-clamped, impounded or even destroyed.</em></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p><strong>Need help with traffic fines or appeals?</strong><br>
          Visit our main service at <a href="https://enmsservices.co.uk">Traffic Appeal AI</a> for expert assistance with parking tickets, speeding fines, and other traffic-related matters.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from Traffic Appeal AI<br>
          <a href="https://enmsservices.co.uk">enmsservices.co.uk</a></p>
          <p>You're receiving this because you requested vehicle tax reminders for your vehicle.</p>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate Tax reminder text email content
   */
  private static generateTaxEmailText(data: ReminderEmailData): string {
    const vehicleDescription = data.make && data.model 
      ? `${data.make} ${data.model} (${data.year || 'Unknown Year'})`
      : data.vehicleReg

    return `
VEHICLE TAX REMINDER - ${data.vehicleReg}

Hello ${data.userName || 'Vehicle Owner'},

Your vehicle tax expires in ${data.daysUntilDue} days!

Vehicle Details:
- Registration: ${data.vehicleReg}
- Vehicle: ${vehicleDescription}
- Tax Due: ${data.dueDate.toLocaleDateString('en-GB')}
- Days Remaining: ${data.daysUntilDue} days

How to renew your vehicle tax:
- Online: https://www.gov.uk/vehicle-tax (fastest option)
- Phone: 0300 123 4321
- Post Office: Visit your local branch
- DVLA Office: Visit a local DVLA office

You'll need:
- Your vehicle registration number
- Valid MOT certificate (if your vehicle needs one)
- Valid insurance certificate
- Payment method (debit/credit card, Direct Debit)

Important: Driving without valid tax could result in a fine and your vehicle being wheel-clamped, impounded or even destroyed.

Need help with traffic fines or appeals?
Visit Traffic Appeal AI: https://enmsservices.co.uk

---
Traffic Appeal AI - Vehicle Services
This is an automated reminder. You're receiving this because you requested vehicle tax reminders for your vehicle.
    `.trim()
  }

  /**
   * Test the email service
   */
  static async testEmail(to: string): Promise<boolean> {
    try {
      const result = await resend.emails.send({
        from: this.FROM_EMAIL,
        to: [to],
        subject: 'Test Email - Traffic Appeal AI Reminders',
        html: `
          <h1>Test Email</h1>
          <p>This is a test email from Traffic Appeal AI reminder service.</p>
          <p>If you receive this, the email service is working correctly!</p>
          <p>Domain: ${this.DOMAIN}</p>
          <p>From: ${this.FROM_EMAIL}</p>
        `,
        text: 'Test email from Traffic Appeal AI reminder service. If you receive this, the email service is working correctly!'
      })

      console.log('Test email sent:', result)
      return true
    } catch (error) {
      console.error('Failed to send test email:', error)
      return false
    }
  }
}

import nodemailer from "nodemailer"

const emailPort = Number(process.env.EMAIL_SERVER_PORT)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: emailPort,
  secure: emailPort === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    })

    console.log("Email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email sending failed:", error)
    return { success: false, error }
  }
}

export function generateAppealSubmissionEmail(userName: string, appealId: string): EmailOptions {
  return {
    to: "", // Will be set by the caller
    subject: "Appeal Submitted Successfully - ClearRideAI",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
          <h1>ClearRideAI</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Appeal Submitted Successfully</h2>
          <p>Hi ${userName},</p>
          <p>Your fine appeal has been submitted successfully and is now under review.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Appeal Reference:</strong> ${appealId}
          </div>
          <p>We will review your appeal and get back to you within 5-7 business days. You can track the status of your appeal in your dashboard.</p>
          <p>Best regards,<br>The ClearRideAI Team</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2024 ClearRideAI. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Hi ${userName}, Your fine appeal has been submitted successfully and is now under review. Appeal Reference: ${appealId}. We will review your appeal and get back to you within 5-7 business days.`,
  }
}

export function generateHPICheckCompleteEmail(userName: string, registration: string): EmailOptions {
  return {
    to: "", // Will be set by the caller
    subject: "HPI Check Complete - ClearRideAI",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
          <h1>ClearRideAI</h1>
        </div>
        <div style="padding: 20px;">
          <h2>HPI Check Complete</h2>
          <p>Hi ${userName},</p>
          <p>Your HPI check for vehicle <strong>${registration}</strong> has been completed.</p>
          <p>You can view the full report in your dashboard.</p>
          <p>Best regards,<br>The ClearRideAI Team</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2024 ClearRideAI. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Hi ${userName}, Your HPI check for vehicle ${registration} has been completed. You can view the full report in your dashboard.`,
  }
}

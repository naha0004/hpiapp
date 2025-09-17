import { prisma } from "./prisma"
import { sendEmail } from "./email"

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, {
  code: string
  expires: Date
  type: 'email' | 'sms'
  attempts: number
}>()

// Generate random 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send email verification code
async function sendEmailVerificationCode(email: string): Promise<boolean> {
  try {
    const code = generateVerificationCode()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    // Store code
    verificationCodes.set(email, {
      code,
      expires,
      type: 'email',
      attempts: 0
    })
    
    // Send email
    await sendEmail({
      to: email,
      subject: 'ClearRideAI Admin Access Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Admin Access Verification</h2>
          <p>Your admin access verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #dc2626; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request admin access, please ignore this email.</p>
        </div>
      `
    })
    
    return true
  } catch (error) {
    console.error('Failed to send email verification:', error)
    return false
  }
}

// Send SMS verification code (would need SMS service like Twilio)
async function sendSMSVerificationCode(phone: string): Promise<boolean> {
  try {
    const code = generateVerificationCode()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    // Store code
    verificationCodes.set(phone, {
      code,
      expires,
      type: 'sms',
      attempts: 0
    })
    
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    // For now, just log the code (remove in production!)
    console.log(`SMS Code for ${phone}: ${code}`)
    
    // Example Twilio integration:
    /*
    const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
    await twilio.messages.create({
      body: `Your ClearRideAI admin access code is: ${code}`,
      from: process.env.TWILIO_PHONE,
      to: phone
    })
    */
    
    return true
  } catch (error) {
    console.error('Failed to send SMS verification:', error)
    return false
  }
}

// Verify code
async function verifyCode(identifier: string, inputCode: string): Promise<boolean> {
  const stored = verificationCodes.get(identifier)
  
  if (!stored) {
    return false
  }
  
  // Check if expired
  if (stored.expires < new Date()) {
    verificationCodes.delete(identifier)
    return false
  }
  
  // Check attempts
  if (stored.attempts >= 3) {
    verificationCodes.delete(identifier)
    return false
  }
  
  // Check code
  if (stored.code !== inputCode) {
    stored.attempts++
    return false
  }
  
  // Code is correct - clean up
  verificationCodes.delete(identifier)
  return true
}

export {
  sendEmailVerificationCode,
  sendSMSVerificationCode,
  verifyCode
}

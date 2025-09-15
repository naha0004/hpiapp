import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createRegularTestUser() {
  try {
    // Regular test user credentials
    const testEmail = 'user@test.com'
    const testPassword = 'user123'
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail }
    })
    
    if (existingUser) {
      console.log('✅ Regular test user already exists')
      console.log('Email:', testEmail)
      console.log('Password:', testPassword)
      return
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(testPassword, 12)
    
    // Create regular test user
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: 'Test User',
        isActive: true,
        subscriptionType: 'FREE_TRIAL',
        emailVerified: new Date(), // Mark as verified
        hpiCredits: 3, // Give some free HPI credits
      }
    })
    
    console.log('🎉 Regular test user created successfully!')
    console.log('Email:', testEmail)
    console.log('Password:', testPassword)
    console.log('User ID:', user.id)
    
  } catch (error) {
    console.error('❌ Error creating regular test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createRegularTestUser()

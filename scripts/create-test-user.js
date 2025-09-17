import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Test admin credentials
    const testEmail = 'test@admin.com'
    const testPassword = 'admin123'
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail }
    })
    
    if (existingUser) {
      console.log('✅ Test user already exists')
      console.log('Email:', testEmail)
      console.log('Password:', testPassword)
      return
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(testPassword, 12)
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: 'Test Admin',
        isActive: true,
        subscriptionType: 'FREE_TRIAL',
        emailVerified: new Date(), // Mark as verified
      }
    })
    
    console.log('🎉 Test user created successfully!')
    console.log('Email:', testEmail)
    console.log('Password:', testPassword)
    console.log('User ID:', user.id)
    
  } catch (error) {
    console.error('❌ Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()

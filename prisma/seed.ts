import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'test@admin.com' },
    update: {},
    create: {
      email: 'test@admin.com',
      name: 'Admin User',
      password: adminPassword,
      phone: '+447123456789',
      address: 'Admin Address, London, UK',
      subscriptionType: 'ANNUAL_PLAN',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  })

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@clearrideai.com' },
    update: {},
    create: {
      email: 'test@clearrideai.com',
      name: 'Test User',
      password: hashedPassword,
      phone: '+44 7123 456789',
      address: '123 Test Street, London, UK',
      subscriptionType: 'FREE_TRIAL',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  })

  // Create test vehicle
  const testVehicle = await prisma.vehicle.create({
    data: {
      userId: testUser.id,
      registration: 'AB12 CDE',
      make: 'Ford',
      model: 'Focus',
      year: 2020,
      color: 'Blue',
    },
  })

  // Create test appeal
  const testAppeal = await prisma.appeal.create({
    data: {
      userId: testUser.id,
      vehicleId: testVehicle.id,
      ticketNumber: 'PCN123456',
      fineAmount: 65.00,
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      location: 'High Street, London',
      reason: 'Parking meter malfunction',
      description: 'The parking meter was out of order and not accepting payments. I have evidence of this.',
      evidence: null,
      status: 'SUBMITTED',
    },
  })

  // Create test HPI check
  const testHPICheck = await prisma.hPICheck.create({
    data: {
      userId: testUser.id,
      vehicleId: testVehicle.id,
      registration: 'AB12 CDE',
      status: 'COMPLETED',
      completedDate: new Date(),
      results: {
        registration: 'AB12 CDE',
        stolen: false,
        writeOff: false,
        mileageDiscrepancy: false,
        outstandingFinance: false,
        previousOwners: 2,
        lastMOT: new Date('2023-12-15'),
        taxStatus: 'Taxed',
        insuranceGroup: 15,
      },
      cost: 5.00,
    },
  })

  // Create test payment
  const testPayment = await prisma.payment.create({
    data: {
      userId: testUser.id,
      amount: 5.00,
      currency: 'GBP',
      status: 'COMPLETED',
      type: 'HPI_CHECK',
      description: 'HPI Check for AB12 CDE',
    },
  })

  console.log('Database seeded successfully!')
  console.log('Test user:', testUser.email)
  console.log('Test vehicle:', testVehicle.registration)
  console.log('Test appeal:', testAppeal.ticketNumber)
  console.log('Test HPI check:', testHPICheck.id)
  console.log('Test payment:', testPayment.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"
import { prisma } from "./prisma"

// Single admin configuration - ONLY YOUR EMAIL AND PHONE
// TEST CREDENTIALS - Replace with your actual details later
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'test@admin.com'
const ADMIN_PHONE = process.env.ADMIN_PHONE || '+447123456789'

// Normalize phone number format (remove spaces, hyphens, etc.)
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '')
}

export async function isAdmin(email?: string | null, phone?: string | null): Promise<boolean> {
  // Check if email matches YOUR admin email
  if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return true
  }
  
  // Check if phone matches YOUR admin phone
  if (phone && normalizePhone(phone) === normalizePhone(ADMIN_PHONE)) {
    return true
  }
  
  return false
}

export async function requireAdmin(req: any, res: any) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  // Get user phone from database if needed
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { phone: true }
  })
  
  if (!await isAdmin(session.user.email, user?.phone)) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  return session
}

export async function getAdminSession() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return null
  }
  
  // Get user phone from database if needed
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { phone: true }
  })
  
  if (!await isAdmin(session.user.email, user?.phone)) {
    return null
  }
  
  return session
}

// Enhanced admin permissions
export enum AdminPermission {
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  VIEW_APPEALS = 'view_appeals',
  MANAGE_APPEALS = 'manage_appeals',
  VIEW_PAYMENTS = 'view_payments',
  MANAGE_PAYMENTS = 'manage_payments',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SYSTEM = 'manage_system',
  SUPER_ADMIN = 'super_admin'
}

// Single admin permissions - YOU have ALL permissions
const ADMIN_PERMISSIONS = Object.values(AdminPermission) // Full access

export async function hasPermission(email: string, permission: AdminPermission, phone?: string | null): Promise<boolean> {
  // If you're the admin, you have ALL permissions
  return await isAdmin(email, phone)
}

export async function requirePermission(permission: AdminPermission) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    throw new Error(`Unauthorized: Missing permission ${permission}`)
  }
  
  // Get user phone from database if needed
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { phone: true }
  })
  
  if (!await hasPermission(session.user.email, permission, user?.phone)) {
    throw new Error(`Unauthorized: Missing permission ${permission}`)
  }
  
  return session
}

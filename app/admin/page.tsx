import { requirePermission, AdminPermission } from "@/lib/admin-auth"
import { AdminDashboard } from "@/components/admin-dashboard"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  try {
    await requirePermission(AdminPermission.MANAGE_USERS)
  } catch (error) {
    redirect('/api/auth/signin?callbackUrl=/admin')
  }

  return <AdminDashboard />
}

export const metadata = {
  title: 'Admin Dashboard - ClearRideAI',
  description: 'Secure admin panel for managing users, appeals, and analytics',
}

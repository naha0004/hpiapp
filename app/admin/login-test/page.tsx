import { requirePermission, AdminPermission } from "@/lib/admin-auth"
import { AdminDashboard } from "@/components/admin-dashboard"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  try {
    // This requires actual authentication and admin permission
    await requirePermission(AdminPermission.MANAGE_USERS)
  } catch (error) {
    // Redirect to sign-in if not authenticated or not admin
    redirect('/api/auth/signin?callbackUrl=/admin')
  }

  return <AdminDashboard />
}

export const metadata = {
  title: 'Admin Dashboard - ClearRideAI',
  description: 'Secure admin panel for managing users, appeals, and analytics',
}

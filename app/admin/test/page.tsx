import { requirePermission, AdminPermission } from "@/lib/admin-auth"
import { AdminDashboard } from "@/components/admin-dashboard-test"
import { redirect } from "next/navigation"

export default async function AdminTestPage() {
  // TEMPORARY: Skip auth check for testing
  // TODO: Remove this bypass after testing and use proper auth
  
  console.log("⚠️  ADMIN TEST MODE - Authentication bypassed for testing!")
  
  // Uncomment this line after testing to enable proper authentication:
  // try {
  //   await requirePermission(AdminPermission.MANAGE_USERS)
  // } catch (error) {
  //   redirect('/api/auth/signin?callbackUrl=/admin/test')
  // }

  return (
    <div>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            ⚠️
          </div>
          <div className="ml-3">
            <p className="text-sm">
              <strong>TEST MODE:</strong> Authentication is bypassed. This is for testing only. 
              Remove this bypass before production!
            </p>
          </div>
        </div>
      </div>
      <AdminDashboard />
    </div>
  )
}

export const metadata = {
  title: 'Admin Test Dashboard - ClearRideAI',
  description: 'TEST VERSION - Admin panel for testing purposes',
}

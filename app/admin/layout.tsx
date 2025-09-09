import { requirePermission, AdminPermission } from "@/lib/admin-auth"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requirePermission(AdminPermission.VIEW_USERS)
  } catch (error) {
    redirect('/api/auth/signin?callbackUrl=/admin')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">ClearRideAI Admin</h2>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Super Admin Panel
            </span>
          </div>
        </div>
      </div>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

export const metadata = {
  title: 'Admin Panel - ClearRideAI',
  description: 'Secure administrative interface',
}

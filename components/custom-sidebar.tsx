"use client"

import { Car, FileText, Search, Bell, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

const menuItems = [
  {
    title: "Appeals",
    icon: FileText,
    id: "appeals",
  },
  {
    title: "MOT Checks",
    icon: Car,
    id: "vehicle-checks",
  },
  {
    title: "Reminders",
    icon: Bell,
    id: "reminders",
  },
  {
    title: "Settings",
    icon: Settings,
    id: "settings",
  },
]

interface CustomSidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
  isOpen: boolean
  onClose: () => void
}

export function CustomSidebar({ activeSection, setActiveSection, isOpen, onClose }: CustomSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Car className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">ClearRideAI</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.title}
              </Button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  )
}

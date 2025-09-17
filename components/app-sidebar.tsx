"use client"

import { Home, Car, FileText, Search, Bell, Settings, LogOut, Shield, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    id: "dashboard",
  },
  {
    title: "Appeals",
    icon: FileText,
    id: "appeals",
  },
  {
    title: "MOT Checks",
    url: "/vehicle-checks",
    id: "vehicle-checks",
    icon: Car,
  },
  {
    title: "HPI Checks",
    icon: Shield,
    id: "hpi-checks",
    highlight: true,
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

interface AppSidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
  isOpen: boolean
  onClose: () => void
}

export function AppSidebar({ activeSection, setActiveSection, isOpen, onClose }: AppSidebarProps) {
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
          <Image 
            src="/clearrideai-logo.svg" 
            alt="ClearRideAI Logo" 
            width={32} 
            height={32} 
            className="w-8 h-8"
          />
          <span className="text-lg font-semibold">ClearRideAI</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  item.highlight && "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                )}
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.title}
                {item.highlight && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    New
                  </span>
                )}
              </Button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-2">
          {/* Legal Links */}
          <div className="space-y-1">
            <Link href="/terms" target="_blank">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground">
                <Scale className="h-3 w-3 mr-2" />
                Terms & Conditions
              </Button>
            </Link>
            <Link href="/privacy" target="_blank">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground">
                <Shield className="h-3 w-3 mr-2" />
                Privacy Policy
              </Button>
            </Link>
          </div>
          
          {/* Logout */}
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

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Appeals } from "@/components/appeals"
import { MOTChecks } from "@/components/vehicle-checks"
import HPIChecksPage from "@/components/hpi-checks"
import { Reminders } from "@/components/reminders"
import { Settings } from "@/components/settings"
import { LandingPage } from "@/components/landing-page"
import { AuthModal } from "@/components/auth-modal"
import { UserDashboard } from "@/components/user-dashboard"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Menu, X, AlertTriangle } from "lucide-react"
import Image from "next/image"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [loginRequired, setLoginRequired] = useState(false)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  useEffect(() => {
    const loginParam = searchParams.get('login')
    const redirectParam = searchParams.get('redirect')
    
    if (loginParam === 'required') {
      setLoginRequired(true)
      setRedirectPath(redirectParam)
      setShowAuthModal(true)
      // Clean up URL parameters
      router.replace('/', undefined)
    }
  }, [searchParams, router])

  // Handle successful login with redirect
  useEffect(() => {
    if (session && redirectPath) {
      router.push(redirectPath as any)
      setRedirectPath(null)
      setLoginRequired(false)
    }
  }, [session, redirectPath, router])

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <UserDashboard onNavigate={setActiveSection} />
      case "appeals":
        return <Appeals />
      case "vehicle-checks":
        return <MOTChecks />
      case "hpi-checks":
        return <HPIChecksPage />
      case "reminders":
        return <Reminders />
      case "settings":
        return <Settings />
      default:
        return <UserDashboard onNavigate={setActiveSection} />
    }
  }

  const getSectionTitle = () => {
    switch (activeSection) {
      case "dashboard":
        return "Dashboard"
      case "appeals":
        return "Appeals"
      case "vehicle-checks":
        return "Vehicle Checks"
      case "hpi-checks":
        return "HPI Checks"
      case "reminders":
        return "Reminders"
      case "settings":
        return "Settings"
      default:
        return "Dashboard"
    }
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setSidebarOpen(false) // Close sidebar when section changes
  }

  const handleLogin = () => {
    setAuthMode("login")
    setShowAuthModal(true)
  }

  const handleSignUp = () => {
    setAuthMode("register")
    setShowAuthModal(true)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <>
        {loginRequired && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Please log in to access the appeals system.
              </AlertDescription>
            </Alert>
          </div>
        )}
        <LandingPage onLogin={handleLogin} onSignUp={handleSignUp} />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultTab={authMode}
        />
      </>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <AppSidebar
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-8 w-8">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Image 
            src="/clearrideai-logo.svg" 
            alt="ClearRideAI Logo" 
            width={24} 
            height={24} 
            className="w-6 h-6"
          />
          <h1 className="text-lg font-semibold truncate ml-2">{getSectionTitle()}</h1>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  )
}

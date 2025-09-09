"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { api, formatCurrency, formatDate } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Car, 
  FileText, 
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Calendar,
  Bell,
  Shield,
  Crown,
  CreditCard,
  Star
} from "lucide-react"

interface DashboardData {
  user: {
    name: string
    email: string
    createdAt: string
    hpiCredits?: number
  }
  appeals: {
    total: number
    pending: number
    approved: number
    rejected: number
    recent: any[]
  }
  vehicles: {
    total: number
    recent: any[]
  }
  hpiChecks: {
    total: number
    recent: any[]
  }
  stats: {
    totalSaved: number
    successRate: number
  }
}

interface UserDashboardProps {
  onNavigate: (section: string) => void
}

export function UserDashboard({ onNavigate }: UserDashboardProps) {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [userUsage, setUserUsage] = useState<any>(null)
  const [hpiCredits, setHpiCredits] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData()
      fetchUserUsage()
      fetchHpiCredits()
    }
  }, [session])

  const fetchHpiCredits = async () => {
    try {
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const data = await response.json()
        setHpiCredits(data.hpiCredits || 0)
      }
    } catch (error) {
      console.error('Error fetching HPI credits:', error)
    }
  }

  const fetchUserUsage = async () => {
    try {
      const response = await fetch('/api/user/usage')
      if (response.ok) {
        const data = await response.json()
        setUserUsage(data)
      }
    } catch (error) {
      console.error('Error fetching user usage:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const data = await api.get("/api/user/dashboard")
      setDashboardData(data)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Welcome to ClearRideAI!</h2>
        <p className="text-gray-600 mb-8">Get started by adding a vehicle or setting up reminders.</p>
        <div className="flex gap-4">
          <Button onClick={() => onNavigate("vehicle-checks")}>
            <Car className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
          <Button onClick={() => onNavigate("reminders")} variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Set Reminders
          </Button>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="default" className="bg-green-500">Approved</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>
      case "UNDER_REVIEW":
        return <Badge variant="secondary">Under Review</Badge>
      case "SUBMITTED":
        return <Badge variant="outline">Submitted</Badge>
      default:
        return <Badge variant="secondary">Draft</Badge>
    }
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {dashboardData.user.name}!</h1>
            <p className="text-gray-600">Here's your ClearRideAI dashboard overview</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Member since {formatDate(dashboardData.user.createdAt)}</p>
          </div>
        </div>

        {/* Payment Status */}
        {userUsage && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Pay-Per-Use Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                  <div>
                    <span className="font-semibold text-lg">HPI Credits Available</span>
                    <p className="text-sm text-gray-600">Use credits to perform HPI checks</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">{hpiCredits}</span>
                    <p className="text-sm text-gray-500">credits</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">HPI Checks:</span> 1 credit per check (£5 value)
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Appeals:</span> 1 free trial per vehicle, then £2 each
                </div>
                {userUsage.appealTrialUsed && (
                  <div className="text-sm text-amber-600">
                    Free trial used for: {userUsage.appealTrialReg}
                  </div>
                )}
                <div className="text-sm text-green-600 font-medium">
                  {hpiCredits === 0 ? (
                    <span className="text-orange-600">Purchase HPI credits to perform vehicle checks</span>
                  ) : (
                    "Use your credits for instant vehicle history reports"
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Appeals</p>
                  <p className="text-2xl font-bold">{dashboardData.appeals.total}</p>
                </div>
                <FileText className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Appeals</p>
                  <p className="text-2xl font-bold">{dashboardData.appeals.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">HPI Checks</p>
                  <p className="text-2xl font-bold">{dashboardData.hpiChecks.total}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Appeals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Appeals
            </CardTitle>
            <Button onClick={() => onNavigate("appeals")} variant="outline" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {dashboardData.appeals.recent.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No appeals submitted yet</p>
                <Button onClick={() => onNavigate("appeals")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Appeal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.appeals.recent.map((appeal: any) => (
                  <div key={appeal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Fine: {appeal.fineReference}</p>
                      <p className="text-sm text-gray-600">Amount: {formatCurrency(appeal.fineAmount)}</p>
                      <p className="text-sm text-gray-600">Reason: {appeal.reason}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(appeal.status)}
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(appeal.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => onNavigate("appeals")} className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Submit New Appeal
            </Button>
            <Button onClick={() => onNavigate("hpi-checks")} variant="outline" className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
              <Shield className="h-4 w-4 mr-2" />
              Run HPI Check
            </Button>
            <Button onClick={() => onNavigate("vehicle-checks")} variant="outline" className="w-full justify-start">
              <Car className="h-4 w-4 mr-2" />
              Check Vehicle Status
            </Button>
            <Button onClick={() => onNavigate("reminders")} variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Set Reminders
            </Button>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Tips for Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Appeal Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Submit appeals within 28 days</li>
                  <li>• Include clear photographic evidence</li>
                  <li>• Be specific about why the fine is incorrect</li>
                  <li>• Keep copies of all correspondence</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Vehicle Management</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check MOT status regularly</li>
                  <li>• Set up renewal reminders</li>
                  <li>• Run HPI checks before buying</li>
                  <li>• Keep vehicle documents updated</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Small Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t">
          <p>
            <Link href="/terms" target="_blank" className="hover:text-gray-700 underline">
              Terms & Conditions
            </Link>
            {" • "}
            <Link href="/privacy" target="_blank" className="hover:text-gray-700 underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

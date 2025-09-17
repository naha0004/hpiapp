"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  FileText, 
  CreditCard, 
  Car, 
  RefreshCw
} from "lucide-react"

interface User {
  id: string
  name: string | null
  email: string | null
  subscriptionType: string
  isActive: boolean
  createdAt: string
  _count: {
    appeals: number
    hpiChecks: number
    payments: number
  }
}

interface Analytics {
  overview: {
    totalUsers: number
    activeUsers: number
    newUsers: number
    totalAppeals: number
    totalRevenue: number
    totalHpiChecks: number
  }
  subscriptions: Record<string, number>
  appeals: {
    total: number
    byStatus: Record<string, number>
  }
  payments: {
    total: number
    revenue: number
    byType: Record<string, { count: number, revenue: number }>
  }
  hpi: {
    total: number
  }
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== "all" && { subscriptionType: filterType })
      })
      
      // Use test API endpoints
      const response = await fetch(`/api/admin/test/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setUsers(data.users || [])
      setTotalPages(Math.ceil((data.pagination?.total || 0) / 20))
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([]) // Set empty array on error
    }
  }

  const fetchAnalytics = async () => {
    try {
      // Use test API endpoints
      const response = await fetch('/api/admin/test/analytics?period=30d')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Set default analytics on error
      setAnalytics({
        overview: {
          totalUsers: 0,
          activeUsers: 0,
          newUsers: 0,
          totalAppeals: 0,
          totalRevenue: 0,
          totalHpiChecks: 0
        },
        subscriptions: {},
        appeals: { total: 0, byStatus: {} },
        payments: { total: 0, revenue: 0, byType: {} },
        hpi: { total: 0 }
      })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchUsers(), fetchAnalytics()])
      setLoading(false)
    }
    loadData()
  }, [currentPage, searchTerm, filterType])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading admin dashboard...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard (TEST MODE)</h1>
          <p className="text-muted-foreground">Testing ClearRideAI admin panel</p>
        </div>
        <Button onClick={() => { fetchUsers(); fetchAnalytics(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{analytics.overview.newUsers} this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appeals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalAppeals}</div>
              <p className="text-xs text-muted-foreground">
                Appeals submitted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics.overview.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total payments received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HPI Checks</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalHpiChecks}</div>
              <p className="text-xs text-muted-foreground">
                Vehicle checks performed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage and filter through all registered users (TEST MODE - No actual user modification)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search users by name, email, or registration number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subscriptions</SelectItem>
                    <SelectItem value="FREE_TRIAL">Free Trial</SelectItem>
                    <SelectItem value="SINGLE_APPEAL">Single Appeal</SelectItem>
                    <SelectItem value="ANNUAL_PLAN">Annual Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found. This might be because your database is empty or there was an error loading data.
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{user.name || 'No name'}</h3>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {user.subscriptionType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.email || 'No email'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.createdAt).toLocaleDateString()} • 
                          Appeals: {user._count.appeals} • 
                          HPI: {user._count.hpiChecks} • 
                          Payments: {user._count.payments}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Test Mode
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {analytics && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Appeal Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.keys(analytics.appeals.byStatus).length === 0 ? (
                      <p className="text-muted-foreground">No appeal data available</p>
                    ) : (
                      Object.entries(analytics.appeals.byStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center">
                          <span className="capitalize">{status.toLowerCase().replace('_', ' ')}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.keys(analytics.subscriptions).length === 0 ? (
                      <p className="text-muted-foreground">No subscription data available</p>
                    ) : (
                      Object.entries(analytics.subscriptions).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.keys(analytics.payments.byType).length === 0 ? (
                      <p className="text-muted-foreground">No payment data available</p>
                    ) : (
                      Object.entries(analytics.payments.byType).map(([type, data]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(data.revenue)}</div>
                            <div className="text-xs text-muted-foreground">{data.count} payments</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Active Users</span>
                      <span className="font-medium">{analytics.overview.activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-medium">{formatCurrency(analytics.overview.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HPI Checks</span>
                      <span className="font-medium">{analytics.overview.totalHpiChecks}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

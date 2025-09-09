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
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Tag
} from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

interface PromoCode {
  id: string
  code: string
  name: string
  description: string | null
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  minOrderValue: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usageCount: number
  perUserLimit: number | null
  applicableFor: string  // "ANNUAL_SUBSCRIPTION", "HPI_CHECK" (comma-separated)
  isActive: boolean
  validFrom: string
  validUntil: string | null
  createdAt: string
  updatedAt: string
}

const promoCodeSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(20, "Code must be at most 20 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().min(0.01, "Discount value must be greater than 0"),
  minOrderValue: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  perUserLimit: z.number().int().min(1).optional().nullable(),
  applicableFor: z.array(z.enum(['ANNUAL_SUBSCRIPTION', 'HPI_CHECK'])).min(1, "Select at least one service type"),
  isActive: z.boolean(),
  validFrom: z.string(),
  validUntil: z.string().optional().nullable(),
})

type PromoCodeFormData = z.infer<typeof promoCodeSchema>

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [promoLoading, setPromoLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showPromoDialog, setShowPromoDialog] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null)
  const [deletingPromo, setDeletingPromo] = useState<PromoCode | null>(null)

  const form = useForm<PromoCodeFormData>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      minOrderValue: null,
      maxDiscount: null,
      usageLimit: null,
      perUserLimit: null,
      applicableFor: ['HPI_CHECK'],
      isActive: true,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: null,
    },
  })

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== "all" && { subscriptionType: filterType })
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setUsers(data.users)
      setTotalPages(Math.ceil(data.total / 20))
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics?period=30d')
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Analytics API error:', response.status, errorText)
        throw new Error(`Failed to fetch analytics: ${response.status}`)
      }
      
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Set default analytics to prevent crashes
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

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      
      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch('/api/admin/promo-codes')
      if (!response.ok) throw new Error('Failed to fetch promo codes')
      
      const data = await response.json()
      setPromoCodes(data)
    } catch (error) {
      console.error('Error fetching promo codes:', error)
      setPromoCodes([]) // Ensure it's always an array
    }
  }

  const onSubmitPromoCode = async (data: PromoCodeFormData) => {
    try {
      const method = editingPromo ? 'PUT' : 'POST'
      const url = editingPromo 
        ? `/api/admin/promo-codes/${editingPromo.id}`
        : '/api/admin/promo-codes'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          applicableFor: data.applicableFor.join(','), // Convert array to comma-separated string
          validUntil: data.validUntil || null,
          maxDiscount: data.maxDiscount || null,
          usageLimit: data.usageLimit || null,
          minOrderValue: data.minOrderValue || null,
          perUserLimit: data.perUserLimit || null,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save promo code')
      }

      await fetchPromoCodes()
      setShowPromoDialog(false)
      setEditingPromo(null)
      form.reset()
      
      console.log(editingPromo ? 'Promo code updated successfully' : 'Promo code created successfully')
    } catch (error) {
      console.error('Error saving promo code:', error)
    }
  }

  const deletePromoCode = async (promoId: string) => {
    try {
      const response = await fetch(`/api/admin/promo-codes/${promoId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete promo code')
      }

      await fetchPromoCodes()
      setDeletingPromo(null)
      console.log('Promo code deleted successfully')
    } catch (error) {
      console.error('Error deleting promo code:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchUsers(), fetchAnalytics(), fetchPromoCodes()])
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your ClearRideAI platform</p>
        </div>
        <Button onClick={() => { fetchUsers(); fetchAnalytics(); fetchPromoCodes(); }}>
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
          <TabsTrigger value="promo-codes">Promo Codes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage and filter through all registered users
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
                {users.map((user) => (
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
                    <Button
                      variant={user.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleUserStatus(user.id, user.isActive)}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                ))}
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
                    {Object.entries(analytics.appeals.byStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="capitalize">{status.toLowerCase().replace('_', ' ')}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.subscriptions).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.payments.byType).map(([type, data]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(data.revenue)}</div>
                          <div className="text-xs text-muted-foreground">{data.count} payments</div>
                        </div>
                      </div>
                    ))}
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

        <TabsContent value="promo-codes">
          <Card>
            <CardHeader>
              <CardTitle>Promo Code Management</CardTitle>
              <CardDescription>
                Create, update, and manage promo codes for subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <h2 className="text-lg font-semibold">All Promo Codes</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Promo Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Promo Code</DialogTitle>
                      <DialogDescription>
                        Create a new promo code for discounts on subscriptions
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitPromoCode)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Promo Code</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter promo code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter display name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="applicableFor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Applicable For</FormLabel>
                              <FormControl>
                                <div className="flex gap-4">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={field.value.includes('HPI_CHECK')}
                                      onChange={(e) => {
                                        const newValue = e.target.checked
                                          ? [...field.value, 'HPI_CHECK']
                                          : field.value.filter(v => v !== 'HPI_CHECK')
                                        field.onChange(newValue)
                                      }}
                                    />
                                    <span>HPI Checks</span>
                                  </label>
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={field.value.includes('ANNUAL_SUBSCRIPTION')}
                                      onChange={(e) => {
                                        const newValue = e.target.checked
                                          ? [...field.value, 'ANNUAL_SUBSCRIPTION']
                                          : field.value.filter(v => v !== 'ANNUAL_SUBSCRIPTION')
                                        field.onChange(newValue)
                                      }}
                                    />
                                    <span>Annual Subscription</span>
                                  </label>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="discountValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount Value</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter discount value" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="validFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valid From</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter start date" type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="validUntil"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valid Until (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter end date" 
                                  type="date" 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" onClick={() => setShowPromoDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingPromo ? "Update Promo Code" : "Create Promo Code"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Promo Codes Table */}
              <div className="rounded-md border">
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-t-md">
                  <div className="font-medium">Code</div>
                  <div className="font-medium">Discount</div>
                  <div className="font-medium">Expiry Date</div>
                  <div className="font-medium text-right">Actions</div>
                </div>
                <div className="divide-y">
                  {Array.isArray(promoCodes) && promoCodes.length > 0 ? promoCodes.map((promo) => (
                    <div key={promo.id} className="grid grid-cols-4 gap-4 p-4">
                      <div>{promo.code}</div>
                      <div>{promo.discountValue}{promo.discountType === 'PERCENTAGE' ? '%' : '£'}</div>
                      <div>{promo.validUntil ? new Date(promo.validUntil).toLocaleDateString() : 'No expiry'}</div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPromo(promo)
                            setShowPromoDialog(true)
                            form.setValue('code', promo.code)
                            form.setValue('name', promo.name)
                            form.setValue('description', promo.description || '')
                            form.setValue('discountType', promo.discountType)
                            form.setValue('discountValue', promo.discountValue)
                            form.setValue('minOrderValue', promo.minOrderValue)
                            form.setValue('maxDiscount', promo.maxDiscount)
                            form.setValue('usageLimit', promo.usageLimit)
                            form.setValue('perUserLimit', promo.perUserLimit)
                            form.setValue('applicableFor', promo.applicableFor.split(',') as ('ANNUAL_SUBSCRIPTION' | 'HPI_CHECK')[])
                            form.setValue('isActive', promo.isActive)
                            form.setValue('validFrom', promo.validFrom.split('T')[0])
                            form.setValue('validUntil', promo.validUntil ? promo.validUntil.split('T')[0] : null)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingPromo(promo)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-gray-500">
                      {promoLoading ? 'Loading promo codes...' : 'No promo codes created yet'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      {deletingPromo && (
        <AlertDialog open={Boolean(deletingPromo)} onOpenChange={() => setDeletingPromo(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this promo code? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingPromo(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deletingPromo && deletePromoCode(deletingPromo.id)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete Promo Code
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { 
  Search, 
  Car, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  Calendar,
  Star,
  TrendingUp,
  Eye,
  CreditCard,
  ArrowLeft,
} from "lucide-react"
import { ComprehensiveHPIReport } from "@/components/comprehensive-hpi-report"
import { PaymentModal } from "@/components/payment-modal"
import { VehicleValuationTool } from "@/components/vehicle-valuation-tool"
import { IntegratedHPIValuation } from "@/components/integrated-hpi-valuation"
import type { ParsedHPIData } from "@/lib/oneauto-hpi-parser"

interface HPICheck {
  id: string
  registration: string
  status: "PENDING" | "COMPLETED" | "FAILED"
  cost: number
  createdAt: string
  completedDate?: string
  results?: {
    stolen?: boolean
    writeOff?: boolean
    mileageDiscrepancy?: boolean
    outstandingFinance?: boolean
    previousOwners?: number
    lastMOT?: string
    taxStatus?: string
    insuranceGroup?: number
    vehicleCheck?: {
      make?: string
      model?: string
      colour?: string
      fuelType?: string
      engineSize?: string
      yearOfManufacture?: string
    }
    error?: string
    // Extended comprehensive data when available
    comprehensiveData?: ParsedHPIData
    parsedData?: ParsedHPIData
  }
}

export default function HPIChecksClean() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [registration, setRegistration] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hpiChecks, setHpiChecks] = useState<HPICheck[]>([])
  const [isLoadingChecks, setIsLoadingChecks] = useState(true)
  const [selectedCheck, setSelectedCheck] = useState<HPICheck | null>(null)
  const [showComprehensiveReport, setShowComprehensiveReport] = useState(false)
  const [showDetailView, setShowDetailView] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [userUsage, setUserUsage] = useState<any>(null)
  const [hpiCredits, setHpiCredits] = useState<number>(0)

  // Fetch existing HPI checks
  const fetchHPIChecks = async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch('/api/hpi-checks')
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Fetched HPI checks:', data)
        setHpiChecks(data.hpiChecks || [])
      }
    } catch (error) {
      console.error('Error fetching HPI checks:', error)
    } finally {
      setIsLoadingChecks(false)
    }
  }

  // Fetch user usage and credits
  const fetchUserUsage = async () => {
    if (!session?.user?.id) return
    
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

  const fetchHpiCredits = async () => {
    if (!session?.user?.id) return
    
    try {
      console.log('🔄 Fetching HPI credits...')
      const response = await fetch('/api/user/credits')
      console.log('📊 Credits response:', response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('💰 Credits data received:', data)
        setHpiCredits(data.hpiCredits || 0)
      } else {
        console.error('❌ Credits fetch failed:', response.status)
      }
    } catch (error) {
      console.error('💥 Error fetching HPI credits:', error)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchHPIChecks()
      fetchUserUsage()
      fetchHpiCredits()
    }
  }, [session])

  // Refresh credits when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user) {
        fetchHpiCredits()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [session])

  // Also refresh credits every 30 seconds when user is active
  useEffect(() => {
    if (!session?.user) return

    const interval = setInterval(() => {
      fetchHpiCredits()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [session])

  // Handle HPI check submission
  const handleHPICheck = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registration.trim()) {
      toast({
        title: "Invalid Registration",
        description: "Please enter a valid registration number",
        variant: "destructive",
      })
      return
    }

    if (hpiCredits < 1) {
      setShowPaymentModal(true)
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/hpi-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          registration: registration.trim().toUpperCase(),
        })
      })

      const result = await response.json()
      console.log('🔍 HPI Check API Response:', result)

      if (response.ok) {
        toast({
          title: "HPI Check Started",
          description: "Your vehicle report is being generated...",
        })
        setRegistration("")
        // Add a small delay to ensure the API has processed the request
        setTimeout(() => {
          fetchHPIChecks()
          fetchHpiCredits()
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to start HPI check",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewComprehensive = (check: any) => {
    setSelectedCheck(check)
    setShowComprehensiveReport(true)
  }

  const handleBackToChecks = () => {
    setSelectedCheck(null) 
    setShowComprehensiveReport(false)
  }

  if (showDetailView && selectedCheck) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Back button */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setShowDetailView(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Checks
          </Button>
          <Badge variant="outline">
            Checked on {new Date(selectedCheck.createdAt).toLocaleDateString('en-GB')}
          </Badge>
        </div>
        
        {/* Detailed HPI Report */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-2xl font-mono tracking-wider bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
              {selectedCheck.registration}
            </CardTitle>
            <CardDescription className="text-lg">
              Complete HPI Report & Analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCheck.status === "COMPLETED" && selectedCheck.results ? (
              <div className="space-y-6">
                {/* Vehicle Basic Info */}
                {selectedCheck.results.vehicleCheck && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <div className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                      <Car className="w-5 w-5" />
                      Vehicle Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Make & Model</p>
                        <p className="text-lg font-semibold text-blue-900">
                          {selectedCheck.results.vehicleCheck.make} {selectedCheck.results.vehicleCheck.model}
                        </p>
                      </div>
                      {selectedCheck.results.vehicleCheck.yearOfManufacture && (
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Year</p>
                          <p className="text-lg font-semibold text-blue-900">{selectedCheck.results.vehicleCheck.yearOfManufacture}</p>
                        </div>
                      )}
                      {selectedCheck.results.vehicleCheck.engineSize && (
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Engine</p>
                          <p className="text-lg font-semibold text-blue-900">{selectedCheck.results.vehicleCheck.engineSize}L</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Security Checks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-xl border ${selectedCheck.results.stolen ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {selectedCheck.results.stolen ? (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      ) : (
                        <Shield className="w-6 h-6 text-green-600" />
                      )}
                      <h3 className={`font-semibold ${selectedCheck.results.stolen ? 'text-red-900' : 'text-green-900'}`}>
                        Stolen Check
                      </h3>
                    </div>
                    <p className={`text-sm ${selectedCheck.results.stolen ? 'text-red-700' : 'text-green-700'}`}>
                      {selectedCheck.results.stolen ? "⚠️ This vehicle is reported as stolen" : "✅ No stolen records found"}
                    </p>
                  </div>

                  <div className={`p-6 rounded-xl border ${selectedCheck.results.writeOff ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {selectedCheck.results.writeOff ? (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      ) : (
                        <Shield className="w-6 h-6 text-green-600" />
                      )}
                      <h3 className={`font-semibold ${selectedCheck.results.writeOff ? 'text-red-900' : 'text-green-900'}`}>
                        Write-off Check
                      </h3>
                    </div>
                    <p className={`text-sm ${selectedCheck.results.writeOff ? 'text-red-700' : 'text-green-700'}`}>
                      {selectedCheck.results.writeOff ? "⚠️ This vehicle has been written off" : "✅ No write-off records found"}
                    </p>
                  </div>
                </div>

                {/* Comprehensive report button */}
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => {
                      console.log('🔍 Selected check data:', selectedCheck)
                      console.log('🔍 Results structure:', selectedCheck?.results)
                      handleViewComprehensive(selectedCheck)
                    }}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Complete Report & Valuation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedCheck.status === "FAILED" ? "Check Failed" : "Processing"}
                </h3>
                <p className="text-gray-600">
                  {selectedCheck.status === "FAILED" 
                    ? "Unable to complete this HPI check. Please try again." 
                    : "Your HPI check is being processed..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comprehensive Report Modal */}
        {showComprehensiveReport && selectedCheck?.results?.comprehensiveData && (
          <ComprehensiveHPIReport
            data={selectedCheck.results.comprehensiveData}
            registration={selectedCheck.registration}
          />
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          HPI Vehicle Checks
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get comprehensive vehicle history reports, check for stolen records, write-offs, and outstanding finance
        </p>
      </div>

      {/* New HPI Check Form */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            New HPI Check
          </CardTitle>
          <CardDescription>
            Enter a UK vehicle registration to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleHPICheck} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="e.g. AB12 CDE"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg tracking-wider"
                  maxLength={8}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="px-8">
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Check Vehicle
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Cost: 1 HPI Credit per check</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <CreditCard className="w-4 h-4 mr-1" />
                  {hpiCredits} Credits Available
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    console.log('🔄 Manual credit refresh triggered')
                    fetchHpiCredits()
                  }}
                  className="text-xs h-6 px-2"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* HPI Checks Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Your HPI Checks</h2>
          <Button variant="outline" onClick={fetchHPIChecks} disabled={isLoadingChecks}>
            <FileText className="w-4 h-4 mr-2" />
            {isLoadingChecks ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {isLoadingChecks ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hpiChecks.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Car className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No HPI Checks Yet</h3>
              <p className="text-gray-600 mb-4">Start by checking your first vehicle above</p>
              <Badge variant="outline" className="px-4 py-2">
                <CreditCard className="w-4 h-4 mr-2" />
                {hpiCredits} HPI Credits Available
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hpiChecks.map((check) => (
              <div key={check.id}>
                <Card 
                  className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-white/90 backdrop-blur-sm hover:bg-white"
                  onClick={() => {
                    setSelectedCheck(check)
                    setShowDetailView(true)
                  }}
                >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${
                      check.status === "COMPLETED" 
                        ? "bg-green-100 text-green-600" 
                        : check.status === "FAILED"
                        ? "bg-red-100 text-red-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}>
                      {check.status === "COMPLETED" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : check.status === "FAILED" ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <Badge 
                      variant={
                        check.status === "COMPLETED" ? "default" :
                        check.status === "FAILED" ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {check.status === "COMPLETED" ? "Complete" : 
                       check.status === "FAILED" ? "Failed" : "Processing"}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-xl font-mono tracking-wider bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                    {check.registration}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(check.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    
                    {check.status === "COMPLETED" && check.results?.vehicleCheck && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">
                          {check.results.vehicleCheck.make} {check.results.vehicleCheck.model}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {check.results.vehicleCheck.yearOfManufacture && (
                            <span>{check.results.vehicleCheck.yearOfManufacture}</span>
                          )}
                          {check.results.vehicleCheck.engineSize && (
                            <span>{check.results.vehicleCheck.engineSize}L</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button variant="ghost" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Integrated Valuation - appears after completed HPI checks */}
              {check.status === "COMPLETED" && check.results && (
                <IntegratedHPIValuation
                  registration={check.registration}
                  vehicleData={check.results.vehicleCheck}
                />
              )}
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        service="hpi"
        onPaymentSuccess={() => {
          console.log('🎉 Payment successful! Refreshing credits...')
          fetchUserUsage()
          fetchHpiCredits() // Immediate refresh
          
          // Also refresh after a short delay to ensure backend is updated
          setTimeout(() => {
            console.log('🔄 Secondary credit refresh after payment')
            fetchHpiCredits()
          }, 2000)
          
          if (registration.trim()) {
            setTimeout(() => {
              handleHPICheck({ preventDefault: () => {} } as React.FormEvent)
            }, 3000)
          }
        }}
      />
    </div>
  )
}

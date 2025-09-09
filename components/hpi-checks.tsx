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
} from "lucide-react"
import { ComprehensiveHPIReport } from "@/components/comprehensive-hpi-report"
import { PaymentModal } from "@/components/payment-modal"
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
  }
}

export default function HPIChecksPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [registration, setRegistration] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hpiChecks, setHpiChecks] = useState<HPICheck[]>([])
  const [isLoadingChecks, setIsLoadingChecks] = useState(true)
  const [selectedCheck, setSelectedCheck] = useState<HPICheck | null>(null)
  const [showComprehensiveReport, setShowComprehensiveReport] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [userUsage, setUserUsage] = useState<any>(null)
  const [hpiCredits, setHpiCredits] = useState<number>(0)

  // Fetch existing HPI checks and user usage
  useEffect(() => {
    if (session?.user) {
      fetchHPIChecks()
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

  const handleViewComprehensive = (check: HPICheck) => {
    setSelectedCheck(check)
    setShowComprehensiveReport(true)
  }

  const handleBackToChecks = () => {
    setSelectedCheck(null)
    setShowComprehensiveReport(false)
  }

  const fetchHPIChecks = async () => {
    try {
      setIsLoadingChecks(true)
      const response = await fetch("/api/hpi-checks")
      if (response.ok) {
        const data = await response.json()
        // Remove duplicates and sort by date (newest first)
        const uniqueChecks = data.hpiChecks
          .filter((check: HPICheck, index: number, self: HPICheck[]) => 
            index === self.findIndex(c => c.id === check.id)
          )
          .sort((a: HPICheck, b: HPICheck) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        setHpiChecks(uniqueChecks)
      }
    } catch (error) {
      console.error("Failed to fetch HPI checks:", error)
    } finally {
      setIsLoadingChecks(false)
    }
  }

  const handleHPICheck = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registration.trim()) {
      toast({
        title: "Registration Required",
        description: "Please enter a vehicle registration number",
        variant: "destructive",
      })
      return
    }

    // Check if user has HPI credits
    console.log('User HPI credits:', hpiCredits)
    if (hpiCredits < 1) {
      console.log('Insufficient credits - showing payment modal')
      setShowPaymentModal(true)
      return
    }

    console.log('User has credits, proceeding with HPI check')
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/hpi-checks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registration: registration.trim().toUpperCase(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "HPI Check Started", 
          description: `HPI check for ${registration.toUpperCase()} has been initiated. 1 credit consumed.`,
        })
        setRegistration("")
        fetchHPIChecks()
        fetchHpiCredits() // Refresh credits after consumption
      } else {
        const errorData = await response.json()
        toast({
          title: "HPI Check Failed",
          description: errorData.error || "Failed to start HPI check",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {showComprehensiveReport && selectedCheck?.results?.comprehensiveData ? (
          <div>
            {/* Back Button */}
            <div className="mb-6">
              <Button
                onClick={handleBackToChecks}
                variant="outline"
                className="mb-4"
              >
                ← Back to HPI Checks
              </Button>
            </div>
            
            {/* Comprehensive Report */}
            <ComprehensiveHPIReport 
              data={selectedCheck.results.comprehensiveData}
              registration={selectedCheck.registration}
            />
          </div>
        ) : (
          <>
            {/* Enhanced Header */}
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                  HPI Vehicle Checks
          </h1>
          <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
            Comprehensive vehicle history reports with theft, finance, write-off and mileage verification
          </p>
        </div>
        
        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Trusted by 100k+ drivers</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>99.9% accuracy rate</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Industry certified</span>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl text-center border border-blue-200 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="text-base font-semibold text-blue-900">Theft Check</div>
          <div className="text-sm text-blue-600 mt-1">Police database verification</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-xl text-center border border-red-200 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="text-base font-semibold text-red-900">Write-off Status</div>
          <div className="text-sm text-red-600 mt-1">Insurance category checks</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-6 rounded-xl text-center border border-green-200 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="text-base font-semibold text-green-900">Finance Check</div>
          <div className="text-sm text-green-600 mt-1">Outstanding finance alerts</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-xl text-center border border-purple-200 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 mx-auto mb-4 bg-purple-500 rounded-full flex items-center justify-center">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div className="text-base font-semibold text-purple-900">Owner History</div>
          <div className="text-sm text-purple-600 mt-1">Previous owner records</div>
        </div>
      </div>

      {/* Enhanced New HPI Check Form */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <span className="text-blue-700 font-medium">
                {hpiCredits} HPI Credits Available
              </span>
            </div>
            {hpiCredits === 0 && (
              <Button
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Buy Credits
              </Button>
            )}
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            Start New HPI Check
          </CardTitle>
          <CardDescription className="text-base">
            {hpiCredits > 0 
              ? "Enter a vehicle registration to use 1 credit for comprehensive history report"
              : "Purchase HPI credits to get instant comprehensive vehicle history reports"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleHPICheck} className="max-w-lg mx-auto space-y-6">
            <div className="flex gap-3">
              <Input
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                placeholder="Enter registration (e.g. AB12 CDE)"
                className="uppercase font-mono text-lg p-4 h-14 border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-14 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Search className="w-5 h-5 mr-2" />
                {isLoading ? "Checking..." : "Run Check"}
              </Button>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 text-center font-medium">
                {hpiCredits > 0 
                  ? `� 1 credit per check (${hpiCredits} available) • ⚡ Results in 30 seconds • 🔒 Secure & Confidential`
                  : "�💼 £5.00 per credit • ⚡ Results in 30 seconds • 🔒 Secure & Confidential"
                }
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Recent HPI Checks */}
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
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hpiChecks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No HPI Checks Yet</h3>
              <p className="text-gray-600">Start by checking your first vehicle above</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hpiChecks.map((check) => (
              <Card key={check.id} className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl shadow-md ${
                        check.status === "COMPLETED" 
                          ? "bg-gradient-to-br from-green-400 to-green-500 text-white" 
                          : check.status === "FAILED"
                          ? "bg-gradient-to-br from-red-400 to-red-500 text-white"
                          : "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white"
                      }`}>
                        {check.status === "COMPLETED" ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : check.status === "FAILED" ? (
                          <AlertTriangle className="w-6 h-6" />
                        ) : (
                          <Clock className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-mono tracking-wider bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                          {check.registration}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-base">
                          <Calendar className="w-4 h-4" />
                          {new Date(check.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Badge 
                        variant={
                          check.status === "COMPLETED" ? "default" :
                          check.status === "FAILED" ? "destructive" : "secondary"
                        }
                      >
                        {check.status === "COMPLETED" ? "Complete" : 
                         check.status === "FAILED" ? "Failed" : "Processing"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {check.status === "COMPLETED" && check.results ? (
                    <div className="space-y-4">
                      {/* Vehicle Basic Info */}
                      {check.results.vehicleCheck && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                          <div className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <Car className="w-4 h-4 text-white" />
                            </div>
                            Vehicle Details
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div className="bg-white/70 p-4 rounded-lg">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Make:</span> 
                                    <span className="font-semibold">{check.results.vehicleCheck.make} {check.results.vehicleCheck.model}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Year:</span> 
                                    <span className="font-semibold">{check.results.vehicleCheck.yearOfManufacture || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Color:</span> 
                                    <span className="font-semibold">{check.results.vehicleCheck.colour || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Fuel:</span> 
                                    <span className="font-semibold">{check.results.vehicleCheck.fuelType || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Engine:</span> 
                                    <span className="font-semibold">{check.results.vehicleCheck.engineSize || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Enhanced Safety Checks Summary */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-4 rounded-xl text-center border-2 transition-all duration-300 ${
                          check.results.stolen 
                            ? "bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200 shadow-md" 
                            : "bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200 shadow-md"
                        }`}>
                          <div className="font-semibold text-sm mb-1">Stolen Status</div>
                          <div className="text-lg font-bold">
                            {check.results.stolen ? "⚠️ Alert" : "✅ Clear"}
                          </div>
                        </div>
                        <div className={`p-4 rounded-xl text-center border-2 transition-all duration-300 ${
                          check.results.writeOff 
                            ? "bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200 shadow-md" 
                            : "bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200 shadow-md"
                        }`}>
                          <div className="font-semibold text-sm mb-1">Write-off</div>
                          <div className="text-lg font-bold">
                            {check.results.writeOff ? "⚠️ Found" : "✅ Clear"}
                          </div>
                        </div>
                        <div className={`p-4 rounded-xl text-center border-2 transition-all duration-300 ${
                          check.results.outstandingFinance 
                            ? "bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200 shadow-md" 
                            : "bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200 shadow-md"
                        }`}>
                          <div className="font-semibold text-sm mb-1">Finance</div>
                          <div className="text-lg font-bold">
                            {check.results.outstandingFinance ? "💰 Outstanding" : "✅ Clear"}
                          </div>
                        </div>
                        <div className={`p-4 rounded-xl text-center border-2 transition-all duration-300 ${
                          check.results.mileageDiscrepancy 
                            ? "bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200 shadow-md" 
                            : "bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200 shadow-md"
                        }`}>
                          <div className="font-semibold text-sm mb-1">Mileage</div>
                          <div className="text-lg font-bold">
                            {check.results.mileageDiscrepancy ? "📊 Issue" : "✅ Clear"}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {check.results.previousOwners && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-semibold text-purple-900">Previous Owners:</span>
                            </div>
                            <span className="text-lg font-bold text-purple-700">{check.results.previousOwners}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : check.status === "FAILED" ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                      </div>
                      <div className="text-lg font-semibold text-red-600 mb-2">Check Failed</div>
                      {check.results?.error && (
                        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg max-w-sm mx-auto">
                          {check.results.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="w-8 h-8 text-yellow-500 animate-spin" />
                      </div>
                      <div className="text-lg font-semibold text-yellow-600 mb-2">Processing...</div>
                      <div className="text-sm text-yellow-500">This usually takes 30-60 seconds</div>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-500">Report Cost</div>
                      <div className="text-lg font-bold text-green-600">£{check.cost.toFixed(2)}</div>
                    </div>
                    
                    {/* Action buttons for completed checks */}
                    {check.status === "COMPLETED" && (
                      <div className="space-y-2">
                        {/* Comprehensive Report Button - only show if comprehensive data is available */}
                        {check.results?.comprehensiveData && (
                          <Button
                            onClick={() => handleViewComprehensive(check)}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Comprehensive Report
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Terms Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t">
          <p>
            Finance data supplied by Experian. Other data sourced independently. We exclude liability for data inaccuracies.{" "}
            <Link href="/terms" target="_blank" className="hover:text-gray-700 underline">
              Terms & Conditions
            </Link>
          </p>
        </div>
      </div>
          </>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          service="hpi"
          onPaymentSuccess={() => {
            fetchUserUsage()
            fetchHpiCredits() // Refresh HPI credits after successful payment
            // Retry the HPI check after payment if registration is entered
            if (registration.trim()) {
              setTimeout(() => {
                handleHPICheck({ preventDefault: () => {} } as React.FormEvent)
              }, 1000)
            }
          }}
        />
      </div>
    </div>
  )
}

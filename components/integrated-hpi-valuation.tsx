"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Car,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Calculator,
  BarChart3,
  Clock,
  Star,
  Shield,
  Info,
  ThumbsUp,
  ThumbsDown,
  Gift
} from "lucide-react"

interface ValuationData {
  registration: string
  make: string
  model: string
  year: number
  estimatedValue: {
    trade: number
    retail: number
    partEx: number
    private: number
  }
  marketData: {
    averagePrice: number
    priceRange: {
      min: number
      max: number
    }
    daysToSell: number
    demand: 'high' | 'medium' | 'low'
    supply: 'high' | 'medium' | 'low'
  }
  adjustments: {
    mileage: number
    condition: number
    total: number
  }
}

interface PurchaseEvaluation {
  recommendation: 'excellent_deal' | 'good_deal' | 'fair_deal' | 'poor_deal' | 'avoid'
  score: number
  priceAnalysis: {
    askingPrice: number
    estimatedValue: number
    difference: number
    percentageAboveBelow: number
  }
  reasons: string[]
  risks: string[]
  positives: string[]
  marketComparison: {
    percentile: number
    betterThanPercent: number
  }
  negotiationAdvice: {
    suggestedOffer: number
    maxRecommended: number
    negotiationPoints: string[]
  }
  motAnalysis?: {
    hasRecentMOT: boolean
    lastMOTDate: string | null
    recentAdvisories: string[]
    commonIssues: string[]
    upcomingCosts: string[]
    riskFlags: string[]
  }
}

interface IntegratedHPIValuationProps {
  registration: string
  vehicleData?: {
    make?: string
    model?: string
    yearOfManufacture?: string
  }
}

export function IntegratedHPIValuation({ registration, vehicleData }: IntegratedHPIValuationProps) {
  const { toast } = useToast()
  
  // Valuation state
  const [mileage, setMileage] = useState("")
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good')
  const [isLoadingValuation, setIsLoadingValuation] = useState(false)
  const [valuationData, setValuationData] = useState<ValuationData | null>(null)
  const [showValuation, setShowValuation] = useState(false)
  
  // Purchase evaluation state
  const [askingPrice, setAskingPrice] = useState("")
  const [buyerMileage, setBuyerMileage] = useState("")
  const [buyerCondition, setBuyerCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good')
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false)
  const [evaluationData, setEvaluationData] = useState<PurchaseEvaluation | null>(null)
  const [showPurchaseEval, setShowPurchaseEval] = useState(false)

  // Auto-load valuation when component mounts if we have vehicle data
  useEffect(() => {
    if (registration && vehicleData) {
      handleAutoValuation()
    }
  }, [registration, vehicleData])

  const handleAutoValuation = async () => {
    setIsLoadingValuation(true)
    
    try {
      const response = await fetch("/api/vehicle-valuation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registration: registration.toUpperCase(),
          mileage: mileage ? parseInt(mileage) : undefined,
          condition,
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setValuationData(result.data)
        setShowValuation(true)
      }
    } catch (error) {
      console.error("Auto-valuation error:", error)
    } finally {
      setIsLoadingValuation(false)
    }
  }

  const handleManualValuation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!mileage.trim()) {
      toast({
        title: "Mileage Required",
        description: "Please enter the current mileage for accurate valuation",
        variant: "destructive",
      })
      return
    }

    setIsLoadingValuation(true)
    
    try {
      const response = await fetch("/api/vehicle-valuation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registration: registration.toUpperCase(),
          mileage: parseInt(mileage),
          condition,
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setValuationData(result.data)
        toast({
          title: "Valuation Complete",
          description: `Updated valuation with your specific vehicle details`,
        })
      } else {
        toast({
          title: "Valuation Failed",
          description: result.error || "Unable to retrieve vehicle valuation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Valuation error:", error)
      toast({
        title: "Error",
        description: "Failed to retrieve vehicle valuation",
        variant: "destructive",
      })
    } finally {
      setIsLoadingValuation(false)
    }
  }

  const handlePurchaseEvaluation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!askingPrice.trim() || !buyerMileage.trim()) {
      toast({
        title: "Required Fields",
        description: "Please fill in asking price and mileage",
        variant: "destructive",
      })
      return
    }

    setIsLoadingEvaluation(true)
    
    try {
      const response = await fetch("/api/purchase-evaluation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registration: registration.toUpperCase(),
          askingPrice: parseFloat(askingPrice),
          currentMileage: parseInt(buyerMileage),
          condition: buyerCondition,
        }),
      })

      const result = await response.json()
      console.log('🔍 Purchase evaluation response:', result)
      console.log('🔍 MOT Analysis data:', result.data?.motAnalysis)

      if (result.success && result.data) {
        setEvaluationData(result.data)
        setShowPurchaseEval(true)
        toast({
          title: "Purchase Analysis Complete",
          description: `Evaluation complete with recommendation`,
        })
      } else {
        toast({
          title: "Evaluation Failed",
          description: result.error || "Unable to evaluate purchase",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Evaluation error:", error)
      toast({
        title: "Error",
        description: "Failed to evaluate purchase",
        variant: "destructive",
      })
    } finally {
      setIsLoadingEvaluation(false)
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent_deal': return 'bg-green-100 text-green-800 border-green-200'
      case 'good_deal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'fair_deal': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'poor_deal': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'avoid': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent_deal': return <CheckCircle className="h-4 w-4" />
      case 'good_deal': return <ThumbsUp className="h-4 w-4" />
      case 'fair_deal': return <Info className="h-4 w-4" />
      case 'poor_deal': return <ThumbsDown className="h-4 w-4" />
      case 'avoid': return <XCircle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-green-500 relative">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-600" />
            Free Vehicle Valuation
            <Badge variant="secondary" className="bg-green-100 text-green-800">Included with HPI Check</Badge>
          </CardTitle>
          <CardDescription>
            Get current market valuation and purchase advice for {registration}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loading overlay for manual updates */}
          {isLoadingValuation && valuationData && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
                <div className="text-sm font-medium text-blue-600">Updating Valuation...</div>
              </div>
            </div>
          )}
          
          {isLoadingValuation && !valuationData ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Calculator className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <div className="text-lg font-semibold text-blue-600">Getting Valuation...</div>
            </div>
          ) : valuationData ? (
            <>
              {/* Valuation Results */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">
                    {valuationData.year} {valuationData.make} {valuationData.model}
                  </h3>
                  <p className="text-gray-600">Registration: {valuationData.registration}</p>
                </div>

                {/* Valuation Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Private Sale</div>
                    <div className="text-xl font-bold text-green-700">
                      {formatCurrency(valuationData.estimatedValue.private)}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Part Exchange</div>
                    <div className="text-xl font-bold text-blue-700">
                      {formatCurrency(valuationData.estimatedValue.partEx)}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Retail Price</div>
                    <div className="text-xl font-bold text-purple-700">
                      {formatCurrency(valuationData.estimatedValue.retail)}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Trade Value</div>
                    <div className="text-xl font-bold text-gray-700">
                      {formatCurrency(valuationData.estimatedValue.trade)}
                    </div>
                  </div>
                </div>

                {/* Market Analysis Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Market Analysis
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Average Price</div>
                      <div className="font-bold">{formatCurrency(valuationData.marketData.averagePrice)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Days to Sell</div>
                      <div className="font-bold">{valuationData.marketData.daysToSell} days</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Demand</div>
                      <Badge variant={valuationData.marketData.demand === 'high' ? 'default' : 'secondary'}>
                        {valuationData.marketData.demand.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-gray-600">Supply</div>
                      <Badge variant={valuationData.marketData.supply === 'low' ? 'default' : 'secondary'}>
                        {valuationData.marketData.supply.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refine valuation with specific details */}
              <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <Calculator className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-blue-900">Get More Accurate Valuation</h4>
                    <p className="text-blue-700 text-sm">Add mileage and condition for a precise valuation</p>
                  </div>
                  <form onSubmit={handleManualValuation} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mileage">Current Mileage</Label>
                        <Input
                          id="mileage"
                          type="number"
                          placeholder="e.g. 45000"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          disabled={isLoadingValuation}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="condition">Vehicle Condition</Label>
                        <Select 
                          value={condition} 
                          onValueChange={(value: 'excellent' | 'good' | 'fair' | 'poor') => setCondition(value)}
                          disabled={isLoadingValuation}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" disabled={isLoadingValuation} className="w-full">
                      {isLoadingValuation ? "Updating..." : "Update Valuation"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          ) : (
            // Initial loading state when auto-loading
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-lg font-semibold text-green-600">Loading Free Valuation...</div>
              <p className="text-gray-600 mt-2">Included with your HPI check</p>
            </div>
          )}

          {/* Purchase Evaluation Section */}
          {valuationData && (
            <>
              <Separator />
              <Card className="border-dashed border-2 border-purple-200 bg-purple-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Target className="h-5 w-5" />
                    Thinking of Buying This Car?
                  </CardTitle>
                  <CardDescription>Get expert purchase advice and negotiation tips</CardDescription>
                </CardHeader>
                <CardContent>
                  {!showPurchaseEval ? (
                    <form onSubmit={handlePurchaseEvaluation} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="asking-price">Asking Price (£)</Label>
                          <Input
                            id="asking-price"
                            type="number"
                            placeholder="e.g. 15000"
                            value={askingPrice}
                            onChange={(e) => setAskingPrice(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="buyer-mileage">Current Mileage</Label>
                          <Input
                            id="buyer-mileage"
                            type="number"
                            placeholder="e.g. 45000"
                            value={buyerMileage}
                            onChange={(e) => setBuyerMileage(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="buyer-condition">Condition</Label>
                          <Select value={buyerCondition} onValueChange={(value: 'excellent' | 'good' | 'fair' | 'poor') => setBuyerCondition(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excellent">Excellent</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button type="submit" disabled={isLoadingEvaluation} className="w-full">
                        {isLoadingEvaluation ? "Analyzing..." : "Get Purchase Advice"}
                      </Button>
                    </form>
                  ) : evaluationData && (
                    <div className="space-y-4">
                      {/* Purchase Recommendation */}
                      <div className="text-center p-4 rounded-lg border">
                        <Badge className={`px-4 py-2 text-lg ${getRecommendationColor(evaluationData.recommendation)}`}>
                          {getRecommendationIcon(evaluationData.recommendation)}
                          <span className="ml-2">
                            {evaluationData.recommendation.replace('_', ' ').toUpperCase()}
                          </span>
                        </Badge>
                        <div className="mt-2">
                          <div className="text-2xl font-bold">{evaluationData.score}/100</div>
                          <div className="text-sm text-gray-600">Purchase Score</div>
                        </div>
                      </div>

                      {/* Quick Analysis */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Asking Price:</span>
                            <span className="font-bold">{formatCurrency(evaluationData.priceAnalysis.askingPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Market Value:</span>
                            <span className="font-bold">{formatCurrency(evaluationData.priceAnalysis.estimatedValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Difference:</span>
                            <span className={`font-bold ${evaluationData.priceAnalysis.difference <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {evaluationData.priceAnalysis.difference >= 0 ? '+' : ''}{formatCurrency(evaluationData.priceAnalysis.difference)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Suggested Offer:</span>
                            <span className="font-bold text-green-600">{formatCurrency(evaluationData.negotiationAdvice.suggestedOffer)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max Recommended:</span>
                            <span className="font-bold text-orange-600">{formatCurrency(evaluationData.negotiationAdvice.maxRecommended)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>vs Market:</span>
                            <span className={`font-bold ${evaluationData.priceAnalysis.percentageAboveBelow <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {evaluationData.priceAnalysis.percentageAboveBelow >= 0 ? '+' : ''}{evaluationData.priceAnalysis.percentageAboveBelow}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* MOT Analysis Section */}
                      {evaluationData.motAnalysis && (
                        <Card className="border-l-4 border-l-blue-500">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-900">
                              <Shield className="h-5 w-5" />
                              MOT History Analysis
                            </CardTitle>
                            <CardDescription>
                              {evaluationData.motAnalysis.hasRecentMOT ? (
                                <>Last MOT: {evaluationData.motAnalysis.lastMOTDate && new Date(evaluationData.motAnalysis.lastMOTDate).toLocaleDateString('en-GB')}</>
                              ) : (
                                <>No recent MOT data available for analysis</>
                              )}
                            </CardDescription>
                          </CardHeader>
                          {evaluationData.motAnalysis.hasRecentMOT && (
                            <CardContent className="space-y-4">
                              {/* Recent Advisories */}
                            {evaluationData.motAnalysis.recentAdvisories.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm text-gray-700 mb-2">Recent MOT Advisories:</h4>
                                <div className="space-y-1">
                                  {evaluationData.motAnalysis.recentAdvisories.map((advisory, index) => (
                                    <div key={index} className="text-sm p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                                      <AlertTriangle className="h-4 w-4 text-yellow-600 inline mr-2" />
                                      {advisory}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Common Issues */}
                            {evaluationData.motAnalysis.commonIssues.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm text-gray-700 mb-2">Recurring Issues:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {evaluationData.motAnalysis.commonIssues.map((issue, index) => (
                                    <Badge key={index} variant="outline" className="text-orange-700 border-orange-300">
                                      {issue}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Upcoming Costs */}
                            {evaluationData.motAnalysis.upcomingCosts.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm text-gray-700 mb-2">Potential Upcoming Costs:</h4>
                                <div className="space-y-1">
                                  {evaluationData.motAnalysis.upcomingCosts.map((cost, index) => (
                                    <div key={index} className="text-sm p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                                      <DollarSign className="h-4 w-4 text-blue-600 inline mr-2" />
                                      {cost}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Risk Flags */}
                            {evaluationData.motAnalysis.riskFlags.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm text-red-700 mb-2">Safety Concerns:</h4>
                                <div className="space-y-1">
                                  {evaluationData.motAnalysis.riskFlags.map((flag, index) => (
                                    <div key={index} className="text-sm p-2 bg-red-50 rounded border-l-2 border-red-400">
                                      <XCircle className="h-4 w-4 text-red-600 inline mr-2" />
                                      {flag}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            </CardContent>
                          )}
                        </Card>
                      )}

                      <Button 
                        variant="outline" 
                        onClick={() => setShowPurchaseEval(false)}
                        className="w-full"
                      >
                        ← Back to Purchase Form
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

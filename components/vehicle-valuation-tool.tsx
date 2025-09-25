"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  ThumbsDown
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
}

export function VehicleValuationTool() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  // Valuation state
  const [registration, setRegistration] = useState("")
  const [mileage, setMileage] = useState("")
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good')
  const [isLoadingValuation, setIsLoadingValuation] = useState(false)
  const [valuationData, setValuationData] = useState<ValuationData | null>(null)
  
  // Purchase evaluation state
  const [buyerRegistration, setBuyerRegistration] = useState("")
  const [askingPrice, setAskingPrice] = useState("")
  const [buyerMileage, setBuyerMileage] = useState("")
  const [buyerCondition, setBuyerCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good')
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false)
  const [evaluationData, setEvaluationData] = useState<PurchaseEvaluation | null>(null)

  const handleValuation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registration.trim()) {
      toast({
        title: "Registration Required",
        description: "Please enter a vehicle registration number",
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
          registration: registration.trim().toUpperCase(),
          mileage: mileage ? parseInt(mileage) : undefined,
          condition,
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setValuationData(result.data)
        toast({
          title: "Valuation Complete",
          description: `Vehicle valuation retrieved for ${result.data.registration}`,
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
    
    if (!buyerRegistration.trim() || !askingPrice.trim() || !buyerMileage.trim()) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields",
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
          registration: buyerRegistration.trim().toUpperCase(),
          askingPrice: parseFloat(askingPrice),
          currentMileage: parseInt(buyerMileage),
          condition: buyerCondition,
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setEvaluationData(result.data)
        toast({
          title: "Evaluation Complete",
          description: `Purchase analysis complete for ${buyerRegistration.toUpperCase()}`,
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

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Vehicle Valuation & Purchase Advisor
          </CardTitle>
          <CardDescription>
            Please sign in to access vehicle valuation and purchase evaluation tools
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            Vehicle Valuation & Purchase Advisor
          </CardTitle>
          <CardDescription>
            Get accurate vehicle valuations and purchase recommendations powered by OneAuto API
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="valuation" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="valuation" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vehicle Valuation
          </TabsTrigger>
          <TabsTrigger value="purchase" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Purchase Evaluation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="valuation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Get Vehicle Valuation</CardTitle>
              <CardDescription>
                Enter vehicle details to get current market valuation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleValuation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registration">Registration Number *</Label>
                    <Input
                      id="registration"
                      placeholder="e.g. AB21 ABC"
                      value={registration}
                      onChange={(e) => setRegistration(e.target.value)}
                      className="uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Current Mileage</Label>
                    <Input
                      id="mileage"
                      type="number"
                      placeholder="e.g. 45000"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Vehicle Condition</Label>
                    <Select value={condition} onValueChange={(value: 'excellent' | 'good' | 'fair' | 'poor') => setCondition(value)}>
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
                  {isLoadingValuation ? "Getting Valuation..." : "Get Valuation"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {valuationData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  {valuationData.year} {valuationData.make} {valuationData.model}
                </CardTitle>
                <CardDescription>Registration: {valuationData.registration}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                {/* Market Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Market Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Average Market Price:</span>
                        <span className="font-semibold">{formatCurrency(valuationData.marketData.averagePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price Range:</span>
                        <span className="font-semibold">
                          {formatCurrency(valuationData.marketData.priceRange.min)} - {formatCurrency(valuationData.marketData.priceRange.max)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Days to Sell:</span>
                        <span className="font-semibold">{valuationData.marketData.daysToSell} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Market Demand:</span>
                        <Badge variant={valuationData.marketData.demand === 'high' ? 'default' : 'secondary'}>
                          {valuationData.marketData.demand.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Market Supply:</span>
                        <Badge variant={valuationData.marketData.supply === 'low' ? 'default' : 'secondary'}>
                          {valuationData.marketData.supply.toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Value Adjustments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Mileage Adjustment:</span>
                        <span className={`font-semibold ${valuationData.adjustments.mileage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {valuationData.adjustments.mileage >= 0 ? '+' : ''}{formatCurrency(valuationData.adjustments.mileage)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Condition Adjustment:</span>
                        <span className={`font-semibold ${valuationData.adjustments.condition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {valuationData.adjustments.condition >= 0 ? '+' : ''}{formatCurrency(valuationData.adjustments.condition)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total Adjustment:</span>
                        <span className={valuationData.adjustments.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {valuationData.adjustments.total >= 0 ? '+' : ''}{formatCurrency(valuationData.adjustments.total)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="purchase" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Evaluation</CardTitle>
              <CardDescription>
                Thinking of buying a car? Get expert advice on whether it's a good deal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePurchaseEvaluation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyer-registration">Vehicle Registration *</Label>
                    <Input
                      id="buyer-registration"
                      placeholder="e.g. AB21 ABC"
                      value={buyerRegistration}
                      onChange={(e) => setBuyerRegistration(e.target.value)}
                      className="uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asking-price">Asking Price (£) *</Label>
                    <Input
                      id="asking-price"
                      type="number"
                      placeholder="e.g. 15000"
                      value={askingPrice}
                      onChange={(e) => setAskingPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyer-mileage">Current Mileage *</Label>
                    <Input
                      id="buyer-mileage"
                      type="number"
                      placeholder="e.g. 45000"
                      value={buyerMileage}
                      onChange={(e) => setBuyerMileage(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyer-condition">Vehicle Condition</Label>
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
                  {isLoadingEvaluation ? "Analyzing Purchase..." : "Evaluate Purchase"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {evaluationData && (
            <div className="space-y-6">
              {/* Recommendation */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getRecommendationIcon(evaluationData.recommendation)}
                    Purchase Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={`px-4 py-2 text-lg ${getRecommendationColor(evaluationData.recommendation)}`}>
                      {evaluationData.recommendation.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Score</div>
                      <div className="text-2xl font-bold">{evaluationData.score}/100</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Asking Price:</span>
                        <span className="font-semibold">{formatCurrency(evaluationData.priceAnalysis.askingPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Value:</span>
                        <span className="font-semibold">{formatCurrency(evaluationData.priceAnalysis.estimatedValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Difference:</span>
                        <span className={`font-semibold ${evaluationData.priceAnalysis.difference <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {evaluationData.priceAnalysis.difference >= 0 ? '+' : ''}{formatCurrency(evaluationData.priceAnalysis.difference)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Price vs Market:</span>
                        <span className={`font-semibold ${evaluationData.priceAnalysis.percentageAboveBelow <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {evaluationData.priceAnalysis.percentageAboveBelow >= 0 ? '+' : ''}{evaluationData.priceAnalysis.percentageAboveBelow}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Percentile:</span>
                        <span className="font-semibold">{evaluationData.marketComparison.percentile}th percentile</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Better Than:</span>
                        <span className="font-semibold">{evaluationData.marketComparison.betterThanPercent}% of market</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Positives */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      Positives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluationData.positives.map((positive, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{positive}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Risks */}
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      Risks & Considerations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluationData.risks.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Negotiation Advice */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Negotiation Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Suggested Offer:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(evaluationData.negotiationAdvice.suggestedOffer)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maximum Recommended:</span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(evaluationData.negotiationAdvice.maxRecommended)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Negotiation Points:</h4>
                    <ul className="space-y-1">
                      {evaluationData.negotiationAdvice.negotiationPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-2 w-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Reasons */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {evaluationData.reasons.map((reason, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

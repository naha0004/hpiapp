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
  Gift,
  CreditCard,
  Banknote,
  PoundSterling
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
  
  console.log('🚗 IntegratedHPIValuation component loaded')
  console.log('🚗 Registration:', registration)
  console.log('🚗 Vehicle data:', vehicleData)
  
  // Valuation state
  const [mileage, setMileage] = useState("")
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good')
  const [isLoadingValuation, setIsLoadingValuation] = useState(false)
  const [valuationData, setValuationData] = useState<ValuationData | null>(null)
  const [showValuation, setShowValuation] = useState(false)
  
  // Finance state
  const [financeType, setFinanceType] = useState<'hp' | 'pcp'>('hp')
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [financeTermMonths, setFinanceTermMonths] = useState(48)
  const [selectedPrice, setSelectedPrice] = useState<'suggested' | 'asking'>('suggested')
  const [dataRestored, setDataRestored] = useState(false)
  
  // Purchase evaluation state
  const [askingPrice, setAskingPrice] = useState("")
  const [buyerMileage, setBuyerMileage] = useState("")
  const [buyerCondition, setBuyerCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good')
  const [userLocation, setUserLocation] = useState("") // Location for insurance estimates
  const [userAge, setUserAge] = useState("35") // Age for insurance estimates (default 35)
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false)
  const [evaluationData, setEvaluationData] = useState<PurchaseEvaluation | null>(null)
  const [showPurchaseEval, setShowPurchaseEval] = useState(false)

  // Persist form data to localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('hpi-purchase-form')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        
        // Check if data is recent (within 1 hour to avoid stale data)
        const isRecent = parsed.timestamp && (Date.now() - parsed.timestamp) < 3600000
        
        if (isRecent) {
          if (parsed.askingPrice) setAskingPrice(parsed.askingPrice)
          if (parsed.buyerMileage) setBuyerMileage(parsed.buyerMileage)
          if (parsed.buyerCondition) setBuyerCondition(parsed.buyerCondition)
          if (parsed.financeType) setFinanceType(parsed.financeType)
          if (parsed.depositAmount) setDepositAmount(parsed.depositAmount)
          if (parsed.financeTermMonths) setFinanceTermMonths(parsed.financeTermMonths)
          if (parsed.selectedPrice) setSelectedPrice(parsed.selectedPrice)
          if (parsed.showPurchaseEval) setShowPurchaseEval(parsed.showPurchaseEval)
          if (parsed.evaluationData) setEvaluationData(parsed.evaluationData)
          if (parsed.showValuation) setShowValuation(parsed.showValuation)
          if (parsed.valuationData) setValuationData(parsed.valuationData)
          
          // Show restore notification
          setDataRestored(true)
          setTimeout(() => setDataRestored(false), 3000)
        } else {
          // Clear stale data
          localStorage.removeItem('hpi-purchase-form')
        }
      } catch (e) {
        console.log('Error loading saved form data:', e)
      }
    }
  }, [])

  // Save form data and evaluation results whenever they change
  useEffect(() => {
    const formData = {
      askingPrice,
      buyerMileage,
      buyerCondition,
      financeType,
      depositAmount,
      financeTermMonths,
      selectedPrice,
      showPurchaseEval,
      evaluationData,
      showValuation,
      valuationData,
      timestamp: Date.now() // Add timestamp to track freshness
    }
    localStorage.setItem('hpi-purchase-form', JSON.stringify(formData))
  }, [askingPrice, buyerMileage, buyerCondition, financeType, depositAmount, financeTermMonths, selectedPrice, showPurchaseEval, evaluationData, showValuation, valuationData])

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
    e.stopPropagation()
    
    console.log('🎯 Purchase evaluation triggered')
    console.log('🎯 Form data:', { askingPrice, buyerMileage, buyerCondition, registration })
    
    if (!askingPrice.trim() || !buyerMileage.trim()) {
      console.log('❌ Form validation failed')
      toast({
        title: "Required Fields",
        description: "Please fill in asking price and mileage",
        variant: "destructive",
      })
      return
    }

    console.log('✅ Form validation passed, starting API call')
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
        
        // Set default deposit (10% of suggested offer)
        if (result.data?.negotiationAdvice?.suggestedOffer) {
          const defaultDeposit = Math.round(result.data.negotiationAdvice.suggestedOffer * 0.1)
          setDepositAmount(defaultDeposit)
          setSelectedPrice('suggested') // Default to suggested price
        }
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

  // Enhanced finance calculation helper
  const calculateAdvancedFinanceEstimate = (vehiclePrice: number, customDeposit: number, type: 'hp' | 'pcp', termMonths: number, vehicleData?: any) => {
    const deposit = Math.min(customDeposit, vehiclePrice * 0.9) // Max 90% finance
    const financeAmount = vehiclePrice - deposit
    
    // APR estimates based on vehicle age and finance type
    const vehicleAge = vehicleData?.yearOfManufacture ? 
      new Date().getFullYear() - parseInt(vehicleData.yearOfManufacture) : 5
    
    let baseAPR = type === 'hp' ? 7.9 : 8.9 // PCP typically higher APR
    if (vehicleAge > 8) baseAPR += 2.0
    if (vehiclePrice < 10000) baseAPR += 1.5
    
    const monthlyRate = baseAPR / 100 / 12
    
    if (type === 'hp') {
      // Hire Purchase - simple monthly payments, own the car at the end
      const monthlyPayment = financeAmount > 0 ? Math.round(
        (financeAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
        (Math.pow(1 + monthlyRate, termMonths) - 1)
      ) : 0
      
      return {
        type: 'hp',
        typeName: 'Hire Purchase',
        description: 'Own the car at the end',
        deposit,
        financeAmount,
        monthlyPayment,
        finalPayment: 0,
        totalCost: deposit + (monthlyPayment * termMonths),
        apr: baseAPR,
        termMonths
      }
    } else {
      // PCP - lower monthly payments, balloon payment at the end
      const vehicleResidualValue = Math.round(vehiclePrice * (termMonths <= 36 ? 0.45 : 0.35)) // Residual value
      const depreciationAmount = financeAmount - vehicleResidualValue
      
      const monthlyPayment = depreciationAmount > 0 ? Math.round(
        (depreciationAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
        (Math.pow(1 + monthlyRate, termMonths) - 1)
      ) : 0
      
      return {
        type: 'pcp',
        typeName: 'Personal Contract Purchase',
        description: 'Lower monthly payments, optional final payment',
        deposit,
        financeAmount,
        monthlyPayment,
        finalPayment: vehicleResidualValue,
        totalCost: deposit + (monthlyPayment * termMonths) + vehicleResidualValue,
        apr: baseAPR,
        termMonths,
        options: [
          'Return the vehicle (subject to fair wear and tear)',
          `Pay ${formatCurrency(vehicleResidualValue)} to keep the vehicle`,
          'Part-exchange for a new vehicle'
        ]
      }
    }
  }

  // Insurance calculation helper
  const calculateInsuranceEstimate = (vehicleData?: any, vehiclePrice?: number, userArea?: string, driverAge?: string) => {
    // Base factors for insurance calculation
    let baseAnnual = 800 // Base annual premium for average driver
    
    // **IMPROVED: Use insurance group for more accurate estimates**
    const insuranceGroup = vehicleData?.insuranceGroup || vehicleData?.results?.insuranceGroup
    if (insuranceGroup) {
      // Insurance groups range from 1-50, where 1 is cheapest and 50 is most expensive
      // Apply a more sophisticated calculation based on insurance group
      if (insuranceGroup <= 10) {
        baseAnnual = 600 // Low risk groups (1-10)
      } else if (insuranceGroup <= 20) {
        baseAnnual = 800 // Medium-low risk groups (11-20)
      } else if (insuranceGroup <= 30) {
        baseAnnual = 1100 // Medium-high risk groups (21-30)
      } else if (insuranceGroup <= 40) {
        baseAnnual = 1500 // High risk groups (31-40)
      } else {
        baseAnnual = 2200 // Very high risk groups (41-50)
      }
    }
    
    // **NEW: Age-based adjustments - major factor in UK insurance**
    const age = parseInt(driverAge || '35')
    if (age < 21) {
      baseAnnual *= 2.5 // Very high risk for under 21
    } else if (age < 25) {
      baseAnnual *= 1.8 // High risk for 21-24
    } else if (age < 30) {
      baseAnnual *= 1.4 // Medium-high risk for 25-29
    } else if (age >= 30 && age <= 50) {
      baseAnnual *= 1.0 // Sweet spot - baseline rates
    } else if (age > 50 && age <= 65) {
      baseAnnual *= 0.9 // Slightly lower for experienced drivers
    } else if (age > 65) {
      baseAnnual *= 1.1 // Slightly higher for elderly drivers
    }
    
    // Vehicle value factor - more nuanced approach
    if (vehiclePrice) {
      if (vehiclePrice > 50000) baseAnnual *= 1.4 // Luxury vehicles
      else if (vehiclePrice > 30000) baseAnnual *= 1.2 // Premium vehicles
      else if (vehiclePrice > 20000) baseAnnual *= 1.1 // Mid-range vehicles
      else if (vehiclePrice < 5000) baseAnnual *= 0.8 // Budget vehicles
    }
    
    // Vehicle age factor - refined calculation
    const vehicleAge = vehicleData?.yearOfManufacture ? 
      new Date().getFullYear() - parseInt(vehicleData.yearOfManufacture) : 5
    
    if (vehicleAge < 1) baseAnnual *= 1.5 // Brand new cars
    else if (vehicleAge < 3) baseAnnual *= 1.3 // Nearly new cars
    else if (vehicleAge >= 3 && vehicleAge <= 5) baseAnnual *= 1.0 // Sweet spot age
    else if (vehicleAge > 10) baseAnnual *= 0.85 // Older cars cost less
    else if (vehicleAge > 15) baseAnnual *= 0.7 // Very old cars
    
    // Make-specific adjustments - expanded list
    const make = vehicleData?.make?.toUpperCase() || ''
    if (['FERRARI', 'LAMBORGHINI', 'MCLAREN', 'BENTLEY', 'ROLLS-ROYCE'].includes(make)) {
      baseAnnual *= 1.8 // Supercars
    } else if (['BMW', 'MERCEDES-BENZ', 'MERCEDES', 'AUDI', 'JAGUAR', 'LEXUS', 'PORSCHE'].includes(make)) {
      baseAnnual *= 1.3 // Premium brands
    } else if (['FORD', 'VAUXHALL', 'VOLKSWAGEN', 'TOYOTA', 'HONDA', 'NISSAN'].includes(make)) {
      baseAnnual *= 0.9 // Common makes
    } else if (['DACIA', 'SUZUKI', 'HYUNDAI', 'KIA', 'SKODA'].includes(make)) {
      baseAnnual *= 0.8 // Budget brands
    }
    
    // Engine size factor (if available)
    const engineSize = vehicleData?.engineSize || vehicleData?.vehicleCheck?.engineSize
    if (engineSize) {
      const size = parseFloat(engineSize.toString().replace('L', '').replace('l', ''))
      if (size >= 3.0) baseAnnual *= 1.4 // Large engines
      else if (size >= 2.0) baseAnnual *= 1.2 // Medium engines
      else if (size <= 1.2) baseAnnual *= 0.9 // Small engines
    }
    
    // Fuel type adjustments (if available)
    const fuelType = vehicleData?.fuelType || vehicleData?.vehicleCheck?.fuelType
    if (fuelType) {
      const fuel = fuelType.toUpperCase()
      if (fuel.includes('ELECTRIC') || fuel.includes('EV')) {
        baseAnnual *= 0.9 // Electric vehicles often cheaper to insure
      } else if (fuel.includes('HYBRID')) {
        baseAnnual *= 0.95 // Hybrid vehicles slightly cheaper
      } else if (fuel.includes('DIESEL')) {
        baseAnnual *= 1.05 // Diesel slightly more expensive
      }
    }
    
    // **NEW: UK Regional adjustments based on typical insurance variations**
    // Using general area-based multipliers for different UK regions
    // This provides realistic regional variations without requiring exact postcodes
    const getLocationMultiplier = (area?: string) => {
      if (!area) return 1.05 // Default UK average with slight urban bias
      
      const location = area.toLowerCase().trim()
      
      // Very high risk areas (major urban centers with high crime/traffic)
      const veryHighRisk = ['london', 'greater london', 'inner london', 'central london']
      if (veryHighRisk.some(city => location.includes(city))) return 1.4
      
      // High risk urban areas
      const highRisk = ['birmingham', 'manchester', 'liverpool', 'bradford', 'coventry', 
                       'leicester', 'nottingham', 'wolverhampton', 'stoke-on-trent', 'blackpool']
      if (highRisk.some(city => location.includes(city))) return 1.2
      
      // Medium-high risk areas
      const mediumHighRisk = ['leeds', 'sheffield', 'bristol', 'glasgow', 'newcastle', 
                             'cardiff', 'belfast', 'southampton', 'portsmouth', 'hull']
      if (mediumHighRisk.some(city => location.includes(city))) return 1.1
      
      // Medium risk areas
      const mediumRisk = ['edinburgh', 'brighton', 'plymouth', 'preston', 'luton', 'reading', 
                         'northampton', 'milton keynes', 'swindon', 'bournemouth']
      if (mediumRisk.some(city => location.includes(city))) return 1.0
      
      // Lower risk areas (smaller cities, towns, rural)
      const lowerRisk = ['york', 'bath', 'chester', 'oxford', 'cambridge', 'canterbury', 'durham',
                        'exeter', 'winchester', 'chichester', 'rural', 'countryside', 'village', 'small town']
      if (lowerRisk.some(area => location.includes(area))) return 0.85
      
      // Scottish Highlands, Welsh valleys, rural areas
      const ruralAreas = ['highlands', 'aberdeenshire', 'dumfries', 'galloway', 'pembrokeshire', 
                         'powys', 'ceredigion', 'gwynedd', 'isle of', 'cornwall', 'devon', 'cumbria', 'northumberland']
      if (ruralAreas.some(area => location.includes(area))) return 0.8
      
      return 1.0 // Default for unrecognized areas
    }
    
    const locationMultiplier = getLocationMultiplier(userLocation)
    baseAnnual *= locationMultiplier
    
    // Round to reasonable values
    baseAnnual = Math.round(baseAnnual)
    
    // Build comprehensive factors list
    const factors = [
      `Driver age: ${age} years old`,
      `Vehicle age: ${vehicleAge} years`,
      `Make: ${vehicleData?.make || 'Unknown'}`,
      `Estimated value: ${vehiclePrice ? formatCurrency(vehiclePrice) : 'Unknown'}`,
      `Location: ${
        locationMultiplier >= 1.4 ? 'London/High risk urban' :
        locationMultiplier >= 1.2 ? 'Major city' :
        locationMultiplier >= 1.1 ? 'Medium city' :
        locationMultiplier >= 1.0 ? 'Average UK area' :
        locationMultiplier >= 0.85 ? 'Small town/suburban' : 'Rural area'
      } (${locationMultiplier > 1 ? '+' : ''}${Math.round((locationMultiplier - 1) * 100)}%)`
    ]
    
    if (insuranceGroup) {
      factors.unshift(`Insurance group: ${insuranceGroup}/50 (${
        insuranceGroup <= 10 ? 'Low risk' :
        insuranceGroup <= 20 ? 'Medium-low risk' :
        insuranceGroup <= 30 ? 'Medium-high risk' :
        insuranceGroup <= 40 ? 'High risk' : 'Very high risk'
      })`)
    }
    
    if (engineSize) {
      factors.push(`Engine size: ${engineSize}${typeof engineSize === 'number' ? 'L' : ''}`)
    }
    
    if (fuelType) {
      factors.push(`Fuel type: ${fuelType}`)
    }
    
    // Different coverage levels
    return {
      thirdParty: Math.round(baseAnnual * 0.55),
      thirdPartyFireTheft: Math.round(baseAnnual * 0.7),
      comprehensive: Math.round(baseAnnual),
      monthly: Math.round(baseAnnual / 12),
      factors,
      insuranceGroup,
      riskLevel: insuranceGroup ? (
        insuranceGroup <= 10 ? 'Low' :
        insuranceGroup <= 20 ? 'Medium-Low' :
        insuranceGroup <= 30 ? 'Medium-High' :
        insuranceGroup <= 40 ? 'High' : 'Very High'
      ) : 'Unknown'
    }
  }

  return (
    <div className="space-y-6">
      {/* Data Restored Notification */}
      {dataRestored && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Previous data restored successfully</span>
        </div>
      )}
      
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
                      <Button 
                        type="submit" 
                        disabled={isLoadingEvaluation} 
                        className="w-full"
                        onClick={() => console.log('🔘 Purchase advice button clicked!')}
                      >
                        {isLoadingEvaluation ? "Analyzing..." : "Get Purchase Advice"}
                      </Button>
                    </form>
                  ) : evaluationData && (
                    <div 
                      className="space-y-4" 
                      onClick={(e) => e.stopPropagation()} 
                      onMouseDown={(e) => e.stopPropagation()}
                    >
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

                      {/* Finance Calculator */}
                      {evaluationData && (
                        <Card className="border-l-4 border-l-green-500">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-900">
                              <CreditCard className="h-5 w-5" />
                              Finance Calculator
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  localStorage.removeItem('hpi-purchase-form')
                                  // Reset all state
                                  setAskingPrice("")
                                  setBuyerMileage("")
                                  setBuyerCondition('good')
                                  setFinanceType('hp')
                                  setDepositAmount(0)
                                  setFinanceTermMonths(48)
                                  setSelectedPrice('suggested')
                                  setShowPurchaseEval(false)
                                  setEvaluationData(null)
                                  setShowValuation(false)
                                  setValuationData(null)
                                }}
                                className="ml-auto text-xs text-gray-500 hover:text-red-500 underline"
                                title="Clear all saved data and start fresh"
                              >
                                Clear Data
                              </button>
                            </CardTitle>
                            <CardDescription>
                              Calculate HP or PCP payments for different price scenarios
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Finance Options Form */}
                            <div 
                              className="bg-gray-50 rounded-lg p-4 mb-4"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price Scenario
                                  </label>
                                  <select 
                                    value={selectedPrice} 
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      const newPrice = e.target.value as 'suggested' | 'asking'
                                      setSelectedPrice(newPrice)
                                      // Update deposit to 10% of selected price
                                      const price = newPrice === 'suggested' 
                                        ? evaluationData.negotiationAdvice.suggestedOffer 
                                        : parseInt(askingPrice) || 0
                                      setDepositAmount(Math.round(price * 0.1))
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                  >
                                    <option value="suggested">Suggested Offer ({formatCurrency(evaluationData.negotiationAdvice.suggestedOffer)})</option>
                                    <option value="asking">Asking Price ({formatCurrency(parseInt(askingPrice) || 0)})</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Finance Type
                                  </label>
                                  <select 
                                    value={financeType} 
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      setFinanceType(e.target.value as 'hp' | 'pcp')
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                  >
                                    <option value="hp">Hire Purchase (HP)</option>
                                    <option value="pcp">Personal Contract Purchase (PCP)</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Deposit Amount (£)
                                  </label>
                                  <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      setDepositAmount(parseInt(e.target.value) || 0)
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    min="0"
                                    max={selectedPrice === 'suggested' ? evaluationData.negotiationAdvice.suggestedOffer : parseInt(askingPrice) || 0}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter deposit"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Finance Term
                                  </label>
                                  <select 
                                    value={financeTermMonths} 
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      setFinanceTermMonths(parseInt(e.target.value))
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                  >
                                    <option value={24}>2 Years</option>
                                    <option value={36}>3 Years</option>
                                    <option value={48}>4 Years</option>
                                    <option value={60}>5 Years</option>
                                  </select>
                                </div>
                              </div>
                              
                              {/* Finance Calculation Results */}
                              {(() => {
                                const vehiclePrice = selectedPrice === 'suggested' 
                                  ? evaluationData.negotiationAdvice.suggestedOffer 
                                  : parseInt(askingPrice) || 0
                                const financeResult = calculateAdvancedFinanceEstimate(
                                  vehiclePrice, 
                                  depositAmount, 
                                  financeType, 
                                  financeTermMonths, 
                                  vehicleData
                                )
                                
                                return (
                                  <div className="bg-white rounded-lg p-4 border border-green-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <h4 className="font-medium text-green-900">{financeResult.typeName}</h4>
                                        <p className="text-sm text-gray-600">
                                          Based on {selectedPrice === 'suggested' ? 'suggested offer' : 'asking price'}: {formatCurrency(vehiclePrice)}
                                        </p>
                                      </div>
                                      <span className="text-sm text-green-600">{financeResult.description}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                      <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                          {formatCurrency(financeResult.deposit)}
                                        </div>
                                        <div className="text-sm text-gray-600">Deposit</div>
                                      </div>
                                      
                                      <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                          {formatCurrency(financeResult.monthlyPayment)}
                                        </div>
                                        <div className="text-sm text-gray-600">Monthly Payment</div>
                                      </div>
                                      
                                      {financeResult.finalPayment > 0 && (
                                        <div className="text-center">
                                          <div className="text-2xl font-bold text-orange-600">
                                            {formatCurrency(financeResult.finalPayment)}
                                          </div>
                                          <div className="text-sm text-gray-600">Final Payment</div>
                                        </div>
                                      )}
                                      
                                      <div className="text-center">
                                        <div className="text-lg font-semibold text-gray-700">
                                          {financeResult.apr.toFixed(1)}% APR
                                        </div>
                                        <div className="text-sm text-gray-600">Representative</div>
                                      </div>
                                    </div>
                                    
                                    {financeResult.type === 'pcp' && financeResult.options && (
                                      <div className="mt-4 pt-4 border-t border-green-200">
                                        <h5 className="font-medium text-green-900 mb-2">At the end of the term, you can:</h5>
                                        <ul className="text-sm text-green-700 space-y-1">
                                          {financeResult.options.map((option, idx) => (
                                            <li key={idx} className="flex items-center">
                                              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                              {option}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    
                                    <div className="mt-4 pt-4 border-t border-green-200 text-center">
                                      <div className="text-sm text-gray-600">
                                        Total amount payable: <span className="font-semibold">{formatCurrency(financeResult.totalCost)}</span>
                                      </div>
                                      
                                      {/* Price Comparison */}
                                      {(() => {
                                        const suggestedPrice = evaluationData.negotiationAdvice.suggestedOffer
                                        const askingPriceValue = parseInt(askingPrice) || 0
                                        const priceDifference = askingPriceValue - suggestedPrice
                                        
                                        if (priceDifference > 0) {
                                          return (
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                              <p className="text-xs text-gray-600">
                                                {selectedPrice === 'asking' ? (
                                                  <span className="text-orange-600">
                                                    💡 You could save {formatCurrency(priceDifference)} by negotiating to the suggested price
                                                  </span>
                                                ) : (
                                                  <span className="text-green-600">
                                                    ✅ Potential savings of {formatCurrency(priceDifference)} vs asking price
                                                  </span>
                                                )}
                                              </p>
                                            </div>
                                          )
                                        }
                                        return null
                                      })()}
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-600">
                                <Info className="h-3 w-3 inline mr-1" />
                                Estimates based on good credit rating. Actual rates may vary. Representative APR shown.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Insurance Estimates */}
                      {evaluationData && (
                        <Card className="border-l-4 border-l-purple-500">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-900">
                              <Shield className="h-5 w-5" />
                              Insurance Estimates
                            </CardTitle>
                            <CardDescription className="flex items-center justify-between">
                              <span>Annual insurance costs for this vehicle</span>
                              {(() => {
                                const tempEstimate = calculateInsuranceEstimate(vehicleData, evaluationData.negotiationAdvice.suggestedOffer, userLocation, userAge)
                                if (tempEstimate.insuranceGroup) {
                                  return (
                                    <Badge 
                                      variant={
                                        tempEstimate.riskLevel === 'Low' ? 'default' :
                                        tempEstimate.riskLevel === 'Medium-Low' ? 'secondary' :
                                        tempEstimate.riskLevel === 'Medium-High' ? 'outline' : 'destructive'
                                      }
                                      className={
                                        tempEstimate.riskLevel === 'Low' ? 'bg-green-100 text-green-800 border-green-300' :
                                        tempEstimate.riskLevel === 'Medium-Low' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                        tempEstimate.riskLevel === 'Medium-High' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                        'bg-red-100 text-red-800 border-red-300'
                                      }
                                    >
                                      Group {tempEstimate.insuranceGroup}/50 • {tempEstimate.riskLevel} Risk
                                    </Badge>
                                  )
                                }
                                return null
                              })()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Location and Age Selectors for Insurance */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {/* Location Selector */}
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <label className="block text-sm font-medium text-blue-900 mb-2">
                                  Your Location
                                </label>
                                <select
                                  value={userLocation}
                                  onChange={(e) => setUserLocation(e.target.value)}
                                  className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                  <option value="">Select area (optional)</option>
                                  <optgroup label="High Risk Areas">
                                    <option value="london">London</option>
                                    <option value="birmingham">Birmingham</option>
                                    <option value="manchester">Manchester</option>
                                    <option value="liverpool">Liverpool</option>
                                    <option value="bradford">Bradford</option>
                                  </optgroup>
                                  <optgroup label="Medium-High Risk Areas">
                                    <option value="leeds">Leeds</option>
                                    <option value="sheffield">Sheffield</option>
                                    <option value="bristol">Bristol</option>
                                    <option value="glasgow">Glasgow</option>
                                    <option value="newcastle">Newcastle</option>
                                    <option value="cardiff">Cardiff</option>
                                    <option value="belfast">Belfast</option>
                                  </optgroup>
                                  <optgroup label="Medium Risk Areas">
                                    <option value="edinburgh">Edinburgh</option>
                                    <option value="brighton">Brighton</option>
                                    <option value="plymouth">Plymouth</option>
                                    <option value="bournemouth">Bournemouth</option>
                                    <option value="reading">Reading</option>
                                  </optgroup>
                                  <optgroup label="Lower Risk Areas">
                                    <option value="york">York</option>
                                    <option value="bath">Bath</option>
                                    <option value="chester">Chester</option>
                                    <option value="oxford">Oxford</option>
                                    <option value="cambridge">Cambridge</option>
                                    <option value="rural">Rural area</option>
                                    <option value="small town">Small town</option>
                                  </optgroup>
                                </select>
                              </div>

                              {/* Age Selector */}
                              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <label className="block text-sm font-medium text-purple-900 mb-2">
                                  Your Age
                                </label>
                                <select
                                  value={userAge}
                                  onChange={(e) => setUserAge(e.target.value)}
                                  className="w-full border border-purple-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                  <optgroup label="Higher Risk Ages">
                                    <option value="17">17-20 (New drivers)</option>
                                    <option value="21">21-24 (Young drivers)</option>
                                    <option value="25">25-29 (Developing experience)</option>
                                  </optgroup>
                                  <optgroup label="Lower Risk Ages">
                                    <option value="30">30-39 (Experienced)</option>
                                    <option value="35">35-44 (Lowest risk)</option>
                                    <option value="45">45-54 (Very experienced)</option>
                                    <option value="55">55-64 (Mature drivers)</option>
                                  </optgroup>
                                  <optgroup label="Senior Drivers">
                                    <option value="65">65-74 (Senior drivers)</option>
                                    <option value="75">75+ (Elderly drivers)</option>
                                  </optgroup>
                                </select>
                                <div className="mt-2 text-xs text-purple-700">
                                  Age is a major factor in UK insurance pricing
                                </div>
                              </div>
                            </div>

                            {(userLocation || userAge !== '35') && (
                              <div className="mb-4 text-sm text-blue-700 bg-blue-50 p-3 rounded border">
                                Insurance estimate personalized for{' '}
                                {userAge !== '35' && `${userAge} year old driver`}
                                {userLocation && userAge !== '35' && ' in '}
                                {userLocation && `${userLocation} area`}
                              </div>
                            )}
                            
                            {(() => {
                              const insuranceEstimate = calculateInsuranceEstimate(vehicleData, evaluationData.negotiationAdvice.suggestedOffer, userLocation, userAge)
                              return (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                      <h4 className="font-semibold text-sm text-purple-900 mb-1">Third Party</h4>
                                      <div className="text-2xl font-bold text-purple-700">{formatCurrency(insuranceEstimate.thirdParty)}</div>
                                      <div className="text-xs text-gray-600">per year</div>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                      <h4 className="font-semibold text-sm text-purple-900 mb-1">Third Party F&T</h4>
                                      <div className="text-2xl font-bold text-purple-700">{formatCurrency(insuranceEstimate.thirdPartyFireTheft)}</div>
                                      <div className="text-xs text-gray-600">per year</div>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                      <h4 className="font-semibold text-sm text-purple-900 mb-1">Comprehensive</h4>
                                      <div className="text-2xl font-bold text-purple-700">{formatCurrency(insuranceEstimate.comprehensive)}</div>
                                      <div className="text-xs text-gray-600">per year</div>
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Calculator className="h-4 w-4 text-gray-600" />
                                      <span className="font-medium text-sm">Monthly Budget</span>
                                    </div>
                                    <div className="text-lg font-bold text-gray-800">
                                      ~{formatCurrency(insuranceEstimate.monthly)} per month
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      Based on comprehensive coverage
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <h4 className="font-semibold text-sm text-gray-700">Factors considered:</h4>
                                    {insuranceEstimate.factors.map((factor, index) => (
                                      <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                                        <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                                        {factor}
                                      </div>
                                    ))}
                                  </div>

                                  <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
                                    <p className="text-xs text-gray-600">
                                      <Info className="h-3 w-3 inline mr-1" />
                                      Estimates are personalized for the selected age and location. Actual quotes may vary significantly based on personal circumstances, driving history, and claims record.
                                    </p>
                                    {insuranceEstimate.insuranceGroup && (
                                      <p className="text-xs text-gray-600">
                                        <Shield className="h-3 w-3 inline mr-1" />
                                        Insurance groups (1-50) are set by the Group Rating Panel and consider factors like car value, repair costs, security features, and safety ratings. Lower groups typically mean lower premiums.
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-600">
                                      <Target className="h-3 w-3 inline mr-1" />
                                      Location significantly affects insurance costs in the UK. Prices can vary by up to 40% between regions - London and major cities typically cost more, while rural areas often have lower premiums due to reduced theft and accident rates.
                                    </p>
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                      <div className="bg-red-50 p-2 rounded border-l-2 border-red-300">
                                        <div className="font-medium text-red-800">Higher Cost Areas</div>
                                        <div className="text-red-700">London (+40%), Birmingham/Manchester (+20%)</div>
                                      </div>
                                      <div className="bg-green-50 p-2 rounded border-l-2 border-green-300">
                                        <div className="font-medium text-green-800">Lower Cost Areas</div>
                                        <div className="text-green-700">Rural areas (-20%), Small towns (-15%)</div>
                                      </div>
                                    </div>
                                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                      <div className="font-medium">Example areas by risk:</div>
                                      <div className="mt-1 grid grid-cols-1 gap-1">
                                        <div><strong>Very High:</strong> London, Inner London</div>
                                        <div><strong>High:</strong> Birmingham, Manchester, Liverpool, Bradford</div>
                                        <div><strong>Medium:</strong> Edinburgh, Brighton, Plymouth, Cardiff</div>
                                        <div><strong>Low:</strong> York, Bath, Chester, Rural Scotland/Wales</div>
                                      </div>
                                    </div>
                                    <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
                                      <div className="font-medium">Age impact on premiums:</div>
                                      <div className="mt-1 grid grid-cols-2 gap-1">
                                        <div><strong>17-20:</strong> +150% (New drivers)</div>
                                        <div><strong>21-24:</strong> +80% (Young drivers)</div>
                                        <div><strong>25-29:</strong> +40% (Developing experience)</div>
                                        <div><strong>30-50:</strong> Baseline (Lowest rates)</div>
                                        <div><strong>50-65:</strong> -10% (Experience discount)</div>
                                        <div><strong>65+:</strong> +10% (Slight increase)</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}
                          </CardContent>
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

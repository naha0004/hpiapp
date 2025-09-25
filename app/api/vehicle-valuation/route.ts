import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface ValuationRequest {
  registration: string
  mileage?: number
  condition?: 'excellent' | 'good' | 'fair' | 'poor'
}

interface ValuationResponse {
  success: boolean
  data?: {
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
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: ValuationRequest = await request.json()
    const { registration, mileage, condition = 'good' } = body

    if (!registration) {
      return NextResponse.json(
        { error: 'Vehicle registration is required' },
        { status: 400 }
      )
    }

    console.log(`🏷️ Valuation request for: ${registration}`)

    // Use the existing OneAuto integration instead of calling API directly
    // This ensures we use the same mock system and configuration
    const { runOneAutoSandboxHpiCheck } = await import('@/lib/oneauto')
    
    try {
      console.log('Calling runOneAutoSandboxHpiCheck...')
      const hpiResult = await runOneAutoSandboxHpiCheck(registration.toUpperCase())
      console.log('HPI Result received:', hpiResult ? 'Success' : 'No result')
      
      if (hpiResult?.vehicleCheck) {
        console.log('Vehicle check data found:', hpiResult.vehicleCheck)
      } else {
        console.log('No vehicle check data, full result:', JSON.stringify(hpiResult, null, 2))
      }

      if (!hpiResult || !hpiResult.vehicleCheck) {
        console.log('No vehicle data available for valuation')
        return NextResponse.json({
          success: false,
          error: 'Vehicle not found or invalid registration'
        })
      }

      const vehicle = hpiResult.vehicleCheck
      
      // Extract vehicle details
      const make = vehicle.make || 'UNKNOWN'
      const model = vehicle.model || 'UNKNOWN'
      const year = vehicle.yearOfManufacture ? 
        parseInt(vehicle.yearOfManufacture) : 
        new Date().getFullYear() - 5 // Default to 5 years old if no year available
      
      console.log(`Vehicle details - Make: ${make}, Model: ${model}, Year: ${year}`)

      // Calculate mock valuation based on vehicle data
      // In a real system, this would call OneAuto's valuation API
      const baseValue = calculateBaseValue(make, model, year)
      const mileageAdjustment = mileage ? calculateMileageAdjustment(mileage, year) : 0
      const conditionAdjustment = calculateConditionAdjustment(condition)
      
      const adjustedValue = baseValue + mileageAdjustment + conditionAdjustment

      const valuationResponse: ValuationResponse = {
        success: true,
        data: {
          registration: registration.toUpperCase(),
          make,
          model,
          year,
          estimatedValue: {
            trade: Math.round(adjustedValue * 0.75),
            retail: Math.round(adjustedValue * 1.15),
            partEx: Math.round(adjustedValue * 0.85),
            private: Math.round(adjustedValue)
          },
          marketData: {
            averagePrice: Math.round(adjustedValue),
            priceRange: {
              min: Math.round(adjustedValue * 0.8),
              max: Math.round(adjustedValue * 1.2)
            },
            daysToSell: calculateDaysToSell(make, model),
            demand: calculateDemand(make, model),
            supply: calculateSupply(make, model)
          },
          adjustments: {
            mileage: mileageAdjustment,
            condition: conditionAdjustment,
            total: mileageAdjustment + conditionAdjustment
          }
        }
      }

      return NextResponse.json(valuationResponse)

    } catch (innerError) {
      console.error('HPI lookup error:', innerError)
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve vehicle information'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Valuation API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// Mock calculation functions (in production, these would be more sophisticated)
function calculateBaseValue(make: string, model: string, year: number): number {
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  
  // Base values by make (mock data)
  const baseValues: Record<string, number> = {
    'BMW': 25000,
    'MERCEDES': 28000,
    'AUDI': 24000,
    'VOLKSWAGEN': 18000,
    'FORD': 15000,
    'VAUXHALL': 12000,
    'NISSAN': 16000,
    'TOYOTA': 17000,
    'HONDA': 16500,
    'PEUGEOT': 13000,
    'RENAULT': 12500,
    'CITROEN': 11000,
    'HYUNDAI': 14000,
    'KIA': 13500,
    'SKODA': 15000,
    'SEAT': 14500,
  }

  const baseValue = baseValues[make.toUpperCase()] || 15000
  
  // Depreciation: roughly 15% per year for first 5 years, then 8% per year
  let depreciatedValue = baseValue
  for (let i = 0; i < age; i++) {
    const depreciationRate = i < 5 ? 0.15 : 0.08
    depreciatedValue *= (1 - depreciationRate)
  }
  
  return Math.max(depreciatedValue, baseValue * 0.1) // Minimum 10% of original value
}

function calculateMileageAdjustment(mileage: number, year: number): number {
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  const expectedMileage = age * 12000 // Average 12k miles per year
  const mileageDifference = mileage - expectedMileage
  
  // Rough adjustment: £0.10 per mile difference
  return Math.round(mileageDifference * -0.10)
}

function calculateConditionAdjustment(condition: string): number {
  const adjustments = {
    'excellent': 2000,
    'good': 0,
    'fair': -1500,
    'poor': -3000
  }
  return adjustments[condition as keyof typeof adjustments] || 0
}

function calculateDaysToSell(make: string, model: string): number {
  // Popular brands sell faster
  const popularBrands = ['BMW', 'MERCEDES', 'AUDI', 'VOLKSWAGEN', 'FORD']
  return popularBrands.includes(make.toUpperCase()) ? 25 : 45
}

function calculateDemand(make: string, model: string): 'high' | 'medium' | 'low' {
  const highDemandBrands = ['BMW', 'MERCEDES', 'AUDI', 'TOYOTA', 'HONDA']
  return highDemandBrands.includes(make.toUpperCase()) ? 'high' : 'medium'
}

function calculateSupply(make: string, model: string): 'high' | 'medium' | 'low' {
  const commonBrands = ['FORD', 'VAUXHALL', 'VOLKSWAGEN']
  return commonBrands.includes(make.toUpperCase()) ? 'high' : 'medium'
}

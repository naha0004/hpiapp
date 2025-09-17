/**
 * DVLA Open Data API Service
 * UK Government vehicle registration database
 * 
 * Provides:
 * - Tax status & expiry
 * - MOT status & expiry 
 * - Make, model, year of manufacture
 * - Engine capacity, fuel type, CO₂ emissions
 * - Color, type approval, wheel configuration
 * - And more official vehicle data
 * 
 * API Documentation: https://dvla-data.api.gov.uk/docs/
 */

interface DVLAVehicleData {
  registrationNumber: string
  taxStatus: 'Taxed' | 'SORN' | 'Untaxed' | 'Not available'
  taxDueDate?: string
  motStatus: 'Valid' | 'No valid MOT' | 'Not available'
  motExpiryDate?: string
  make: string
  markedForExport?: boolean
  colour: string
  typeApproval?: string
  wheelplan?: string
  yearOfManufacture: number
  cylinderCapacity?: number
  co2Emissions?: number
  fuelType: string
  euroStatus?: string
  realDrivingEmissions?: string
  dateOfLastV5CIssued?: string
}

interface DVLAApiResponse {
  success: boolean
  data?: DVLAVehicleData
  error?: string
  message?: string
  sourceUrl?: string
}

class DVLAOpenDataService {
  private readonly baseUrl = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles'
  private apiKey: string

  constructor() {
    this.apiKey = process.env.DVLA_API_KEY || ''
    if (!this.apiKey) {
      console.warn('⚠️ DVLA_API_KEY not configured - using mock data')
    }
  }

  /**
   * Get complete vehicle information from DVLA Open Data API
   */
  async getVehicleData(registration: string): Promise<DVLAApiResponse> {
    const cleanRegistration = registration.replace(/\s+/g, '').toUpperCase()
    
    console.log(`🚗 DVLA API lookup for: ${cleanRegistration}`)

    // If no API key, return mock data for development
    if (!this.apiKey) {
      return this.getMockVehicleData(cleanRegistration)
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'User-Agent': 'ClearRideAI-HPI-Service/1.0'
        },
        body: JSON.stringify({
          registrationNumber: cleanRegistration
        })
      })

      if (!response.ok) {
        // Handle specific DVLA error codes
        if (response.status === 404) {
          return {
            success: false,
            error: 'Vehicle not found in DVLA database',
            message: 'The registration number could not be found'
          }
        }
        
        if (response.status === 429) {
          return {
            success: false,
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.'
          }
        }

        const errorText = await response.text().catch(() => 'Unknown error')
        return {
          success: false,
          error: `DVLA API error (${response.status})`,
          message: errorText
        }
      }

      const data: DVLAVehicleData = await response.json()
      
      return {
        success: true,
        data,
        sourceUrl: 'https://dvla-data.api.gov.uk'
      }

    } catch (error) {
      console.error('DVLA API error:', error)
      return {
        success: false,
        error: 'Failed to connect to DVLA API',
        message: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Mock data for development/testing when API key is not available
   */
  private getMockVehicleData(registration: string): DVLAApiResponse {
    const mockData: DVLAVehicleData = {
      registrationNumber: registration,
      taxStatus: 'Taxed',
      taxDueDate: '2025-12-01',
      motStatus: 'Valid',
      motExpiryDate: '2025-11-15',
      make: 'FORD',
      colour: 'BLUE',
      yearOfManufacture: 2019,
      cylinderCapacity: 1600,
      co2Emissions: 120,
      fuelType: 'PETROL',
      euroStatus: 'EURO6',
      wheelplan: 'FRONT WHEEL DRIVE',
      dateOfLastV5CIssued: '2023-03-15',
      markedForExport: false
    }

    // Simulate different scenarios based on registration
    if (registration.includes('FAIL') || registration.includes('404')) {
      return {
        success: false,
        error: 'Vehicle not found in DVLA database',
        message: 'Mock: Vehicle not found for testing'
      }
    }

    if (registration.includes('SORN')) {
      mockData.taxStatus = 'SORN'
      mockData.motStatus = 'No valid MOT'
    }

    if (registration.includes('UNTAX')) {
      mockData.taxStatus = 'Untaxed'
    }

    return {
      success: true,
      data: mockData,
      sourceUrl: 'Mock DVLA data for development'
    }
  }

  /**
   * Check if vehicle is currently road legal (taxed and MOT valid)
   */
  isVehicleRoadLegal(vehicleData: DVLAVehicleData): {
    isLegal: boolean
    issues: string[]
    warnings: string[]
  } {
    const issues: string[] = []
    const warnings: string[] = []

    // Check tax status
    if (vehicleData.taxStatus === 'Untaxed') {
      issues.push('Vehicle is not taxed')
    } else if (vehicleData.taxStatus === 'SORN') {
      issues.push('Vehicle is registered as SORN (Statutory Off Road Notification)')
    }

    // Check MOT status
    if (vehicleData.motStatus === 'No valid MOT') {
      issues.push('Vehicle does not have a valid MOT certificate')
    }

    // Check MOT expiry
    if (vehicleData.motExpiryDate) {
      const motExpiry = new Date(vehicleData.motExpiryDate)
      const today = new Date()
      const daysUntilExpiry = Math.ceil((motExpiry.getTime() - today.getTime()) / (1000 * 3600 * 24))
      
      if (daysUntilExpiry <= 0) {
        issues.push('MOT certificate has expired')
      } else if (daysUntilExpiry <= 30) {
        warnings.push(`MOT expires in ${daysUntilExpiry} days`)
      }
    }

    // Check tax expiry
    if (vehicleData.taxDueDate && vehicleData.taxStatus === 'Taxed') {
      const taxDue = new Date(vehicleData.taxDueDate)
      const today = new Date()
      const daysUntilTaxDue = Math.ceil((taxDue.getTime() - today.getTime()) / (1000 * 3600 * 24))
      
      if (daysUntilTaxDue <= 0) {
        issues.push('Vehicle tax has expired')
      } else if (daysUntilTaxDue <= 14) {
        warnings.push(`Vehicle tax expires in ${daysUntilTaxDue} days`)
      }
    }

    return {
      isLegal: issues.length === 0,
      issues,
      warnings
    }
  }

  /**
   * Get formatted vehicle summary for HPI reports
   */
  formatForHPI(vehicleData: DVLAVehicleData) {
    const legalStatus = this.isVehicleRoadLegal(vehicleData)
    
    return {
      basicInfo: {
        registration: vehicleData.registrationNumber,
        make: vehicleData.make,
        colour: vehicleData.colour,
        yearOfManufacture: vehicleData.yearOfManufacture,
        fuelType: vehicleData.fuelType,
        engineCapacity: vehicleData.cylinderCapacity,
        co2Emissions: vehicleData.co2Emissions
      },
      taxInfo: {
        status: vehicleData.taxStatus,
        expiryDate: vehicleData.taxDueDate,
        isValid: vehicleData.taxStatus === 'Taxed'
      },
      motInfo: {
        status: vehicleData.motStatus,
        expiryDate: vehicleData.motExpiryDate,
        isValid: vehicleData.motStatus === 'Valid'
      },
      legalStatus,
      additionalInfo: {
        euroStatus: vehicleData.euroStatus,
        wheelplan: vehicleData.wheelplan,
        markedForExport: vehicleData.markedForExport,
        lastV5CIssued: vehicleData.dateOfLastV5CIssued
      }
    }
  }
}

export default DVLAOpenDataService
export type { DVLAVehicleData, DVLAApiResponse }

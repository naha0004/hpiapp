/**
 * DVSA MOT API Service
 * Official UK Government vehicle data integration
 * 
 * Note: DVSA MOT API provides:
 * - MOT test history, test results, expiry dates, defects
 * - Vehicle roadworthiness compliance data
 * 
 * Limitations:
 * - No detailed vehicle specifications
 * - Limited make/model information
 * - Focused on roadworthiness compliance only
 */

import { NextApiRequest, NextApiResponse } from 'next'

interface MOTTestResult {
  completedDate: string
  testResult: 'PASSED' | 'FAILED'
  expiryDate: string
  odometerValue: number
  odometerUnit: 'mi' | 'km'
  motTestNumber: string
  defects?: Array<{
    text: string
    type: 'MINOR' | 'MAJOR' | 'DANGEROUS' | 'ADVISORY'
    dangerous?: boolean
  }>
}

interface DVSAApiResponse {
  success: boolean
  data?: {
    motHistory?: MOTTestResult[]
    vehicleDetails?: any
  }
  error?: string
  message?: string
  limitations?: string[]
  debugInfo?: {
    status?: number
    url?: string
    headers?: string[]
    registration?: string
  }
}

class DVSAApiService {
  private apiKey: string
  private clientId: string
  private clientSecret: string
  private scopeUrl: string
  private authUrl: string
  private motApiUrl: string
  private taxApiUrl: string
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor() {
    this.apiKey = process.env.DVSA_API_KEY || ''
    this.clientId = process.env.DVSA_CLIENT_ID || ''
    this.clientSecret = process.env.DVSA_CLIENT_SECRET || ''
    this.scopeUrl = process.env.DVSA_SCOPE_URL || ''
    this.authUrl = process.env.DVSA_AUTH_URL || ''
    this.motApiUrl = process.env.DVSA_MOT_API_URL || 'https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests'
    this.taxApiUrl = process.env.DVSA_TAX_API_URL || 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles'
  }

  /**
   * Get OAuth access token if required
   */
  private async getAccessToken(): Promise<string | null> {
    // If we have a valid token, return it
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    // If no OAuth credentials provided, fall back to API key
    if (!this.clientId || !this.clientSecret || !this.authUrl) {
      console.log('🔑 Using API key authentication (no OAuth credentials)')
      return null
    }

    try {
      console.log('🔑 Fetching OAuth access token...')
      
      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: this.scopeUrl || 'read'
        })
      })

      if (!response.ok) {
        throw new Error(`OAuth failed: ${response.status}`)
      }

      const tokenData = await response.json()
      this.accessToken = tokenData.access_token
      
      // Set expiry (usually expires_in is in seconds)
      const expiresIn = tokenData.expires_in || 3600
      this.tokenExpiry = new Date(Date.now() + (expiresIn * 1000))
      
      console.log('✅ OAuth token obtained successfully')
      return this.accessToken

    } catch (error) {
      console.error('❌ OAuth authentication failed:', error)
      return null
    }
  }

  /**
   * Get headers for API requests
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {}

    // DVSA MOT API requires BOTH API key and OAuth token
    if (!this.apiKey) {
      throw new Error('API key is required for DVSA MOT API')
    }
    
    headers['X-API-Key'] = this.apiKey
    console.log('🔑 Added API key to headers')

    // Get OAuth token
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      throw new Error('OAuth access token is required for DVSA MOT API')
    }
    
    headers['Authorization'] = `Bearer ${accessToken}`
    console.log('🔑 Added OAuth token to headers')

    return headers
  }

  /**
   * Get MOT test history for a vehicle
   */
  async getMOTHistory(registration: string): Promise<DVSAApiResponse> {
    try {
      console.log(`🔍 Fetching MOT history for ${registration}`)

      const headers = await this.getHeaders()
      
      // Format registration for API (uppercase, no spaces)
      const formattedReg = registration.toUpperCase().replace(/\s+/g, '')
      
      // Use the correct endpoint format
      const apiUrl = `${this.motApiUrl}/${formattedReg}`
      
      console.log(`🔗 Requesting: ${apiUrl}`)
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      })

      console.log('🔍 MOT API Response Status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('🔍 MOT API Error Response:', errorText)
        
        return {
          success: false,
          error: `DVSA MOT API Error: ${errorText}`,
          debugInfo: {
            status: response.status,
            url: apiUrl,
            headers: Object.keys(headers),
            registration: formattedReg
          }
        }
      }

      const motData = await response.json()
      console.log('🔍 MOT API Response:', JSON.stringify(motData, null, 2))

      // Process the DVSA response structure
      let vehicleDetails = null
      let motHistory: MOTTestResult[] = []

      if (motData.motTests && Array.isArray(motData.motTests)) {
        motHistory = this.processMOTTests(motData.motTests)
      }

      // Extract vehicle details from the main response
      vehicleDetails = {
        registration: motData.registration || formattedReg,
        make: motData.make || 'Unknown',
        model: motData.model || 'Unknown',
        firstUsedDate: motData.firstUsedDate,
        fuelType: motData.fuelType,
        colour: motData.primaryColour,
        registrationDate: motData.registrationDate,
        manufactureDate: motData.manufactureDate,
        engineSize: motData.engineSize,
        hasOutstandingRecall: motData.hasOutstandingRecall,
        motTestHistory: motHistory
      }

      return {
        success: true,
        data: {
          motHistory,
          vehicleDetails
        }
      }

    } catch (error) {
      console.error('MOT API error:', error)
      return {
        success: false,
        error: `Failed to fetch MOT data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Tax API not implemented (MOT only service)
   */
  async getVehicleTaxInfo(registration: string): Promise<DVSAApiResponse> {
    return {
      success: false,
      error: 'Tax API not implemented - this service provides MOT data only'
    }
  }

  /**
   * Get comprehensive vehicle information (MOT + Tax)
   */
  async getCompleteVehicleInfo(registration: string): Promise<DVSAApiResponse> {
    try {
      console.log(`📋 Fetching complete vehicle info for ${registration}`)

      // Clean registration number
      const cleanReg = registration.replace(/\s+/g, '').toUpperCase()

      // Fetch MOT data only
      const [motResult] = await Promise.all([
        this.getMOTHistory(cleanReg)
      ])

      // Combine results
      const combinedData: any = {}
      let hasAnyData = false

      if (motResult.success && motResult.data) {
        combinedData.motHistory = motResult.data.motHistory
        hasAnyData = true
      } else {
        console.log('⚠️ MOT data not available:', motResult.error)
      }

      if (!hasAnyData) {
        return {
          success: false,
          error: 'No vehicle data available from DVSA for this registration',
          limitations: [
            'Registration may not be in DVSA database',
            'Vehicle may be too old or not UK registered',
            'API access may be restricted for this vehicle'
          ]
        }
      }

      // Generate vehicle summary
      const vehicleDetails = this.generateVehicleSummary(combinedData)

      return {
        success: true,
        data: {
          ...combinedData,
          vehicleDetails
        }
      }

    } catch (error) {
      console.error('Complete vehicle info error:', error)
      return {
        success: false,
        error: `Failed to fetch complete vehicle info: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Generate a comprehensive vehicle summary for appeals
   */
  private generateVehicleSummary(data: any): any {
    const summary: any = {
      registration: data.taxInfo?.registrationNumber || 'Unknown',
      isLegal: false, // Default to false for safety
      issues: [],
      appealRelevantInfo: [],
      dataAvailable: {
        mot: !!(data.motHistory && data.motHistory.length > 0),
        tax: !!data.taxInfo
      }
    }

    // Check MOT status
    if (data.motHistory && data.motHistory.length > 0) {
      const latestMOT = data.motHistory[0]
      summary.motStatus = latestMOT.testResult
      summary.motExpiry = latestMOT.expiryDate

      if (latestMOT.testResult === 'PASSED') {
        // Check if MOT is still valid
        const expiryDate = new Date(latestMOT.expiryDate)
        const now = new Date()
        if (expiryDate > now) {
          summary.isLegal = true
        } else {
          summary.issues.push('MOT has expired')
          summary.appealRelevantInfo.push('Expired MOT may affect appeal validity')
        }
      } else {
        summary.issues.push('Vehicle has failed MOT')
        summary.appealRelevantInfo.push('Failed MOT may affect appeal validity')
      }

      // Check for relevant defects
      if (latestMOT.defects) {
        const majorDefects = latestMOT.defects?.filter((d: any) => d.type === 'MAJOR' || d.type === 'DANGEROUS') || []
        if (majorDefects.length > 0) {
          summary.issues.push(`${majorDefects.length} major/dangerous MOT defects`)
          summary.appealRelevantInfo.push('Vehicle defects may impact appeal credibility')
        }
      }
    } else {
      summary.motStatus = 'No MOT data available'
      summary.motExpiry = 'Unknown'
      summary.issues.push('No MOT information available')
      summary.appealRelevantInfo.push('Unable to verify MOT status from DVSA')
    }

    // Check tax status
    if (data.taxInfo) {
      summary.taxStatus = data.taxInfo.taxStatus
      summary.taxDue = data.taxInfo.taxDueDate
      summary.make = data.taxInfo.make || 'Unknown'
      summary.year = data.taxInfo.yearOfManufacture || 'Unknown'

      if (data.taxInfo.taxStatus === 'Taxed') {
        // Check if tax is still valid
        const taxDueDate = new Date(data.taxInfo.taxDueDate)
        const now = new Date()
        if (taxDueDate > now) {
          // Keep legal status if MOT was also OK
          if (!summary.issues.some((issue: string) => issue.includes('MOT'))) {
            summary.isLegal = true
          }
        } else {
          summary.isLegal = false
          summary.issues.push('Vehicle tax has expired')
          summary.appealRelevantInfo.push('Expired tax may weaken appeal case')
        }
      } else if (data.taxInfo.taxStatus === 'Untaxed') {
        summary.isLegal = false
        summary.issues.push('Vehicle is not taxed')
        summary.appealRelevantInfo.push('Untaxed vehicle may weaken appeal case')
      } else if (data.taxInfo.taxStatus === 'SORN') {
        summary.isLegal = false
        summary.issues.push('Vehicle is declared SORN (off-road)')
        summary.appealRelevantInfo.push('SORN vehicle should not have been parked on public road')
      }
    } else {
      summary.taxStatus = 'No tax data available'
      summary.taxDue = 'Unknown'
      summary.make = 'Unknown'
      summary.year = 'Unknown'
      summary.issues.push('No tax information available')
      summary.appealRelevantInfo.push('Unable to verify tax status from DVSA')
    }

    return summary
  }

  /**
   * Check if vehicle is legal for road use
   */
  async isVehicleLegal(registration: string): Promise<{ legal: boolean; reasons: string[] }> {
    const result = await this.getCompleteVehicleInfo(registration)
    
    if (!result.success || !result.data) {
      return {
        legal: false,
        reasons: ['Unable to verify vehicle status']
      }
    }

    const vehicleDetails = result.data.vehicleDetails
    
    return {
      legal: vehicleDetails.isLegal,
      reasons: vehicleDetails.issues
    }
  }

  /**
   * Get appeal-relevant vehicle information
   */
  async getAppealRelevantInfo(registration: string): Promise<string[]> {
    const result = await this.getCompleteVehicleInfo(registration)
    
    if (!result.success || !result.data) {
      return ['Unable to retrieve vehicle information for appeal analysis']
    }

    const info: string[] = []
    const vehicleDetails = result.data.vehicleDetails

    // Add basic vehicle info
    if (vehicleDetails.make && vehicleDetails.year) {
      info.push(`Vehicle: ${vehicleDetails.make} (${vehicleDetails.year})`)
    }

    // Add MOT information
    if (vehicleDetails.motStatus === 'PASSED') {
      info.push(`✅ Valid MOT until ${vehicleDetails.motExpiry}`)
    } else if (vehicleDetails.motStatus === 'FAILED') {
      info.push(`❌ Failed MOT - vehicle should not be on road`)
    }

    // Add tax information
    if (vehicleDetails.taxStatus === 'Taxed') {
      info.push(`✅ Vehicle is taxed until ${vehicleDetails.taxDue}`)
    } else if (vehicleDetails.taxStatus === 'SORN') {
      info.push(`❌ Vehicle is SORN - should not be on public roads`)
    } else {
      info.push(`❌ Vehicle is untaxed`)
    }

    // Add appeal-specific insights
    info.push(...vehicleDetails.appealRelevantInfo)

    return info
  }

  /**
   * Get information about DVSA API capabilities and limitations
   */
  getDVSACapabilities() {
    return {
      available: [
        "MOT test history and results",
        "MOT expiry dates and defects",
        "Vehicle tax status and due dates", 
        "Basic vehicle info (make, year, fuel type, color)",
        "Legal roadworthiness status",
        "Appeal-relevant compliance data"
      ],
      limitations: [
        "No detailed vehicle specifications",
        "Limited make/model information", 
        "No insurance or ownership data",
        "No comprehensive vehicle history",
        "Focused on MOT and tax compliance only"
      ],
      bestFor: [
        "Checking MOT validity for appeals",
        "Verifying tax compliance", 
        "Legal roadworthiness assessment",
        "Official government data for appeals"
      ]
    }
  }

  /**
   * Process raw MOT test data into structured format
   */
  private processMOTTests(motTests: any[]): MOTTestResult[] {
    return motTests.map((test: any) => ({
      completedDate: test.completedDate,
      testResult: test.testResult,
      expiryDate: test.expiryDate,
      odometerValue: test.odometerValue,
      odometerUnit: test.odometerUnit,
      motTestNumber: test.motTestNumber,
      defects: test.defects?.map((defect: any) => ({
        text: defect.text,
        type: defect.type,
        dangerous: defect.dangerous
      })) || []
    }))
  }

  /**
   * Extract vehicle details from MOT test data
   */
  private extractVehicleDetailsFromTests(motTests: any[], registration: string): any {
    if (!motTests || motTests.length === 0) {
      return {
        registration,
        make: 'Unknown',
        model: 'Unknown',
        year: null,
        colour: 'Unknown'
      }
    }

    // Get the most recent test for vehicle details
    const latestTest = motTests[0]
    
    return {
      registration,
      make: latestTest.make || 'Unknown',
      model: latestTest.model || 'Unknown',
      year: latestTest.firstUsedDate ? new Date(latestTest.firstUsedDate).getFullYear() : null,
      colour: latestTest.primaryColour || 'Unknown',
      fuelType: latestTest.fuelType || 'Unknown',
      engineSize: latestTest.engineSize || null,
      vehicleClass: latestTest.vehicleClass || 'Unknown'
    }
  }

}

export default DVSAApiService
export type { MOTTestResult, DVSAApiResponse }

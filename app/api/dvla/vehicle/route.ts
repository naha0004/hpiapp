import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import DVLAOpenDataService from '@/lib/dvla-open-data'

/**
 * DVLA Open Data API Endpoint
 * Get official UK government vehicle data
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { registration } = body

    if (!registration) {
      return NextResponse.json(
        { error: 'Vehicle registration is required' },
        { status: 400 }
      )
    }

    console.log(`🏛️ DVLA lookup for: ${registration}`)

    const dvlaService = new DVLAOpenDataService()
    const result = await dvlaService.getVehicleData(registration)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      )
    }

    // Format for HPI integration
    const hpiFormattedData = dvlaService.formatForHPI(result.data!)

    const response = {
      success: true,
      data: result.data,
      hpiFormat: hpiFormattedData,
      metadata: {
        registration: registration.toUpperCase(),
        timestamp: new Date().toISOString(),
        source: 'DVLA Open Data API',
        sourceUrl: result.sourceUrl
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('DVLA API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicle information' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const registration = searchParams.get('registration')

  if (!registration) {
    return NextResponse.json({
      message: 'DVLA Open Data API',
      description: 'Get official UK government vehicle data',
      usage: {
        'POST /api/dvla/vehicle': 'Get complete vehicle information',
        'GET /api/dvla/vehicle?registration=ABC123': 'Quick vehicle lookup'
      },
      dataProvided: [
        'Tax status & expiry',
        'MOT status & expiry',
        'Make, model, year of manufacture',
        'Engine capacity, fuel type, CO₂ emissions',
        'Color, type approval, wheel configuration',
        'Euro status, export status'
      ],
      example: {
        registration: 'AB12 CDE'
      }
    })
  }

  // Handle GET requests with registration parameter
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const dvlaService = new DVLAOpenDataService()
    const result = await dvlaService.getVehicleData(registration)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      )
    }

    const hpiFormattedData = dvlaService.formatForHPI(result.data!)

    return NextResponse.json({
      success: true,
      data: result.data,
      hpiFormat: hpiFormattedData,
      metadata: {
        registration: registration.toUpperCase(),
        timestamp: new Date().toISOString(),
        source: 'DVLA Open Data API',
        sourceUrl: result.sourceUrl
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vehicle information' },
      { status: 500 }
    )
  }
}

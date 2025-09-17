import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import DVSAApiService from '@/lib/dvsa-api'

/**
 * DVSA Vehicle Information API
 * Get official MOT and TAX data for vehicles
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
    const { registration, checkType = 'complete' } = body

    if (!registration) {
      return NextResponse.json(
        { error: 'Vehicle registration is required' },
        { status: 400 }
      )
    }

    console.log(`🚗 DVSA vehicle check for: ${registration}`)

    const dvsaService = new DVSAApiService()

    let result
    switch (checkType) {
      case 'mot':
        result = await dvsaService.getMOTHistory(registration)
        break
      case 'tax':
        result = await dvsaService.getVehicleTaxInfo(registration)
        break
      case 'legal':
        const legalCheck = await dvsaService.isVehicleLegal(registration)
        result = {
          success: true,
          data: legalCheck
        }
        break
      case 'appeal':
        const appealInfo = await dvsaService.getAppealRelevantInfo(registration)
        result = {
          success: true,
          data: { appealInfo }
        }
        break
      case 'complete':
      default:
        result = await dvsaService.getCompleteVehicleInfo(registration)
        break
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Add metadata
    const response = {
      ...result,
      metadata: {
        registration: registration.toUpperCase(),
        checkType,
        timestamp: new Date().toISOString(),
        source: 'DVSA Official APIs'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('DVSA API error:', error)
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
      message: 'DVSA Vehicle Information API',
      usage: {
        'POST /api/dvsa/vehicle': 'Get complete vehicle information',
        'POST with checkType=mot': 'Get MOT history only',
        'POST with checkType=tax': 'Get tax information only',
        'POST with checkType=legal': 'Check if vehicle is road legal',
        'POST with checkType=appeal': 'Get appeal-relevant information'
      },
      example: {
        registration: 'AB12 CDE',
        checkType: 'complete'
      }
    })
  }

  // Allow simple GET requests for quick checks
  try {
    const dvsaService = new DVSAApiService()
    const result = await dvsaService.getCompleteVehicleInfo(registration)

    return NextResponse.json({
      ...result,
      metadata: {
        registration: registration.toUpperCase(),
        checkType: 'complete',
        timestamp: new Date().toISOString(),
        source: 'DVSA Official APIs'
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vehicle information' },
      { status: 500 }
    )
  }
}

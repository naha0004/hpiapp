import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { parseOneAutoHPIResponse, type OneAutoHPIResponse } from "@/lib/oneauto-hpi-parser"

/**
 * Test endpoint for parsing comprehensive HPI data from OneAuto sandbox
 * POST with your sandbox HPI response data
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

    // Validate that this looks like a OneAuto HPI response
    if (!body.success || !body.result) {
      return NextResponse.json(
        { error: 'Invalid HPI response format. Expected: { success: true, result: {...} }' },
        { status: 400 }
      )
    }

    console.log('🔍 Parsing comprehensive HPI data for:', body.result.vehicle_registration_mark)

    // Parse the comprehensive HPI data
    const parsedData = parseOneAutoHPIResponse(body as OneAutoHPIResponse)

    if (!parsedData) {
      return NextResponse.json(
        { error: 'Failed to parse HPI data' },
        { status: 400 }
      )
    }

    // Return structured analysis
    return NextResponse.json({
      success: true,
      registration: parsedData.vehicleInfo.registration,
      analysis: {
        // Vehicle basics
        vehicle: {
          make: parsedData.vehicleInfo.make,
          model: parsedData.vehicleInfo.model,
          year: parsedData.vehicleInfo.manufacturedYear,
          colour: parsedData.vehicleInfo.colour,
          fuelType: parsedData.vehicleInfo.fuelType,
          engineCapacity: `${parsedData.vehicleInfo.engineCapacity}cc`,
          transmission: parsedData.vehicleInfo.transmission,
          bodyType: parsedData.vehicleInfo.bodyType,
          vin: parsedData.vehicleInfo.vin,
          vinMatch: parsedData.vehicleInfo.vinMatch
        },

        // Risk assessment
        riskAssessment: {
          overallRisk: parsedData.riskSummary.overallRisk,
          recommendedAction: parsedData.riskSummary.recommendedAction,
          warningFlags: parsedData.riskSummary.warningFlags,
          riskFactors: {
            isStolen: parsedData.riskSummary.isStolen,
            hasOutstandingFinance: parsedData.riskSummary.hasOutstandingFinance,
            isWriteOff: parsedData.riskSummary.isWriteOff,
            isScrapped: parsedData.riskSummary.isScrapped,
            isExported: parsedData.riskSummary.isExported,
            hasInsuranceClaims: parsedData.riskSummary.hasInsuranceClaims,
            hasHighRiskMarkers: parsedData.riskSummary.hasHighRiskMarkers
          }
        },

        // Ownership history
        ownership: {
          numberOfPreviousKeepers: parsedData.ownershipHistory.numberOfPreviousKeepers,
          lastKeeperChange: parsedData.ownershipHistory.lastKeeperChangeDate,
          colourHistory: {
            previousColours: parsedData.ownershipHistory.colourChanges.numberOfPreviousColours,
            lastColourChange: parsedData.ownershipHistory.colourChanges.lastColourChangeDate,
            previousColour: parsedData.ownershipHistory.colourChanges.lastColour
          }
        },

        // Finance information
        finance: {
          hasOutstandingFinance: parsedData.financeHistory.hasOutstandingFinance,
          numberOfFinanceAgreements: parsedData.financeHistory.financeAgreements.length,
          financeDetails: parsedData.financeHistory.financeAgreements.map(agreement => ({
            type: agreement.type,
            company: agreement.company,
            startDate: agreement.startDate,
            termMonths: agreement.termMonths,
            vehicleDescription: agreement.vehicleDescription
          }))
        },

        // Legal status
        legalStatus: {
          isScrapped: parsedData.legalStatus.isScrapped,
          scrappedDate: parsedData.legalStatus.scrappedDate,
          isExported: parsedData.legalStatus.isExported,
          exportedDate: parsedData.legalStatus.exportedDate,
          isImported: parsedData.legalStatus.isImported,
          isNonEuImport: parsedData.legalStatus.isNonEuImport,
          priorRegistrations: {
            gb: parsedData.legalStatus.priorGbVrm,
            ni: parsedData.legalStatus.priorNiVrm
          }
        },

        // Insurance and theft
        security: {
          stolenVehicleReports: parsedData.conditionData.stolenVehicleReports.length,
          insuranceClaims: parsedData.conditionData.claims.length,
          theftReports: parsedData.conditionData.stolenVehicleReports.map(report => ({
            dateReported: report.dateReported,
            policeForce: report.policeForce,
            contact: report.policeContact
          })),
          insuranceClaimDetails: parsedData.conditionData.claims.map(claim => ({
            dateOfLoss: claim.dateOfLoss,
            status: claim.status,
            theftIndicator: claim.theftIndicator,
            insurer: claim.insurerName,
            claimNumber: claim.claimNumber,
            lossType: claim.lossType
          }))
        },

        // Technical specifications
        specifications: {
          engineCapacity: parsedData.technicalSpecs,
          weights: {
            maxPermissableMass: `${parsedData.technicalSpecs.maxPermissableMass}kg`,
            minKerbWeight: `${parsedData.technicalSpecs.minKerbWeight}kg`,
            grossVehicleWeight: `${parsedData.technicalSpecs.grossVehicleWeight}kg`
          },
          towing: {
            maxBrakedTowing: `${parsedData.technicalSpecs.maxBrakedTowingWeight}kg`,
            maxUnbrakedTowing: `${parsedData.technicalSpecs.maxUnbrakedTowingWeight}kg`
          },
          performance: {
            maxNetPower: `${parsedData.technicalSpecs.maxNetPower}kW`,
            powerWeightRatio: parsedData.technicalSpecs.powerWeightRatio
          }
        },

        // Document history
        documents: {
          v5cIssued: parsedData.documentHistory.v5cIssued.length,
          identityChecks: parsedData.documentHistory.identityChecks.length,
          identityCheckResults: parsedData.documentHistory.identityChecks.map(check => ({
            date: check.date,
            result: check.result
          }))
        },

        // Insurance coverage
        insurance: {
          indemnityMonths: parsedData.insurance.indemnityMonths,
          indemnityValue: `£${parsedData.insurance.indemnityValueGbp.toLocaleString()}`
        },

        // Search history
        searchActivity: {
          totalSearches: parsedData.searchHistory.length,
          recentSearches: parsedData.searchHistory.slice(0, 5).map(search => ({
            date: search.searchDate,
            time: search.searchTime,
            businessType: search.businessType
          }))
        },

        // High risk markers
        highRiskMarkers: parsedData.riskData.highRiskItems.map(risk => ({
          type: risk.riskType,
          dateOfInterest: risk.dateOfInterest,
          information: risk.extraInfo,
          company: risk.companyName
        }))
      },

      // Raw parsed data for debugging
      debug: process.env.NODE_ENV === 'development' ? {
        rawApiResponse: body,
        parsedData
      } : undefined
    })

  } catch (error) {
    console.error('HPI data parsing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process HPI data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OneAuto HPI Data Parser Test Endpoint',
    usage: 'POST your sandbox HPI response data to this endpoint for parsing and analysis',
    expectedFormat: {
      success: true,
      result: {
        vehicle_registration_mark: "string",
        dvla_manufacturer_desc: "string",
        // ... other HPI fields
      }
    }
  })
}

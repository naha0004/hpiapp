import { NextRequest, NextResponse } from "next/server"

// Mock HPI data for development - since OneAuto sandbox auth is complex
const MOCK_HPI_DATA: Record<string, any> = {
  "SD12LSC": {
    stolen: false,
    writeOff: false,
    mileageDiscrepancy: false,
    outstandingFinance: false,
    previousOwners: 2,
    lastMOT: "2024-09-15T00:00:00.000Z",
    taxStatus: "Taxed",
    insuranceGroup: 15,
    vehicleCheck: {
      make: "FORD",
      model: "FOCUS",
      colour: "BLUE",
      fuelType: "PETROL",
      engineSize: "1600",
      yearOfManufacture: "2018"
    },
    _raw: {
      message: "Mock data for development",
      registration: "SD12LSC",
      timestamp: new Date().toISOString()
    }
  },
  "TEST123": {
    stolen: false,
    writeOff: true,
    mileageDiscrepancy: true,
    outstandingFinance: false,
    previousOwners: 4,
    lastMOT: "2023-06-20T00:00:00.000Z",
    taxStatus: "SORN",
    insuranceGroup: 25,
    vehicleCheck: {
      make: "VAUXHALL",
      model: "CORSA",
      colour: "RED",
      fuelType: "PETROL",
      engineSize: "1200",
      yearOfManufacture: "2015"
    },
    _raw: {
      message: "Mock data for development - write-off example",
      registration: "TEST123",
      timestamp: new Date().toISOString()
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const registration = searchParams.get('registration') || searchParams.get('vrm')

  if (!registration) {
    return NextResponse.json(
      { error: "Missing registration parameter" },
      { status: 400 }
    )
  }

  const reg = registration.toUpperCase()
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Return mock data if available, otherwise generic response
  const mockData = MOCK_HPI_DATA[reg] || {
    stolen: false,
    writeOff: false,
    mileageDiscrepancy: false,
    outstandingFinance: false,
    previousOwners: 1,
    lastMOT: "2024-08-01T00:00:00.000Z",
    taxStatus: "Taxed",
    insuranceGroup: 10,
    vehicleCheck: {
      make: "UNKNOWN",
      model: "UNKNOWN",
      colour: "UNKNOWN",
      fuelType: "PETROL",
      engineSize: "1000",
      yearOfManufacture: "2020"
    },
    _raw: {
      message: "Mock data for development - generic vehicle",
      registration: reg,
      timestamp: new Date().toISOString()
    }
  }

  return NextResponse.json({
    success: true,
    data: mockData
  })
}

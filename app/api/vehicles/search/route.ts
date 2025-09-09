import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { vehicleSchemas, validateInput } from "@/lib/validation"
import { logSecurityEvent, setSecurityHeaders } from "@/lib/security"
import { env } from "@/lib/env"
import DVLAOpenDataService from "@/lib/dvla-open-data"

async function getDVSAToken() {
  if (!env.DVSA_CLIENT_ID || !env.DVSA_CLIENT_SECRET || !env.DVSA_SCOPE_URL || !env.DVSA_AUTH_URL) {
    throw new Error('DVSA credentials not configured')
  }
  
  const response = await fetch(env.DVSA_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.DVSA_CLIENT_ID,
      client_secret: env.DVSA_CLIENT_SECRET,
      scope: env.DVSA_SCOPE_URL,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get DVSA token: ${response.status}`)
  }

  const data = await response.json()
  return data.access_token
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return setSecurityHeaders(
        NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      )
    }

    const { searchParams } = new URL(request.url)
    const rawRegistration = searchParams.get("registration")

    if (!rawRegistration) {
      return setSecurityHeaders(
        NextResponse.json(
          { error: "Registration parameter is required" },
          { status: 400 }
        )
      )
    }

    // Validate and sanitize input
    const { registration: validatedRegistration } = validateInput(vehicleSchemas.search, { 
      registration: rawRegistration 
    })

    // Log the search attempt (without sensitive data)
    logSecurityEvent('vehicle_search', {
      userId: session.user.id,
      registration: validatedRegistration.substring(0, 3) + '***', // Partial registration for logs
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for')
    })

    // Check for API key availability
    console.log('Environment check:', {
      dvlaKeyPresent: !!env.DVLA_API_KEY,
      dvsaKeyPresent: !!env.DVSA_API_KEY,
      clientIdPresent: !!env.DVSA_CLIENT_ID,
      clientSecretPresent: !!env.DVSA_CLIENT_SECRET,
    })
    
    console.log('Fetching vehicle data for:', validatedRegistration);

    // Initialize services
    const dvlaService = new DVLAOpenDataService()

    // Fetch DVLA data (tax, registration details) in parallel with DVSA
    const dvlaPromise = dvlaService.getVehicleData(validatedRegistration)
      .catch(error => {
        console.warn('DVLA API failed, continuing without official registration data:', error)
        return { success: false, error: 'DVLA data unavailable' }
      })

    // Get DVSA access token
    const accessToken = await getDVSAToken()
    
    if (!accessToken) {
      console.error('Failed to obtain DVSA access token');
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      )
    }

    console.log('Making DVSA API request with:', {
      url: env.DVSA_MOT_API_URL,
      registration: validatedRegistration,
      apiKey: env.DVSA_API_KEY?.substring(0, 5) + '...',
      accessToken: accessToken?.substring(0, 5) + '...',
      timestamp: new Date().toISOString()
    })

    // Call DVSA MOT API with retry logic
    let attempts = 0;
    const maxAttempts = 2;
    let dvsaResponse: Response | undefined;
    let lastError: unknown;

    while (attempts <= maxAttempts) {
      try {
        console.log(`Attempt ${attempts + 1} of ${maxAttempts + 1}`);
        dvsaResponse = await fetch(
          `${env.DVSA_MOT_API_URL}/${validatedRegistration}`,
          {
            headers: {
            "x-api-key": env.DVSA_API_KEY!,
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            method: "GET"
          }
        );
        
        // If request successful, break the retry loop
        break;
      } catch (error) {
        lastError = error;
        attempts++;
        if (attempts > maxAttempts) {
          console.error('All retry attempts failed:', lastError);
          return NextResponse.json(
            { error: "Failed to fetch vehicle data after multiple attempts" },
            { status: 500 }
          );
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }

    // Check if we have a response
    if (!dvsaResponse) {
      return NextResponse.json(
        { error: "Failed to get response from DVSA API" },
        { status: 500 }
      );
    }

    if (!dvsaResponse.ok) {
      const error = await dvsaResponse.text()
      console.error("DVSA API Error:", {
        status: dvsaResponse.status,
        statusText: dvsaResponse.statusText,
        error,
        url: env.DVSA_MOT_API_URL,
        registration: validatedRegistration
      })
      return NextResponse.json(
        { error: `Failed to fetch vehicle data: ${dvsaResponse.status} - ${error}` },
        { status: dvsaResponse.status }
      )
    }

    const vehicleData = await dvsaResponse.json()
    
    // Get DVLA data result
    const dvlaResult = await dvlaPromise

    console.log('Data sources:', {
      DVSA: 'Available',
      DVLA: dvlaResult.success ? 'Available' : 'Unavailable'
    })
    
    // Log raw response for debugging
    console.log('Raw DVSA response:', JSON.stringify(vehicleData, null, 2));

    // Define our data types for better type safety
    interface VehicleDetails {
      registration: string;
      make: string;
      model: string;
      firstUsedDate: string;
      fuelType: string;
      primaryColour: string;
      manufactureDate?: string;
      cylinderCapacity?: number;
      motTests: MOTTest[];
      // DVLA Official Data
      dvlaData?: {
        taxStatus?: string;
        taxDueDate?: string;
        motStatus?: string;
        motExpiryDate?: string;
        yearOfManufacture?: number;
        cylinderCapacity?: number;
        co2Emissions?: number;
        euroStatus?: string;
        markedForExport?: boolean;
        wheelplan?: string;
        dateOfLastV5CIssued?: string;
      };
      dvlaLegalStatus?: {
        isLegal: boolean;
        issues: string[];
        warnings: string[];
      };
    }

    interface MOTTest {
      completedDate: string;
      testResult: string;
      motTestNumber: string;
      expiryDate: string;
      odometerValue: number;
      odometerUnit: string;
      defects: Array<{ text: string; type: string }>;
      advisories: Array<{ text: string; type: string }>;
    }

    // Process and validate vehicle data
    if (!vehicleData || typeof vehicleData !== 'object') {
      return NextResponse.json(
        { error: "Invalid vehicle data received" },
        { status: 500 }
      );
    }

    // Ensure required vehicle fields are present
    const processedVehicleData: VehicleDetails = {
      registration: vehicleData.registration || validatedRegistration,
      make: vehicleData.make || '',
      model: vehicleData.model || '',
      firstUsedDate: vehicleData.firstUsedDate || '',
      fuelType: vehicleData.fuelType || '',
      primaryColour: vehicleData.primaryColour || '',
      manufactureDate: vehicleData.manufactureDate,
      cylinderCapacity: Number(vehicleData.cylinderCapacity) || undefined,
      motTests: []
    };

    // Add DVLA official data if available
    if (dvlaResult.success && 'data' in dvlaResult && dvlaResult.data) {
      const dvlaData = dvlaResult.data
      const legalStatus = dvlaService.isVehicleRoadLegal(dvlaData)

      processedVehicleData.dvlaData = {
        taxStatus: dvlaData.taxStatus,
        taxDueDate: dvlaData.taxDueDate,
        motStatus: dvlaData.motStatus,
        motExpiryDate: dvlaData.motExpiryDate,
        yearOfManufacture: dvlaData.yearOfManufacture,
        cylinderCapacity: dvlaData.cylinderCapacity,
        co2Emissions: dvlaData.co2Emissions,
        euroStatus: dvlaData.euroStatus,
        markedForExport: dvlaData.markedForExport,
        wheelplan: dvlaData.wheelplan,
        dateOfLastV5CIssued: dvlaData.dateOfLastV5CIssued
      }

      processedVehicleData.dvlaLegalStatus = legalStatus

      // Override DVSA data with more accurate DVLA data where available
      if (dvlaData.make) {
        processedVehicleData.make = dvlaData.make
      }
      if (dvlaData.colour) {
        processedVehicleData.primaryColour = dvlaData.colour
      }
      if (dvlaData.fuelType) {
        processedVehicleData.fuelType = dvlaData.fuelType
      }
      if (dvlaData.cylinderCapacity) {
        processedVehicleData.cylinderCapacity = dvlaData.cylinderCapacity
      }

      console.log('Enhanced with DVLA data:', {
        taxStatus: dvlaData.taxStatus,
        motStatus: dvlaData.motStatus,
        isRoadLegal: legalStatus.isLegal,
        issues: legalStatus.issues,
        warnings: legalStatus.warnings
      })
    }

    // Process and validate MOT tests
    if (Array.isArray(vehicleData.motTests)) {
      console.log('Original MOT tests count:', vehicleData.motTests.length);
      
      vehicleData.motTests = vehicleData.motTests
        .filter((test: any) => {
          const isValid = test && 
            typeof test === 'object' && 
            typeof test.completedDate === 'string' &&
            typeof test.testResult === 'string';
          if (!isValid) {
            console.log('Filtered out invalid test:', test);
          }
          return isValid;
        })
        .map((test: any): MOTTest => {
          // Ensure all required fields are present with proper defaults
          const processedTest: MOTTest = {
            completedDate: test.completedDate || '',
            testResult: test.testResult || 'UNKNOWN',
            motTestNumber: test.motTestNumber || '',
            expiryDate: test.expiryDate || '',
            odometerValue: Number(test.odometerValue) || 0,
            odometerUnit: test.odometerUnit || 'mi',
            defects: Array.isArray(test.defects) ? test.defects : [],
            advisories: Array.isArray(test.advisories) ? test.advisories : []
          };
          return processedTest;
        })
        .sort((a: MOTTest, b: MOTTest) => 
          new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
        );

      // Deep check the processed data
      const processedTests = vehicleData.motTests.map((test: MOTTest) => ({
        date: test.completedDate,
        result: test.testResult,
        defectsCount: test.defects.length,
        advisoriesCount: test.advisories.length,
        expiryDate: test.expiryDate,
        mileage: `${test.odometerValue} ${test.odometerUnit}`
      }));

      console.log('Processed MOT Tests:', {
        count: vehicleData.motTests.length,
        sampleTests: processedTests.slice(0, 2), // Log first two tests
        hasDefects: vehicleData.motTests.some((t: MOTTest) => t.defects.length > 0),
        hasAdvisories: vehicleData.motTests.some((t: MOTTest) => t.advisories.length > 0)
      });
      
      // Validate the structure of the processed data
      console.log('Data structure validation:', {
        hasValidDates: vehicleData.motTests.every((t: MOTTest) => new Date(t.completedDate).toString() !== 'Invalid Date'),
        hasValidResults: vehicleData.motTests.every((t: MOTTest) => typeof t.testResult === 'string' && t.testResult.length > 0),
        hasValidDefects: vehicleData.motTests.every((t: MOTTest) => Array.isArray(t.defects)),
        hasValidAdvisories: vehicleData.motTests.every((t: MOTTest) => Array.isArray(t.advisories))
      });

      console.log('MOT Tests before sending:', {
        numberOfTests: vehicleData.motTests.length,
        allTests: vehicleData.motTests.map((t: { completedDate: string; testResult: string; motTestNumber: string }) => ({
          date: t.completedDate,
          result: t.testResult,
          number: t.motTestNumber
        }))
      });
    }

    // Assign the processed MOT tests back to the vehicle data
    processedVehicleData.motTests = vehicleData.motTests || [];

    console.log('Vehicle data response:', {
      registration: processedVehicleData.registration,
      make: processedVehicleData.make,
      model: processedVehicleData.model,
      color: processedVehicleData.primaryColour,
      totalTests: processedVehicleData.motTests.length,
      testDates: processedVehicleData.motTests.map(t => t.completedDate)
    });

    return setSecurityHeaders(NextResponse.json({ data: processedVehicleData }))
  } catch (error) {
    console.error("Search error:", error)
    
    // Log security event for failed requests
    logSecurityEvent('api_error', {
      endpoint: '/api/vehicles/search',
      error: error instanceof Error ? error.message : 'Unknown error',
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for')
    })
    
    return setSecurityHeaders(
      NextResponse.json(
        { error: "Failed to process request" },
        { status: 500 }
      )
    )
  }
}

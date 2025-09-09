import { NextRequest, NextResponse } from 'next/server';
import DVSAApiService from '@/lib/dvsa-api';

const dvsaAPI = new DVSAApiService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { searchParams } = new URL(request.url);
  const registration = searchParams.get('registration');
  const { action } = await params;

  if (!registration) {
    return NextResponse.json(
      { error: 'Vehicle registration is required' },
      { status: 400 }
    );
  }

  try {
    switch (action) {
      case 'mot':
        const motHistory = await dvsaAPI.getMOTHistory(registration);
        return NextResponse.json(motHistory);

      case 'tax':
        const taxInfo = await dvsaAPI.getVehicleTaxInfo(registration);
        return NextResponse.json(taxInfo);

      case 'legal-status':
        const legalStatus = await dvsaAPI.isVehicleLegal(registration);
        return NextResponse.json(legalStatus);

      case 'appeal-info':
        const appealInfo = await dvsaAPI.getAppealRelevantInfo(registration);
        return NextResponse.json(appealInfo);

      case 'complete':
        const completeInfo = await dvsaAPI.getCompleteVehicleInfo(registration);
        return NextResponse.json(completeInfo);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: mot, tax, legal-status, appeal-info, or complete' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('DVSA API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle information from DVSA' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { registration, actions } = body;

    if (!registration) {
      return NextResponse.json(
        { error: 'Vehicle registration is required' },
        { status: 400 }
      );
    }

    // If specific actions are requested, fetch only those
    if (actions && Array.isArray(actions)) {
      const results: any = {};
      
      for (const action of actions) {
        switch (action) {
          case 'mot':
            results.mot = await dvsaAPI.getMOTHistory(registration);
            break;
          case 'tax':
            results.tax = await dvsaAPI.getVehicleTaxInfo(registration);
            break;
          case 'legal-status':
            results.legalStatus = await dvsaAPI.isVehicleLegal(registration);
            break;
          case 'appeal-info':
            results.appealInfo = await dvsaAPI.getAppealRelevantInfo(registration);
            break;
        }
      }
      
      return NextResponse.json({ data: results });
    }

    // Default: fetch complete vehicle information
    const completeInfo = await dvsaAPI.getCompleteVehicleInfo(registration);
    return NextResponse.json({ data: completeInfo });

  } catch (error) {
    console.error('DVSA API error:', error);
    return NextResponse.json(
      { error: 'Failed to process vehicle information request' },
      { status: 500 }
    );
  }
}

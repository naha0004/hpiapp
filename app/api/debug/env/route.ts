import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }
  return NextResponse.json({
    env_test: {
      DVSA_API_KEY: process.env.DVSA_API_KEY ? 'PRESENT' : 'NOT_FOUND',
      DVSA_CLIENT_ID: process.env.DVSA_CLIENT_ID ? 'PRESENT' : 'NOT_FOUND',
      DVSA_CLIENT_SECRET: process.env.DVSA_CLIENT_SECRET ? 'PRESENT' : 'NOT_FOUND',
      DATABASE_URL: process.env.DATABASE_URL ? 'PRESENT' : 'NOT_FOUND'
    }
  });
}

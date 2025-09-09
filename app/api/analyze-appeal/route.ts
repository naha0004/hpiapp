import { NextResponse } from 'next/server';
import { ai_appeal_predictor } from '@/lib/ai-appeal-predictor';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.ticketType || !data.circumstances) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const analysis = await ai_appeal_predictor.analyzeAppeal({
      ticketType: data.ticketType,
      date: data.date,
      location: data.location,
      circumstances: data.circumstances,
      evidenceAvailable: data.evidenceAvailable
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Appeal analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze appeal' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key found' }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Simple test call to validate the API key
    const response = await openai.models.list();
    
    return NextResponse.json({
      success: true,
      message: 'API key is valid',
      modelsCount: response.data.length
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      status: error.status || 'unknown'
    });
  }
}

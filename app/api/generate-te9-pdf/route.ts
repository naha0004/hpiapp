import { NextRequest, NextResponse } from 'next/server';
import { PDFService } from '@/lib/pdf-service';
import { TE9Data } from '@/types/appeal';

export async function POST(request: NextRequest) {
  try {
    const te9Data: TE9Data = await request.json();
    
    // Validate required fields
    if (!te9Data.courtName || !te9Data.claimNumber || !te9Data.witnessName || !te9Data.statementText) {
      return NextResponse.json(
        { error: 'Missing required fields: courtName, claimNumber, witnessName, or statementText' },
        { status: 400 }
      );
    }

    // Generate filled PDF
    const pdfBytes = await PDFService.fillTE9Form(te9Data);
    
    // Return PDF as response
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="TE9_Witness_Statement_${te9Data.claimNumber || 'form'}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });
    
  } catch (error) {
    console.error('TE9 PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate TE9 PDF form' },
      { status: 500 }
    );
  }
}

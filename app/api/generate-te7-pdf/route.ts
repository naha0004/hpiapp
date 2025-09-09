import { NextRequest, NextResponse } from 'next/server';
import { PDFService } from '@/lib/pdf-service';
import { TE7Data } from '@/types/appeal';

export async function POST(request: NextRequest) {
  try {
    const te7Data: TE7Data = await request.json();
    
    // Validate required fields
    if (!te7Data.courtName || !te7Data.claimNumber || !te7Data.applicantName) {
      return NextResponse.json(
        { error: 'Missing required fields: courtName, claimNumber, or applicantName' },
        { status: 400 }
      );
    }

    // Generate filled PDF
    const pdfBytes = await PDFService.fillTE7Form(te7Data);
    
    // Return PDF as response
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="TE7_Application_${te7Data.claimNumber || 'form'}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });
    
  } catch (error) {
    console.error('TE7 PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate TE7 PDF form' },
      { status: 500 }
    );
  }
}

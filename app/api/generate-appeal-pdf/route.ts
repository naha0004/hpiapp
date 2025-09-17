import { NextRequest, NextResponse } from 'next/server';
import { PDFService } from '@/lib/pdf-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appealText, caseDetails, type } = body;

    if (!appealText) {
      return NextResponse.json(
        { error: 'Appeal text is required' },
        { status: 400 }
      );
    }

    let pdfBytes: Uint8Array;

    if (type === 'predictor-report' && body.prediction) {
      // Generate full predictor report PDF
      pdfBytes = await PDFService.generatePredictorReportPDF(body.prediction, caseDetails);
    } else {
      // Generate simple appeal letter PDF
      pdfBytes = await PDFService.generateAppealLetterPDF(appealText, caseDetails);
    }

    // Return PDF as response
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Appeal_Letter_${caseDetails?.pcnNumber || 'Generated'}_${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating appeal PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again.' },
      { status: 500 }
    );
  }
}

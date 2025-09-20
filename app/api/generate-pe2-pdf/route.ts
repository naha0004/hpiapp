import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PDFService } from '@/lib/pdf-service';
import { AIAppealGenerator } from '@/lib/ai-appeal-generator';
import { PE2Data } from '@/types/appeal';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const pe2Data: PE2Data = await request.json();

    // Validate required fields for PE2 (Application to file a Statutory Declaration Out of Time)
    if (!pe2Data.courtName || !pe2Data.penaltyChargeNumber || !pe2Data.applicantName || !pe2Data.reasonsForLateFiling) {
      return NextResponse.json(
        { error: 'Missing required fields for PE2 form' },
        { status: 400 }
      );
    }

    // Enhance form content with AI if available
    let enhancedData = { ...pe2Data };
    
    try {
      const aiGenerator = new AIAppealGenerator();
      
      // Generate AI-enhanced content for key fields
      if (pe2Data.reasonsForLateFiling && pe2Data.reasonsForLateFiling.length < 100) {
        const aiContent = await aiGenerator.generateCourtFormContent('PE2', pe2Data);
        enhancedData.reasonsForLateFiling = aiContent;
      }
      
      // Add unique reference if penalty charge number exists
      enhancedData.penaltyChargeNumber = pe2Data.penaltyChargeNumber + `-AI-${Date.now().toString().slice(-6)}`;
      
    } catch (aiError) {
      console.log('AI enhancement failed for PE2, using original data:', aiError);
      // Continue with original data if AI fails
    }

    // Generate the PDF with enhanced content
    const pdfBytes = await PDFService.fillPE2Form(enhancedData);

    // Return the PDF as a blob
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PE2_Application_${enhancedData.penaltyChargeNumber || 'form'}.pdf"`,
      },
    });

  } catch (error) {
    console.error('PE2 PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PE2 PDF form' },
      { status: 500 }
    );
  }
}

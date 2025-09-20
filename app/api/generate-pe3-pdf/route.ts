import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PDFService } from '@/lib/pdf-service';
import { AIAppealGenerator } from '@/lib/ai-appeal-generator';
import { PE3Data } from '@/types/appeal';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const pe3Data: PE3Data = await request.json();

    // Validate required fields for PE3 statutory declaration
    if (!pe3Data.penaltyChargeNumber || !pe3Data.vehicleRegistration || !pe3Data.applicantName || !pe3Data.reasonForDeclaration) {
      return NextResponse.json(
        { error: 'Missing required fields for PE3 form (penalty charge number, vehicle registration, applicant name, and reason for declaration are required)' },
        { status: 400 }
      );
    }

    // Enhance form content with AI if available
    let enhancedData = { ...pe3Data };
    
    try {
      const aiGenerator = new AIAppealGenerator();
      
      // Generate AI-enhanced content for key fields
      if (pe3Data.reasonForDeclaration && pe3Data.reasonForDeclaration.length < 100) {
        const aiContent = await aiGenerator.generateCourtFormContent('PE3', pe3Data);
        enhancedData.reasonForDeclaration = aiContent;
      }
      
      // Add unique reference for PE3 statutory declaration
      enhancedData.penaltyChargeNumber = pe3Data.penaltyChargeNumber + `-AI-${Date.now().toString().slice(-6)}`;
      
    } catch (aiError) {
      console.log('AI enhancement failed for PE3, using original data:', aiError);
      // Continue with original data if AI fails
    }

    // Generate the PDF with enhanced content
    const pdfBytes = await PDFService.fillPE3Form(enhancedData);

    // Return the PDF as a blob
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PE3_Statutory_Declaration_${enhancedData.penaltyChargeNumber || 'form'}.pdf"`,
      },
    });

  } catch (error) {
    console.error('PE3 PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PE3 PDF form' },
      { status: 500 }
    );
  }
}

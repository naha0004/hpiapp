import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PDFService } from '@/lib/pdf-service';
import { WordDocumentService } from '@/lib/word-service';
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

    // Check for format preference in query params
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'pdf';

    if (format === 'word') {
      // Generate Word document (professional approach)
      console.log('Generating PE3 as Word document (professional format)');
      const wordBuffer = await WordDocumentService.generatePE3Document(enhancedData);
      
      return new NextResponse(wordBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="PE3_Statutory_Declaration_${enhancedData.penaltyChargeNumber || 'form'}.docx"`,
        },
      });
    } else {
      // Generate PDF (using Word service internally for better results)
      console.log('Generating PE3 as PDF (Word-to-PDF approach)');
      const pdfBytes = await PDFService.fillPE3Form(enhancedData);

      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="PE3_Statutory_Declaration_${enhancedData.penaltyChargeNumber || 'form'}.pdf"`,
        },
      });
    }

  } catch (error) {
    console.error('PE3 form generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PE3 form' },
      { status: 500 }
    );
  }
}

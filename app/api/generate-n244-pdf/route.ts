import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PDFService } from '@/lib/pdf-service';
import { AIAppealGenerator } from '@/lib/ai-appeal-generator';
import { N244Data } from '@/types/appeal';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const n244Data: N244Data = await request.json();

    // Validate required fields
    if (!n244Data.courtName || !n244Data.claimNumber || !n244Data.applicantName || !n244Data.orderOrDirectionSought) {
      return NextResponse.json(
        { error: 'Missing required fields for N244 form' },
        { status: 400 }
      );
    }

    // Enhance form content with AI if available
    let enhancedData = { ...n244Data };
    
    try {
      const aiGenerator = new AIAppealGenerator();
      
      // Generate AI-enhanced content for key fields
      if (n244Data.reasonForApplication && n244Data.reasonForApplication.length < 100) {
        const aiContent = await aiGenerator.generateCourtFormContent('N244', n244Data);
        enhancedData.reasonForApplication = aiContent;
      }
      
      // Add unique reference
      enhancedData.claimNumber = n244Data.claimNumber + `-AI-${Date.now().toString().slice(-6)}`;
      
    } catch (aiError) {
      console.log('AI enhancement failed for N244, using original data:', aiError);
      // Continue with original data if AI fails
    }

    // Generate the PDF with enhanced content
    const pdfBytes = await PDFService.fillN244Form(enhancedData);

    // Return the PDF as a blob
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="N244_Application_Notice_${enhancedData.claimNumber || 'form'}.pdf"`,
      },
    });

  } catch (error) {
    console.error('N244 PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate N244 PDF form' },
      { status: 500 }
    );
  }
}

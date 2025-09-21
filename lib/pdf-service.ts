import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFImage, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { TE7Data, TE9Data, PE2Data, PE3Data, N244Data } from '@/types/appeal';
import { WordDocumentService } from './word-service';

export class PDFService {
  private static async loadPDFTemplate(templateName: string): Promise<Uint8Array> {
    const templatePath = path.join(process.cwd(), 'pdf_templates', templateName);
    return fs.readFileSync(templatePath);
  }

  static async fillTE7Form(data: TE7Data): Promise<Uint8Array> {
    try {
      // Load the TE7 template
      const existingPdfBytes = await this.loadPDFTemplate('TE7_0622_save.pdf');
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      // Fill form fields using actual field names from the PDF
      this.setFormField(form, 'Full name Respondent', data.applicantName);
      this.setFormField(form, 'Respondent\'s address', data.applicantAddress);
      this.setFormField(form, 'Respondent\'s postcode', data.applicantPostcode);
      this.setFormField(form, 'Penalty Charge No', data.claimNumber);
      this.setFormField(form, 'Vehicle Registration No', data.caseReference);
      this.setFormField(form, 'Reasons for applying for permission', data.reasonForExtension);
      this.setFormField(form, 'Date of signature', data.signatureDate || new Date().toLocaleDateString('en-GB'));
      this.setFormField(form, 'Print full name', data.applicantName);

      // Set dropdown for "outside the given time/for more time"
      this.setDropdownField(form, 'outside the given time/for more time (choose an option)', 'for more time');
      
      // Set dropdown for "I believe/The respondent believes"
      this.setDropdownField(form, 'I believe/The respondent believes (choose an option)', 'The respondent believes');
      
      // Set dropdown for signature type
      this.setDropdownField(form, 'Respondent/Person signing on behalf of the respondent (choose an option)', 'Respondent');

      // Embed signatures if provided
      if (data.applicantSignature) {
        await this.embedSignatureImage(pdfDoc, data.applicantSignature, 'TE7_applicant_signature');
      }
      
      if (data.witnessSignature) {
        await this.embedSignatureImage(pdfDoc, data.witnessSignature, 'TE7_witness_signature');
      }

      // Don't flatten the form so users can still edit if needed
      // form.flatten();

      // Serialize the PDF
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error filling TE7 form:', error);
      throw new Error('Failed to fill TE7 form');
    }
  }

  static async fillTE9Form(data: TE9Data): Promise<Uint8Array> {
    try {
      // Load the TE9 template
      const existingPdfBytes = await this.loadPDFTemplate('TE9.pdf');
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      // Fill form fields using actual field names from the PDF
      this.setFormField(form, 'Penalty charge number', data.claimNumber);
      
      // Extract vehicle reg from statement text (it should be passed separately)
      const vehicleReg = data.statementText.split('\n').find(line => line.includes('Vehicle:'))?.replace('Vehicle: ', '') || '';
      this.setFormField(form, 'Vehicle Registration No', vehicleReg);
      
      this.setFormField(form, 'Applicant', data.witnessName);
      
      // Extract location and date from statement text
      const location = data.statementText.split('\n').find(line => line.includes('Location:'))?.replace('Location: ', '') || '';
      const date = data.statementText.split('\n').find(line => line.includes('Date:'))?.replace('Date: ', '') || '';
      
      this.setFormField(form, 'Location of Contravention', location);
      this.setFormField(form, 'Date of Contravention', date);
      
      // Witness details
      this.setFormField(form, 'Full name (witness)', data.witnessName);
      this.setFormField(form, 'Address', data.witnessAddress);
      
      // Split postcode if available
      const postcodeParts = data.witnessPostcode.split(' ');
      this.setFormField(form, 'Postcode 1', postcodeParts[0] || '');
      this.setFormField(form, 'Postcode 2', postcodeParts[1] || '');
      
      // Set ground checkboxes based on the statement
      const statement = data.statementText.toLowerCase();
      if (statement.includes('ground a') || statement.includes('did not receive')) {
        this.setCheckboxField(form, 'did not receive the penalty charge notice - yes', true);
      } else if (statement.includes('ground b') || statement.includes('representations')) {
        this.setCheckboxField(form, 'representations but no rejection notice - yes', true);
      } else if (statement.includes('ground c') || statement.includes('appeal')) {
        this.setCheckboxField(form, 'no response to the appeal - yes', true);
      } else if (statement.includes('ground d') || statement.includes('paid')) {
        this.setCheckboxField(form, 'penalty charge has been paid in full - yes', true);
      }

      // Statement of truth
      this.setCheckboxField(form, 'The witness believes - overtype field', true);
      this.setCheckboxField(form, 'Signed by witness', true);
      
      // Date and signature
      this.setFormField(form, 'Date statement of truth signed', data.signatureDate || new Date().toLocaleDateString('en-GB'));
      this.setFormField(form, 'Print full name', data.witnessName);
      
      // Embed signatures if provided
      if (data.declarantSignature) {
        await this.embedSignatureImage(pdfDoc, data.declarantSignature, 'TE9_declarant_signature');
      }
      
      if (data.witnessSignature) {
        await this.embedSignatureImage(pdfDoc, data.witnessSignature, 'TE9_witness_signature');
      }

      // Don't flatten the form so users can still edit if needed
      // form.flatten();

      // Serialize the PDF
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error filling TE9 form:', error);
      throw new Error('Failed to fill TE9 form');
    }
  }

  /**
   * Generate a PDF document from appeal letter text
   */
  static async generateAppealLetterPDF(appealText: string, caseDetails?: {
    pcnNumber?: string;
    vehicleReg?: string;
    location?: string;
    appealantName?: string;
    councilName?: string;
  }): Promise<Uint8Array> {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      
      // Define fonts and colors
      const font = await pdfDoc.embedFont('Helvetica');
      const boldFont = await pdfDoc.embedFont('Helvetica-Bold');
      const fontSize = 11;
      const lineHeight = 16;
      const margin = 50;
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      
      let yPosition = pageHeight - margin;
      
      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, options: {
        font?: any;
        size?: number;
        color?: any;
        maxWidth?: number;
        bold?: boolean;
      } = {}) => {
        const {
          font: textFont = font,
          size = fontSize,
          color = rgb(0, 0, 0),
          maxWidth = pageWidth - (margin * 2),
          bold = false
        } = options;
        
        const actualFont = bold ? boldFont : textFont;
        
        if (text.length === 0) return y - lineHeight;
        
        // Split text into lines that fit within maxWidth
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = actualFont.widthOfTextAtSize(testLine, size);
          
          if (textWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              // Single word is too long, force break
              lines.push(word);
            }
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // Draw each line
        let lineY = y;
        for (const line of lines) {
          page.drawText(line, {
            x,
            y: lineY,
            size,
            font: actualFont,
            color
          });
          lineY -= lineHeight;
        }
        
        return lineY;
      };
      
      // Add header
      yPosition = addText('FORMAL REPRESENTATIONS', margin, yPosition, {
        bold: true,
        size: 16
      });
      yPosition -= 10;
      
      // Add case details if provided
      if (caseDetails) {
        yPosition = addText(`Re: Penalty Charge Notice ${caseDetails.pcnNumber || '[PCN Number]'}`, margin, yPosition, {
          bold: true
        });
        yPosition -= 5;
        
        if (caseDetails.vehicleReg) {
          yPosition = addText(`Vehicle Registration: ${caseDetails.vehicleReg}`, margin, yPosition);
          yPosition -= 5;
        }
        
        if (caseDetails.location) {
          yPosition = addText(`Location: ${caseDetails.location}`, margin, yPosition);
          yPosition -= 5;
        }
        
        yPosition -= 10;
      }
      
      // Add date
      const today = new Date().toLocaleDateString('en-GB');
      yPosition = addText(`Date: ${today}`, margin, yPosition);
      yPosition -= 20;
      
      // Add recipient
      const recipient = caseDetails?.councilName ? `${caseDetails.councilName} Parking Services` : '[Council Name] Parking Services';
      yPosition = addText(`To: ${recipient}`, margin, yPosition, { bold: true });
      yPosition -= 20;
      
      // Process the appeal text
      const lines = appealText.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        // Check if we need a new page
        if (yPosition < margin + 50) {
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          yPosition = pageHeight - margin;
          // Update page reference
          page = newPage as any;
        }
        
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          // Bold headers
          const headerText = trimmedLine.replace(/\*\*/g, '');
          yPosition = addText(headerText, margin, yPosition, { bold: true });
          yPosition -= 5;
        } else if (trimmedLine.startsWith('•')) {
          // Bullet points
          yPosition = addText(trimmedLine, margin + 10, yPosition);
          yPosition -= 3;
        } else {
          // Regular text
          yPosition = addText(trimmedLine, margin, yPosition);
          yPosition -= 5;
        }
      }
      
      // Add footer
      yPosition -= 20;
      yPosition = addText('Yours faithfully,', margin, yPosition);
      yPosition -= 30;
      
      if (caseDetails?.appealantName) {
        yPosition = addText(caseDetails.appealantName, margin, yPosition);
        yPosition -= 5;
      }
      
      yPosition = addText('[Your Name]', margin, yPosition);
      yPosition -= 5;
      yPosition = addText('[Your Address]', margin, yPosition);
      yPosition -= 5;
      yPosition = addText('[Your Contact Details]', margin, yPosition);
      
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error generating appeal letter PDF:', error);
      throw new Error('Failed to generate appeal letter PDF');
    }
  }

  /**
   * Generate PDF for enhanced appeal predictor output
   */
  static async generatePredictorReportPDF(
    prediction: any,
    appealData: any
  ): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      
      const font = await pdfDoc.embedFont('Helvetica');
      const boldFont = await pdfDoc.embedFont('Helvetica-Bold');
      
      let yPosition = 800;
      const margin = 50;
      
      // Title
      page.drawText('APPEAL ANALYSIS REPORT', {
        x: margin,
        y: yPosition,
        size: 16,
        font: boldFont
      });
      yPosition -= 30;
      
      // Case details
      page.drawText(`PCN Number: ${appealData.ticketNumber || '[Not provided]'}`, {
        x: margin,
        y: yPosition,
        size: 11,
        font
      });
      yPosition -= 20;
      
      page.drawText(`Success Probability: ${(prediction.successProbability * 100).toFixed(1)}%`, {
        x: margin,
        y: yPosition,
        size: 11,
        font: boldFont,
        color: prediction.successProbability > 0.7 ? rgb(0, 0.7, 0) : prediction.successProbability > 0.4 ? rgb(1, 0.5, 0) : rgb(0.8, 0, 0)
      });
      yPosition -= 30;
      
      // Recommended grounds
      page.drawText('RECOMMENDED GROUNDS:', {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont
      });
      yPosition -= 20;
      
      prediction.recommendedGrounds.forEach((ground: any, index: number) => {
        const groundText = `${index + 1}. ${ground.title} (${ground.legalStrength} strength)`;
        page.drawText(groundText, {
          x: margin + 10,
          y: yPosition,
          size: 10,
          font
        });
        yPosition -= 15;
      });
      
      yPosition -= 20;
      
      // Evidence needed
      page.drawText('EVIDENCE REQUIRED:', {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont
      });
      yPosition -= 20;
      
      prediction.evidenceNeeded.forEach((evidence: string, index: number) => {
        page.drawText(`• ${evidence}`, {
          x: margin + 10,
          y: yPosition,
          size: 10,
          font
        });
        yPosition -= 15;
      });
      
      // Add appeal letter if available
      if (prediction.appealLetter) {
        yPosition -= 30;
        page.drawText('DRAFT APPEAL LETTER:', {
          x: margin,
          y: yPosition,
          size: 12,
          font: boldFont
        });
        yPosition -= 20;
        
        // Add a new page for the letter
        const letterPage = pdfDoc.addPage([595.28, 841.89]);
        
        // Process the appeal letter text
        const lines = prediction.appealLetter.split('\n');
        let letterY = 800;
        
        for (const line of lines) {
          if (letterY < 50) {
            // Add another page if needed
            const newPage = pdfDoc.addPage([595.28, 841.89]);
            letterY = 800;
          }
          
          const isHeader = line.includes('**') || line.includes('To:') || line.includes('Re:');
          
          letterPage.drawText(line.replace(/\*\*/g, ''), {
            x: margin,
            y: letterY,
            size: isHeader ? 11 : 10,
            font: isHeader ? boldFont : font
          });
          letterY -= 14;
        }
      }
      
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error generating predictor report PDF:', error);
      throw new Error('Failed to generate appeal analysis PDF');
    }
  }

  private static setFormField(form: PDFForm, fieldName: string, value: string | undefined) {
    if (!value) return;
    
    try {
      const field = form.getField(fieldName);
      
      if (field instanceof PDFTextField) {
        field.setText(value);
      }
    } catch (error) {
      // Field might not exist in the PDF - this is common
      console.warn(`Field "${fieldName}" not found in PDF form`);
    }
  }

  private static setDropdownField(form: PDFForm, fieldName: string, value: string) {
    try {
      const field = form.getField(fieldName);
      
      if (field instanceof PDFDropdown) {
        const options = field.getOptions();
        if (options.includes(value)) {
          field.select(value);
        }
      }
    } catch (error) {
      // Field might not exist in the PDF - this is common
      console.warn(`Dropdown field "${fieldName}" not found in PDF form`);
    }
  }

  private static setCheckboxField(form: PDFForm, fieldName: string, checked: boolean) {
    try {
      const field = form.getField(fieldName);
      
      if (field instanceof PDFCheckBox) {
        if (checked) {
          field.check();
        } else {
          field.uncheck();
        }
      }
    } catch (error) {
      // Field might not exist in the PDF - this is common
      console.warn(`Checkbox field "${fieldName}" not found in PDF form`);
    }
  }

  // Method to embed signature images into PDF
  private static async embedSignatureImage(pdfDoc: PDFDocument, signatureDataUrl: string, identifier: string): Promise<void> {
    try {
      // Convert data URL to buffer
      const base64Data = signatureDataUrl.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid signature data URL');
      }
      
      const signatureBytes = Buffer.from(base64Data, 'base64');
      
      // Embed the signature image
      const signatureImage = await pdfDoc.embedPng(signatureBytes);
      
      // Get the first page (signatures are typically on the first page)
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Define signature placement based on identifier
      let x = 0, y = 0, width = 150, height = 50;
      
      if (identifier === 'TE7_applicant_signature') {
        // Position for TE7 applicant signature (approximate coordinates)
        x = 100;
        y = 150;
      } else if (identifier === 'TE7_witness_signature') {
        // Position for TE7 witness signature
        x = 350;
        y = 150;
      } else if (identifier === 'TE9_declarant_signature') {
        // Position for TE9 declarant signature
        x = 100;
        y = 100;
      } else if (identifier === 'TE9_witness_signature') {
        // Position for TE9 qualified witness signature
        x = 350;
        y = 100;
      }
      
      // Draw the signature on the page
      firstPage.drawImage(signatureImage, {
        x,
        y,
        width,
        height,
        opacity: 1.0,
      });
      
    } catch (error) {
      console.warn(`Failed to embed signature ${identifier}:`, error);
      // Don't throw - just log warning as signature embedding is optional
    }
  }

  // Utility method to get all form field names (useful for debugging)
  static async getFormFields(templateName: string): Promise<string[]> {
    try {
      const existingPdfBytes = await this.loadPDFTemplate(templateName);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();
      
      return form.getFields().map(field => field.getName());
    } catch (error) {
      console.error(`Error reading form fields from ${templateName}:`, error);
      return [];
    }
  }

    /**
   * Fill PE2 Form (Application to file a Statutory Declaration Out of Time) - Using text overlay
   */
  static async fillPE2Form(data: PE2Data): Promise<Uint8Array> {
    try {
      // Load the PE2 template - use original government form
      const existingPdfBytes = await this.loadPDFTemplate('form-pe2-eng.pdf');
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Get the first page and add text overlays
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // Embed fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Add form title
      firstPage.drawText('PE2 - Application to file a Statutory Declaration Out of Time', {
        x: 50, y: height - 50, size: 14, font: boldFont
      });

      // Court details
      if (data.courtName) {
        firstPage.drawText(`Court: ${data.courtName}`, {
          x: 50, y: height - 100, size: 10, font
        });
      }
      
      if (data.courtAddress) {
        const addressLines = data.courtAddress.split('\n');
        addressLines.forEach((line, index) => {
          firstPage.drawText(line, {
            x: 50, y: height - 130 - (index * 15), size: 9, font
          });
        });
      }

      // Penalty details
      if (data.penaltyChargeNumber) {
        firstPage.drawText(`Penalty Charge Number: ${data.penaltyChargeNumber}`, {
          x: 50, y: height - 200, size: 10, font
        });
      }
      
      if (data.vehicleRegistration) {
        firstPage.drawText(`Vehicle Registration: ${data.vehicleRegistration}`, {
          x: 300, y: height - 200, size: 10, font
        });
      }

      // Applicant details
      if (data.applicantName) {
        firstPage.drawText(`Applicant: ${data.applicantName}`, {
          x: 50, y: height - 230, size: 10, font
        });
      }
      
      if (data.applicantAddress) {
        const addressLines = data.applicantAddress.split('\n');
        addressLines.forEach((line, index) => {
          firstPage.drawText(line, {
            x: 50, y: height - 260 - (index * 15), size: 9, font
          });
        });
      }
      
      if (data.applicantPostcode) {
        firstPage.drawText(`Postcode: ${data.applicantPostcode}`, {
          x: 50, y: height - 320, size: 10, font
        });
      }

      // Contravention details
      if (data.locationOfContravention) {
        firstPage.drawText(`Location: ${data.locationOfContravention}`, {
          x: 50, y: height - 350, size: 10, font
        });
      }
      
      if (data.dateOfContravention) {
        firstPage.drawText(`Date: ${data.dateOfContravention}`, {
          x: 300, y: height - 350, size: 10, font
        });
      }

      // Respondent details
      if (data.respondentName) {
        firstPage.drawText(`Respondent: ${data.respondentName}`, {
          x: 50, y: height - 380, size: 10, font
        });
      }
      
      if (data.respondentAddress) {
        const addressLines = data.respondentAddress.split('\n');
        addressLines.forEach((line, index) => {
          firstPage.drawText(line, {
            x: 50, y: height - 410 - (index * 15), size: 9, font
          });
        });
      }

      // Reasons for late filing
      if (data.reasonsForLateFiling) {
        firstPage.drawText('Reasons for Late Filing:', {
          x: 50, y: height - 480, size: 10, font: boldFont
        });
        
        const reasonLines = this.splitTextIntoLines(data.reasonsForLateFiling, 70);
        reasonLines.forEach((line, index) => {
          if (height - 510 - (index * 12) > 150) {
            firstPage.drawText(line, {
              x: 50, y: height - 510 - (index * 12), size: 9, font
            });
          }
        });
      }

      // Declaration details
      if (data.declarationLocation) {
        firstPage.drawText(`Declared at: ${data.declarationLocation}`, {
          x: 50, y: 200, size: 9, font
        });
      }
      
      if (data.witnessType) {
        firstPage.drawText(`Before me: ${data.witnessType}`, {
          x: 50, y: 180, size: 9, font
        });
      }
      
      if (data.witnessName) {
        firstPage.drawText(`Witness: ${data.witnessName}`, {
          x: 50, y: 160, size: 9, font
        });
      }

      // Signature and date
      if (data.applicantName) {
        firstPage.drawText(data.applicantName, {
          x: 150, y: 120, size: 10, font
        });
      }
      
      const signatureDate = data.signatureDate || new Date().toLocaleDateString('en-GB');
      firstPage.drawText(signatureDate, {
        x: 350, y: 120, size: 10, font
      });

      // Embed signature if provided
      if (data.applicantSignature) {
        await this.embedSignatureImage(pdfDoc, data.applicantSignature, 'PE2_applicant_signature');
      }

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error filling PE2 form:', error);
      throw new Error(`Failed to generate PE2 form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fill PE3 Form (Statutory Declaration – unpaid penalty charge) - Using form fields like TE7
   */
  static async fillPE3Form(data: PE3Data): Promise<Uint8Array> {
    try {
      console.log('Generating PE3 form using Word document template (professional approach)');
      
      // Use the superior Word document approach instead of problematic text overlay
      const pdfBuffer = await WordDocumentService.generatePE3PDF(data);
      
      return new Uint8Array(pdfBuffer);
    } catch (error) {
      console.error('Error generating PE3 form with Word service:', error);
      throw new Error(`Failed to generate PE3 form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fill N244 Form (Application notice) - Using correct field names from actual form
   */
  static async fillN244Form(data: N244Data): Promise<Uint8Array> {
    try {
      // Load the N244 template
      const existingPdfBytes = await this.loadPDFTemplate('n244.pdf');
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      // Fill form fields using actual field names from the PDF inspection
      this.setFormField(form, 'Name of Court', data.courtName);
      this.setFormField(form, 'Claim Number', data.claimNumber);
      
      // Claimant and defendant details
      this.setFormField(form, 'Claimant\'s name including reference', data.applicantName);
      this.setFormField(form, 'Defendant\'s name, including reference', data.isDefendant ? data.applicantName : '');
      
      // Application date
      this.setFormField(form, 'Date of the the application', new Date().toLocaleDateString('en-GB'));
      
      // Evidence/reason for application (main content area)
      this.setFormField(form, 'evidence set out in the box below', data.reasonsForApplication);
      
      // Contact details
      this.setFormField(form, 'Building and street', data.applicantAddress);
      this.setFormField(form, 'postcode for the applicant\'s address', data.applicantPostcode);
      this.setFormField(form, 'phone number', data.applicantPhone || '');
      this.setFormField(form, 'email address', data.applicantEmail || '');
      
      // Statement of truth
      this.setCheckboxField(form, 'I believe that the facts stated in section 10 (and any continuation sheets) are true', data.believeFactsTrue);
      
      // Signature details
      this.setCheckboxField(form, 'Signed by - Applicant', true);
      this.setFormField(form, 'Full name of person signing the Statement of Truth', data.applicantName);
      
      // Signature date
      const today = new Date();
      this.setFormField(form, 'Date of signature - day', today.getDate().toString().padStart(2, '0'));
      this.setFormField(form, 'Date of signature - month', (today.getMonth() + 1).toString().padStart(2, '0'));
      this.setFormField(form, 'Date of signature - year', today.getFullYear().toString());
      
      // Vulnerability assessment
      this.setCheckboxField(form, '11  Do you believe you, or a witness who will give evidence on your behalf, are vulnerable No', true);
      
      // Embed signature if provided
      if (data.applicantSignature) {
        this.setFormField(form, 'Signature box', '[Signature Applied]');
        await this.embedSignatureImage(pdfDoc, data.applicantSignature, 'N244_applicant_signature');
      }

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error filling N244 form:', error);
      throw new Error('Failed to fill N244 form');
    }
  }

  /**
   * Split text into lines of specified character width
   */
  private static splitTextIntoLines(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}

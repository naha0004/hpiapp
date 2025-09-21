import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, CheckBox } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import libre from 'libreoffice-convert';
import { createReport } from 'docx-templates';
import { promisify } from 'util';
import type { PE3Data, PE2Data } from '@/types/appeal';

const libreConvert = promisify(libre.convert);

interface WordFormField {
  placeholder: string;
  value: string;
}

export class WordDocumentService {
  private static getTemplatePath(templateName: string): string {
    return path.join(process.cwd(), 'word_templates', templateName);
  }

  private static templateExists(templateName: string): boolean {
    const templatePath = this.getTemplatePath(templateName);
    // Check for .docx first, then .doc as fallback
    if (fs.existsSync(templatePath)) {
      return true;
    }
    // Also check for .doc version
    const docPath = templatePath.replace('.docx', '.doc');
    return fs.existsSync(docPath);
  }

  private static getActualTemplatePath(templateName: string): string {
    const templatePath = this.getTemplatePath(templateName);
    // Check for .docx first
    if (fs.existsSync(templatePath)) {
      return templatePath;
    }
    // Fallback to .doc version
    const docPath = templatePath.replace('.docx', '.doc');
    if (fs.existsSync(docPath)) {
      return docPath;
    }
    throw new Error(`Template not found: ${templateName}`);
  }

  private static formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  }

  private static formatBoolean(value?: boolean): string {
    return value ? '[X]' : '[ ]';
  }

  private static createPE3Document(data: PE3Data): Document {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "PE3 - STATUTORY DECLARATION",
                bold: true,
                size: 28,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Unpaid penalty charge",
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),

          // Declaration checkboxes section
          new Paragraph({
            children: [
              new TextRun({
                text: "I declare that:",
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${this.formatBoolean(data.didNotReceiveNotice)} I did not receive the Notice to Owner/Enforcement Notice/Penalty Charge Notice`,
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${this.formatBoolean(data.madeRepresentationsNoResponse)} I made representations but did not receive a rejection notice`,
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${this.formatBoolean(data.appealedNoResponse)} I appealed to the Parking/Traffic Adjudicator but received no response`,
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Penalty charge details section
          new Paragraph({
            children: [
              new TextRun({
                text: "PENALTY CHARGE DETAILS",
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Penalty Charge Notice Number:", bold: true })] })],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.penaltyChargeNumber || '' })] })],
                    width: { size: 60, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Vehicle Registration Mark:", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.vehicleRegistration || '' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Date of Contravention:", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: this.formatDate(data.dateOfContravention) })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Location of Contravention:", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.locationOfContravention || '' })] })],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            children: [new TextRun({ text: "" })],
            spacing: { after: 400 },
          }),

          // Applicant details section
          new Paragraph({
            children: [
              new TextRun({
                text: "APPLICANT DETAILS",
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Full Name:", bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.applicantName || '' })] })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Address:", bold: true })] })],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: data.applicantAddress || '' })] }),
                      new Paragraph({ children: [new TextRun({ text: data.applicantPostcode || '' })] }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Postcode:", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.applicantPostcode || '' })] })],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            children: [new TextRun({ text: "" })],
            spacing: { after: 400 },
          }),

          // Respondent details section
          new Paragraph({
            children: [
              new TextRun({
                text: "RESPONDENT DETAILS (BLOCK CAPITALS)",
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Full Name:", bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: (data.respondentName || '').toUpperCase() })] })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Address:", bold: true })] })],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: (data.respondentAddress || '').toUpperCase() })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            children: [new TextRun({ text: "" })],
            spacing: { after: 400 },
          }),

          // Reasons section
          new Paragraph({
            children: [
              new TextRun({
                text: "REASONS FOR DECLARATION",
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: data.reasonForDeclaration || '',
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Witness section
          new Paragraph({
            children: [
              new TextRun({
                text: "WITNESS DETAILS",
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Witness Name:", bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.witnessName || '' })] })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Witness Address:", bold: true })] })],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: data.witnessAddress || '' })] }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Witness Type:", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.witnessType || '' })] })],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            children: [new TextRun({ text: "" })],
            spacing: { after: 600 },
          }),

          // Declaration and signature section
          new Paragraph({
            children: [
              new TextRun({
                text: "DECLARATION",
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.",
                size: 20,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "I believe that the facts stated in this declaration are true.",
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Signature:", bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "____________________________" })] })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Date:", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: this.formatDate(data.signatureDate) || "____________________________" })] })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }],
    });

    return doc;
  }

  private static async fillWordTemplate(templateName: string, data: PE3Data | PE2Data): Promise<Buffer> {
    try {
      // Load the template file (supports both .docx and .doc)
      const actualTemplatePath = this.getActualTemplatePath(templateName);
      const templateBuffer = fs.readFileSync(actualTemplatePath);
      
      // Prepare template data based on form type
      const templateData = this.prepareTemplateData(data, templateName);
      
      console.log(`📝 Filling template: ${actualTemplatePath}`);
      console.log(`🔧 Using data:`, Object.keys(templateData));
      
      // For older .doc files, we might need a different approach
      if (actualTemplatePath.endsWith('.doc')) {
        console.log('⚠️ Detected older .doc format - attempting to process...');
        
        // For now, let's try the same approach and see if it works
        // If not, we'll need LibreOffice or another conversion method
        try {
          const outputBuffer = await createReport({
            template: templateBuffer,
            data: templateData,
            cmdDelimiter: ['{', '}'],
            processLineBreaks: true,
            noSandbox: false,
          });
          
          return Buffer.from(outputBuffer);
        } catch (docError) {
          console.log('❌ .doc format not directly supported by docx-templates');
          console.log('💡 Please convert to .docx format or we can return the original with notes');
          
          // For now, return the original file with a note
          return templateBuffer;
        }
      }
      
      // Use docx-templates to fill the template (.docx files)
      const outputBuffer = await createReport({
        template: templateBuffer,
        data: templateData,
        cmdDelimiter: ['{', '}'], // Use {placeholder} format
        processLineBreaks: true,
        noSandbox: false,
      });
      
      return Buffer.from(outputBuffer);
    } catch (error) {
      console.error('Error filling Word template:', error);
      throw new Error(`Failed to fill Word template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static prepareTemplateData(data: PE3Data | PE2Data, templateName: string): Record<string, any> {
    const baseData = {
      // Common fields
      applicantName: data.applicantName || '',
      applicantAddress: data.applicantAddress || '',
      applicantPostcode: data.applicantPostcode || '',
      vehicleRegistration: data.vehicleRegistration || '',
      dateOfContravention: this.formatDate(data.dateOfContravention),
      locationOfContravention: data.locationOfContravention || '',
      respondentName: data.respondentName?.toUpperCase() || '',
      respondentAddress: data.respondentAddress?.toUpperCase() || '',
      signatureDate: this.formatDate(data.signatureDate) || this.formatDate(new Date().toISOString()),
      declarationLocation: data.declarationLocation || '',
      witnessType: data.witnessType || '',
      witnessName: data.witnessName || '',
      witnessAddress: data.witnessAddress || '',
      
      // Date helpers
      currentDate: new Date().toLocaleDateString('en-GB'),
      currentYear: new Date().getFullYear(),
    };

    if (templateName.includes('PE3')) {
      const pe3Data = data as PE3Data;
      return {
        ...baseData,
        // PE3 specific fields
        penaltyChargeNumber: pe3Data.penaltyChargeNumber || '',
        reasonForDeclaration: pe3Data.reasonForDeclaration || '',
        
        // Checkbox values (X for checked, empty for unchecked)
        didNotReceiveNotice: pe3Data.didNotReceiveNotice ? 'X' : '',
        madeRepresentationsNoResponse: pe3Data.madeRepresentationsNoResponse ? 'X' : '',
        appealedNoResponse: pe3Data.appealedNoResponse ? 'X' : '',
        
        // Boolean helpers for conditional text
        hasDidNotReceiveNotice: pe3Data.didNotReceiveNotice,
        hasMadeRepresentationsNoResponse: pe3Data.madeRepresentationsNoResponse,
        hasAppealedNoResponse: pe3Data.appealedNoResponse,
      };
    } else if (templateName.includes('PE2')) {
      const pe2Data = data as PE2Data;
      return {
        ...baseData,
        // PE2 specific fields
        penaltyChargeNumber: pe2Data.penaltyChargeNumber || '',
        courtName: pe2Data.courtName || '',
        courtAddress: pe2Data.courtAddress || '',
        reasonsForLateFiling: pe2Data.reasonsForLateFiling || '',
      };
    }

    return baseData;
  }

  static async generatePE3Document(data: PE3Data): Promise<Buffer> {
    try {
      // Check if official government template exists
      if (this.templateExists('PE3_template.docx')) {
        console.log('✅ Using official government PE3 template');
        return await this.fillWordTemplate('PE3_template.docx', data);
      }

      console.log('⚠️ Official PE3 template not found, using programmatic generation');
      console.log('💡 Upload PE3_template.docx to word_templates/ for exact government form');
      
      // Fallback to programmatic generation
      const doc = this.createPE3Document(data);
      const buffer = await Packer.toBuffer(doc);
      return buffer;
    } catch (error) {
      console.error('Error generating PE3 Word document:', error);
      throw new Error('Failed to generate PE3 Word document');
    }
  }

  static async generatePE2Document(data: PE2Data): Promise<Buffer> {
    try {
      // Check if official government template exists
      if (this.templateExists('PE2_template.docx')) {
        console.log('✅ Using official government PE2 template');
        return await this.fillWordTemplate('PE2_template.docx', data);
      }

      console.log('⚠️ Official PE2 template not found');
      console.log('💡 Upload PE2_template.docx to word_templates/ for exact government form');
      
      throw new Error('PE2 template not available. Please upload PE2_template.docx to word_templates/');
    } catch (error) {
      console.error('Error generating PE2 Word document:', error);
      throw new Error('Failed to generate PE2 Word document');
    }
  }

  static async generatePE2PDF(data: PE2Data): Promise<Buffer> {
    try {
      // Check if LibreOffice is available
      const { execSync } = require('child_process');
      try {
        execSync('which soffice', { stdio: 'ignore' });
      } catch {
        console.warn('LibreOffice not available - returning Word document instead of PDF');
        return await this.generatePE2Document(data);
      }

      // Generate Word document first
      const wordBuffer = await this.generatePE2Document(data);
      
      // Convert Word to PDF using LibreOffice
      const pdfBuffer = await libreConvert(wordBuffer, '.pdf', undefined);
      
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error converting PE2 Word to PDF, falling back to Word document:', error);
      // Fallback to Word document if PDF conversion fails
      return await this.generatePE2Document(data);
    }
  }

  static async generatePE3PDF(data: PE3Data): Promise<Buffer> {
    try {
      // Check if LibreOffice is available
      const { execSync } = require('child_process');
      try {
        execSync('which soffice', { stdio: 'ignore' });
      } catch {
        console.warn('LibreOffice not available - returning Word document instead of PDF');
        return await this.generatePE3Document(data);
      }

      // Generate Word document first
      const wordBuffer = await this.generatePE3Document(data);
      
      // Convert Word to PDF using LibreOffice
      const pdfBuffer = await libreConvert(wordBuffer, '.pdf', undefined);
      
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error converting PE3 Word to PDF, falling back to Word document:', error);
      // Fallback to Word document if PDF conversion fails
      return await this.generatePE3Document(data);
    }
  }

  static async saveWordDocument(buffer: Buffer, filename: string): Promise<string> {
    const outputPath = path.join(process.cwd(), 'public', 'generated', filename);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }
}

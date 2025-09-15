import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"
import { PDFService } from '@/lib/pdf-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formType, formData } = body
    
    // Handle new form structure with direct PDF generation
    if (formType && formData) {
      // Handle new PDF form types (PE2, PE3, N244) directly with PDFService
      if (['PE2', 'PE3', 'N244'].includes(formType.toUpperCase())) {
        let pdfBytes: Uint8Array;
        
        switch (formType.toUpperCase()) {
          case 'PE2':
            pdfBytes = await PDFService.fillPE2Form(formData);
            break;
          case 'PE3':
            pdfBytes = await PDFService.fillPE3Form(formData);
            break;
          case 'N244':
            pdfBytes = await PDFService.fillN244Form(formData);
            break;
          default:
            throw new Error(`Unsupported form type: ${formType}`);
        }
        
        const response = new NextResponse(pdfBytes);
        response.headers.set('Content-Type', 'application/pdf');
        response.headers.set('Content-Disposition', `attachment; filename="${formType.toUpperCase()}_Form_${Date.now()}.pdf"`);
        return response;
      }
      
      // Handle TE7/TE9 forms with existing logic
      if (['TE7', 'TE9'].includes(formType.toUpperCase())) {
        let pdfBytes: Uint8Array;
        
        if (formType.toUpperCase() === 'TE7') {
          pdfBytes = await PDFService.fillTE7Form(formData);
        } else {
          pdfBytes = await PDFService.fillTE9Form(formData);
        }
        
        const response = new NextResponse(pdfBytes);
        response.headers.set('Content-Type', 'application/pdf');
        response.headers.set('Content-Disposition', `attachment; filename="${formType.toUpperCase()}_Form_${Date.now()}.pdf"`);
        return response;
      }
      // Convert new form structure to expected format
      const userData = {
        form_type: formType.toLowerCase(),
        full_name: formData.te7Data?.applicantName || formData.te9Data?.declarantName || "Not provided",
        pcn_number: formData.ticketNumber || "Not provided",
        vehicle_reg: formData.vehicleRegistration || "Not provided",
        issue_date: formData.issueDate || "Not provided",
        due_date: formData.dueDate || "Not provided",
        fine_amount: formData.fineAmount || "Not provided",
        location: formData.location || "Not provided",
        reason: formData.reason || "Not provided",
        description: formData.description || "Not provided",
        // TE7 specific fields
        witness_statement: formData.te7Data?.witnessStatement || formData.professionalStatement || "Not provided",
        court_name: formData.te7Data?.courtName || "Traffic Enforcement Centre",
        case_number: formData.te7Data?.caseNumber || formData.ticketNumber || "Not provided",
        applicant_address: formData.te7Data?.applicantAddress || "Not provided",
        applicant_phone: formData.te7Data?.applicantPhone || "Not provided",
        applicant_email: formData.te7Data?.applicantEmail || "Not provided",
        // TE9 specific fields
        declaration_statement: formData.te9Data?.declarationStatement || formData.professionalStatement || "Not provided",
        declaration_type: formData.te9Data?.declarationType || "other",
        declaration_date: formData.te9Data?.declarationDate || new Date().toISOString().split('T')[0],
        declarant_address: formData.te9Data?.declarantAddress || "Not provided",
        witness_name: formData.te9Data?.witnessName || "Not provided",
        witness_address: formData.te9Data?.witnessAddress || "Not provided",
        witness_occupation: formData.te9Data?.witnessOccupation || "Not provided"
      }
      
      const result = await generatePDFs(userData)
      
      if (result.success) {
        // Return direct PDF blob for download
        const pdfPath = formType === 'TE7' ? result.te7_path : result.te9_path
        if (pdfPath && fs.existsSync(pdfPath)) {
          const pdfBuffer = fs.readFileSync(pdfPath)
          const response = new NextResponse(pdfBuffer)
          response.headers.set('Content-Type', 'application/pdf')
          response.headers.set('Content-Disposition', `attachment; filename="${formType}_Form_${Date.now()}.pdf"`)
          
          // Clean up temp file
          try {
            fs.unlinkSync(pdfPath)
          } catch (cleanupError) {
            console.log("Failed to cleanup temp file:", cleanupError)
          }
          
          return response
        }
      }
      
      return NextResponse.json(
        { error: "PDF generation failed", details: result.errors || ["Unknown error"] },
        { status: 500 }
      )
    }
    
    // Legacy format validation
    if (!body.full_name || !body.pcn_number) {
      return NextResponse.json(
        { error: "Missing required fields: full_name and pcn_number" },
        { status: 400 }
      )
    }

    // Ensure Python script exists
    const scriptPath = path.join(process.cwd(), "pdf_generator.py")
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: "PDF generator script not found" },
        { status: 500 }
      )
    }

    // Call Python PDF generator
    const result = await generatePDFs(body)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "PDFs generated successfully",
        files: {
          te7: result.te7_generated ? result.te7_path : null,
          te9: result.te9_generated ? result.te9_path : null
        },
        downloadLinks: {
          te7: result.te7_generated ? `/api/download/pdf?file=${encodeURIComponent(path.basename(result.te7_path))}` : null,
          te9: result.te9_generated ? `/api/download/pdf?file=${encodeURIComponent(path.basename(result.te9_path))}` : null
        }
      })
    } else {
      return NextResponse.json(
        { error: "PDF generation failed", details: result.errors },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: "Internal server error during PDF generation" },
      { status: 500 }
    )
  }
}

async function generatePDFs(userData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "pdf_generator.py")
    const pythonProcess = spawn("python3", [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"]
    })

    let stdout = ""
    let stderr = ""

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    pythonProcess.on("close", (code) => {
      try {
        if (code === 0) {
          const result = JSON.parse(stdout)
          resolve(result)
        } else {
          resolve({
            success: false,
            te7_generated: false,
            te9_generated: false,
            te7_path: null,
            te9_path: null,
            errors: [stderr || `Process exited with code ${code}`]
          })
        }
      } catch (parseError) {
        resolve({
          success: false,
          te7_generated: false,
          te9_generated: false,
          te7_path: null,
          te9_path: null,
          errors: [`Parse error: ${parseError}`, stdout, stderr]
        })
      }
    })

    pythonProcess.on("error", (error) => {
      resolve({
        success: false,
        te7_generated: false,
        te9_generated: false,
        te7_path: null,
        te9_path: null,
        errors: [`Process error: ${error.message}`]
      })
    })

    // Send JSON data to Python script
    pythonProcess.stdin.write(JSON.stringify(userData))
    pythonProcess.stdin.end()
  })
}

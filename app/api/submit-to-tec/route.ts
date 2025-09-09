import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"
import { AppealAnalytics } from "@/lib/analytics"
import { withPerformanceTracking } from "@/lib/performance-middleware"

async function submitToTecHandler(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required data
    if (!body.pcn_number || !body.email) {
      await AppealAnalytics.logSystemError(
        'VALIDATION_ERROR',
        'Missing required fields: pcn_number and email',
        undefined,
        '/api/submit-to-tec',
        undefined,
        'MEDIUM'
      )
      return NextResponse.json(
        { error: "Missing required fields: pcn_number and email" },
        { status: 400 }
      )
    }

    // Validate that PDF files exist
    const te7Path = body.te7_path
    const te9Path = body.te9_path
    
    if (!te7Path && !te9Path) {
      await AppealAnalytics.logSystemError(
        'VALIDATION_ERROR',
        'No PDF files available for submission',
        undefined,
        '/api/submit-to-tec',
        undefined,
        'MEDIUM'
      )
      return NextResponse.json(
        { error: "No PDF files available for submission" },
        { status: 400 }
      )
    }

    // Check if PDF files exist
    const te7Exists = te7Path && fs.existsSync(te7Path)
    const te9Exists = te9Path && fs.existsSync(te9Path)
    
    if (!te7Exists && !te9Exists) {
      await AppealAnalytics.logSystemError(
        'FILE_ERROR',
        'PDF files not found on server',
        undefined,
        '/api/submit-to-tec',
        undefined,
        'HIGH'
      )
      return NextResponse.json(
        { error: "PDF files not found on server" },
        { status: 404 }
      )
    }

    // Ensure Python script exists
    const scriptPath = path.join(process.cwd(), "email_submitter.py")
    if (!fs.existsSync(scriptPath)) {
      await AppealAnalytics.logSystemError(
        'SYSTEM_ERROR',
        'Email submission script not found',
        undefined,
        '/api/submit-to-tec',
        undefined,
        'CRITICAL'
      )
      return NextResponse.json(
        { error: "Email submission script not found" },
        { status: 500 }
      )
    }

    // Track email submission attempt
    const submissionId = `${body.pcn_number}-${Date.now()}`
    await AppealAnalytics.trackEmailSubmission(
      submissionId,
      'SENT',
      'tec@justice.gov.uk',
      `TE7 and TE9 Submission for PCN ${body.pcn_number}`
    )

    // Call Python email submitter
    const result = await submitFormsViaEmail(body)

    if (result.success) {
      // Track successful delivery
      await AppealAnalytics.trackEmailSubmission(
        submissionId,
        'DELIVERED',
        'tec@justice.gov.uk',
        `TE7 and TE9 Submission for PCN ${body.pcn_number}`
      )
      
      return NextResponse.json({
        success: true,
        message: "Forms submitted successfully to TEC",
        submissionId,
        data: result
      })
    } else {
      // Track failed delivery
      await AppealAnalytics.trackEmailSubmission(
        submissionId,
        'FAILED',
        'tec@justice.gov.uk',
        `TE7 and TE9 Submission for PCN ${body.pcn_number}`,
        'SMTP',
        result.error
      )
      
      await AppealAnalytics.logSystemError(
        'EMAIL_ERROR',
        `Email submission failed: ${result.error}`,
        undefined,
        '/api/submit-to-tec',
        undefined,
        'HIGH'
      )
      
      return NextResponse.json(
        { error: result.error || "Email submission failed" },
        { status: 500 }
      )
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    await AppealAnalytics.logSystemError(
      'API_ERROR',
      `Submit to TEC error: ${errorMessage}`,
      error instanceof Error ? error.stack : undefined,
      '/api/submit-to-tec',
      undefined,
      'CRITICAL'
    )
    
    console.error("Submit to TEC error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const POST = withPerformanceTracking(submitToTecHandler)

async function submitFormsViaEmail(submissionData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "email_submitter.py")
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
            tec_sent: false,
            user_copy_sent: false,
            errors: [stderr || `Process exited with code ${code}`],
            submission_id: null
          })
        }
      } catch (parseError) {
        resolve({
          success: false,
          tec_sent: false,
          user_copy_sent: false,
          errors: [`Parse error: ${parseError}`, stdout, stderr],
          submission_id: null
        })
      }
    })

    pythonProcess.on("error", (error) => {
      resolve({
        success: false,
        tec_sent: false,
        user_copy_sent: false,
        errors: [`Process error: ${error.message}`],
        submission_id: null
      })
    })

    // Send JSON data to Python script
    pythonProcess.stdin.write(JSON.stringify(submissionData))
    pythonProcess.stdin.end()
  })
}

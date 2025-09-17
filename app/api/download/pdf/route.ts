import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get("file")
    
    if (!fileName) {
      return NextResponse.json(
        { error: "File parameter is required" },
        { status: 400 }
      )
    }

    // Security: Only allow files from the generated_pdfs directory
    const safePath = path.basename(fileName)
    const filePath = path.join(process.cwd(), "generated_pdfs", safePath)
    
    // Validate file exists and is a PDF
    if (!fs.existsSync(filePath) || !safePath.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "File not found or invalid file type" },
        { status: 404 }
      )
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath)
    
    // Determine if it's TE7 or TE9 based on filename
    const isTE7 = safePath.includes("TE7")
    const isTE9 = safePath.includes("TE9")
    
    let downloadName = safePath
    if (isTE7) {
      downloadName = `TE7_Application_${new Date().toISOString().split('T')[0]}.pdf`
    } else if (isTE9) {
      downloadName = `TE9_Statutory_Declaration_${new Date().toISOString().split('T')[0]}.pdf`
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error("PDF download error:", error)
    return NextResponse.json(
      { error: "Internal server error during file download" },
      { status: 500 }
    )
  }
}

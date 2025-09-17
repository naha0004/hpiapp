import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }

    const uploadedFiles = []

    for (const file of files) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 10MB.` },
          { status: 400 }
        )
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} is not a supported format.` },
          { status: 400 }
        )
      }

      // In a real application, you would upload to cloud storage (AWS S3, Cloudinary, etc.)
      // For now, we'll simulate the upload
      const fileName = `${Date.now()}-${file.name}`
      const fileUrl = `/uploads/${fileName}` // Note: placeholder only; not actually stored
      
      uploadedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
        uploadedAt: new Date().toISOString()
      })
    }

    return NextResponse.json({
      message: "Files uploaded successfully",
      files: uploadedFiles
    })

  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

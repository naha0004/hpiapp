import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"

export async function withAuth(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async function(req: NextRequest) {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    return handler(req, session.user.id)
  }
}

export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function(req: NextRequest) {
    try {
      return await handler(req)
    } catch (error) {
      console.error("API Error:", error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }
}

export function withValidation<T>(
  schema: any,
  handler: (req: NextRequest, data: T) => Promise<NextResponse>
) {
  return async function(req: NextRequest) {
    try {
      const body = await req.json()
      const data = schema.parse(body)
      return handler(req, data)
    } catch (error: any) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation error", details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }
  }
}

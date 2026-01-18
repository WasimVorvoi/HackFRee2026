import { NextRequest, NextResponse } from "next/server"
import { updateReputation } from "@/lib/reputation"
import { getUserByToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 })
    }

    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 })
    }

    const { userId, change, reason } = await request.json()

    // Only allow users to update their own reputation, or require admin check
    if (userId !== user.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 403 })
    }

    const result = await updateReputation(userId, change, reason)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error updating reputation:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to update reputation" } },
      { status: 500 }
    )
  }
}

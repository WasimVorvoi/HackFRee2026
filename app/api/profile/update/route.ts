import { NextRequest, NextResponse } from "next/server"
import { getUserByToken, updateUser } from "@/lib/auth"
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

    const body = await request.json()
    const { full_name, location, interests, availability } = body

    updateUser(user.id, {
      full_name,
      location,
      interests,
      availability,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to update profile" } },
      { status: 500 }
    )
  }
}

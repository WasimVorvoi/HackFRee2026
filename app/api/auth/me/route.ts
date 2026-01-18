import { NextRequest, NextResponse } from "next/server"
import { getUserByToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const user = getUserByToken(token)

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get user" },
      { status: 500 }
    )
  }
}

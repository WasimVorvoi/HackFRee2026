import { NextResponse } from "next/server"
import { getUserByToken } from "@/lib/auth"
import { getPersonalizedMatches } from "@/lib/matching-algorithm"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ matches: [] })
    }

    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ matches: [] })
    }

    const matches = await getPersonalizedMatches(user)
    return NextResponse.json({ matches })
  } catch (error: any) {
    console.error("Error fetching matches:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch matches" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getUserByToken } from "@/lib/auth"
import { getDb } from "@/lib/db"
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

    const { opportunityId } = await request.json()
    const db = getDb()
    
    db.prepare(`
      UPDATE messages 
      SET is_read = 1 
      WHERE receiver_id = ? AND opportunity_id = ? AND is_read = 0
    `).run(user.id, opportunityId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to mark messages as read" } },
      { status: 500 }
    )
  }
}

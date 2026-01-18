import { NextResponse } from "next/server"
import { getUserByToken } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ groups: [] })
    }

    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ groups: [] })
    }

    const db = getDb()
    const groups = db.prepare(`
      SELECT g.id, g.name
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
    `).all(user.id) as any[]

    return NextResponse.json({ groups })
  } catch (error: any) {
    console.error("Error fetching user groups:", error)
    return NextResponse.json({ groups: [] })
  }
}

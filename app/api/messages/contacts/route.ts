import { NextResponse } from "next/server"
import { getUserByToken } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ contacts: [] })
    }

    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ contacts: [] })
    }

    const db = getDb()

    // Get opportunities where user is organizer or participant
    const participantOpps = db
      .prepare("SELECT opportunity_id FROM opportunity_participants WHERE user_id = ?")
      .all(user.id) as any[]
    
    const organizedOpps = db
      .prepare("SELECT id FROM opportunities WHERE organizer_id = ?")
      .all(user.id) as any[]

    const allOppIds = [
      ...participantOpps.map((o) => o.opportunity_id),
      ...organizedOpps.map((o) => o.id),
    ]

    if (allOppIds.length === 0) {
      return NextResponse.json({ contacts: [] })
    }

    // Get unique contacts from messages
    const placeholders = allOppIds.map(() => "?").join(",")
    const messages = db
      .prepare(`
        SELECT DISTINCT sender_id, receiver_id, opportunity_id
        FROM messages
        WHERE opportunity_id IN (${placeholders})
          AND (sender_id = ? OR receiver_id = ?)
      `)
      .all(...allOppIds, user.id, user.id) as any[]

    const contactIds = new Set<string>()
    messages.forEach((msg) => {
      if (msg.sender_id !== user.id) contactIds.add(msg.sender_id)
      if (msg.receiver_id !== user.id) contactIds.add(msg.receiver_id)
    })

    // Fetch contact profiles
    if (contactIds.size > 0) {
      const contactPlaceholders = Array.from(contactIds).map(() => "?").join(",")
      const contacts = db
        .prepare(`SELECT id, full_name, email FROM profiles WHERE id IN (${contactPlaceholders})`)
        .all(...Array.from(contactIds)) as any[]

      return NextResponse.json({ contacts })
    }

    return NextResponse.json({ contacts: [] })
  } catch (error: any) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json({ contacts: [] })
  }
}

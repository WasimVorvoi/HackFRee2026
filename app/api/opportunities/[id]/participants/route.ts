import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    const participants = db
      .prepare("SELECT * FROM opportunity_participants WHERE opportunity_id = ?")
      .all(id) as any[]

    return NextResponse.json({ participants })
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to fetch participants" } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: opportunityId } = await params
    const { userId } = await request.json()
    const db = getDb()
    const { randomUUID } = await import("crypto")

    const id = randomUUID()
    db.prepare(
      `INSERT INTO opportunity_participants (id, opportunity_id, user_id, status) VALUES (?, ?, ?, 'pending')`
    ).run(id, opportunityId, userId)

    // Update participant count
    const opp = db.prepare("SELECT current_participants FROM opportunities WHERE id = ?").get(opportunityId) as any
    if (opp) {
      db.prepare("UPDATE opportunities SET current_participants = ? WHERE id = ?").run(
        (opp.current_participants || 0) + 1,
        opportunityId
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to join opportunity" } },
      { status: 500 }
    )
  }
}

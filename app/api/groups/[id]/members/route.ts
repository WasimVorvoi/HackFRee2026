import { NextRequest, NextResponse } from "next/server"
import { getUserByToken } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    const members = db
      .prepare(`
        SELECT gm.user_id, gm.role, p.full_name, p.id
        FROM group_members gm
        JOIN profiles p ON gm.user_id = p.id
        WHERE gm.group_id = ?
      `)
      .all(id) as any[]

    return NextResponse.json({
      members: members.map((m) => ({
        user_id: m.user_id,
        role: m.role,
        profiles: { id: m.id, full_name: m.full_name },
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to fetch members" } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 })
    }

    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 })
    }

    const db = getDb()
    
    // Check if group exists and is open
    const group = db.prepare("SELECT type FROM groups WHERE id = ?").get(id) as any
    if (!group) {
      return NextResponse.json({ error: { message: "Group not found" } }, { status: 404 })
    }

    if (group.type === "invite-only") {
      return NextResponse.json({ error: { message: "This group is invite-only" } }, { status: 403 })
    }

    // Check if already a member
    const existing = db
      .prepare("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?")
      .get(id, user.id)
    
    if (existing) {
      return NextResponse.json({ error: { message: "Already a member" } }, { status: 400 })
    }

    // Add member
    const memberId = randomUUID()
    db.prepare(
      "INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, 'member')"
    ).run(memberId, id, user.id)

    // Update member count
    const memberCount = db
      .prepare("SELECT COUNT(*) as count FROM group_members WHERE group_id = ?")
      .get(id) as any
    db.prepare("UPDATE groups SET member_count = ? WHERE id = ?").run(memberCount.count, id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to join group" } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 })
    }

    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 })
    }

    const db = getDb()
    db.prepare("DELETE FROM group_members WHERE group_id = ? AND user_id = ?").run(id, user.id)

    // Update member count
    const memberCount = db
      .prepare("SELECT COUNT(*) as count FROM group_members WHERE group_id = ?")
      .get(id) as any
    db.prepare("UPDATE groups SET member_count = ? WHERE id = ?").run(memberCount.count, id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to leave group" } },
      { status: 500 }
    )
  }
}

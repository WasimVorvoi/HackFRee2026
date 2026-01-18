import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserByToken } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { randomUUID } from "crypto"

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
    const { opportunity_id, space_id } = body

    if (!opportunity_id && !space_id) {
      return NextResponse.json({ error: { message: "opportunity_id or space_id required" } }, { status: 400 })
    }

    const db = getDb()

    // Check if already liked
    const existing = db
      .prepare(
        "SELECT * FROM likes WHERE user_id = ? AND (opportunity_id = ? OR space_id = ?)"
      )
      .get(user.id, opportunity_id || null, space_id || null)

    if (existing) {
      return NextResponse.json({ error: { message: "Already liked" } }, { status: 400 })
    }

    // Add like
    const id = randomUUID()
    db.prepare(
      "INSERT INTO likes (id, user_id, opportunity_id, space_id) VALUES (?, ?, ?, ?)"
    ).run(id, user.id, opportunity_id || null, space_id || null)

    // Get count
    const count = db
      .prepare(
        "SELECT COUNT(*) as count FROM likes WHERE (opportunity_id = ? OR space_id = ?)"
      )
      .get(opportunity_id || null, space_id || null) as any

    return NextResponse.json({ success: true, count: count.count })
  } catch (error: any) {
    console.error("Error adding like:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to add like" } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const { opportunity_id, space_id } = body

    if (!opportunity_id && !space_id) {
      return NextResponse.json({ error: { message: "opportunity_id or space_id required" } }, { status: 400 })
    }

    const db = getDb()

    // Remove like
    db.prepare(
      "DELETE FROM likes WHERE user_id = ? AND (opportunity_id = ? OR space_id = ?)"
    ).run(user.id, opportunity_id || null, space_id || null)

    // Get count
    const count = db
      .prepare(
        "SELECT COUNT(*) as count FROM likes WHERE (opportunity_id = ? OR space_id = ?)"
      )
      .get(opportunity_id || null, space_id || null) as any

    return NextResponse.json({ success: true, count: count.count })
  } catch (error: any) {
    console.error("Error removing like:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to remove like" } },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const opportunityId = searchParams.get("opportunity_id")
    const spaceId = searchParams.get("space_id")

    if (!opportunityId && !spaceId) {
      return NextResponse.json({ error: { message: "opportunity_id or space_id required" } }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    const user = token ? getUserByToken(token) : null

    const db = getDb()

    // Get count
    const count = db
      .prepare(
        "SELECT COUNT(*) as count FROM likes WHERE (opportunity_id = ? OR space_id = ?)"
      )
      .get(opportunityId || null, spaceId || null) as any

    // Check if user liked
    let liked = false
    if (user) {
      const userLike = db
        .prepare(
          "SELECT * FROM likes WHERE user_id = ? AND (opportunity_id = ? OR space_id = ?)"
        )
        .get(user.id, opportunityId || null, spaceId || null)
      liked = !!userLike
    }

    return NextResponse.json({ liked, count: count.count })
  } catch (error: any) {
    console.error("Error fetching likes:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to fetch likes" } },
      { status: 500 }
    )
  }
}

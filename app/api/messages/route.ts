import { NextRequest, NextResponse } from "next/server"
import { getUserByToken } from "@/lib/auth"
import { getMessagesByOpportunity, createMessage } from "@/lib/db-helpers"
import { getDb } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ messages: [] })
    }

    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ messages: [] })
    }

    const searchParams = request.nextUrl.searchParams
    const opportunityId = searchParams.get("opportunityId")
    const otherUserId = searchParams.get("otherUserId")

    if (!opportunityId || !otherUserId) {
      return NextResponse.json({ messages: [] })
    }

    const messages = getMessagesByOpportunity(opportunityId, user.id)
    
    // Fetch sender/receiver info
    const db = getDb()
    const messagesWithDetails = messages.map((msg) => {
      const sender = db.prepare("SELECT id, full_name FROM profiles WHERE id = ?").get(msg.sender_id) as any
      const receiver = db.prepare("SELECT id, full_name FROM profiles WHERE id = ?").get(msg.receiver_id) as any
      return {
        ...msg,
        sender: sender ? { id: sender.id, full_name: sender.full_name } : null,
        receiver: receiver ? { id: receiver.id, full_name: receiver.full_name } : null,
      }
    })

    return NextResponse.json({ messages: messagesWithDetails })
  } catch (error: any) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ messages: [] })
  }
}

export async function POST(request: Request) {
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
    const message = createMessage({
      ...body,
      sender_id: user.id,
    })

    return NextResponse.json({ message })
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to send message" } },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { getBookingsByUserId, createBooking, confirmBooking as confirmBookingDb } from "@/lib/db-helpers"
import { getUserByToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ bookings: [] })
    }

    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ bookings: [] })
    }

    // Get spaces owned by user
    const { getAllSpaces } = await import("@/lib/db-helpers")
    const spaces = getAllSpaces()
    const userSpaces = spaces.filter((s) => s.owner_id === user.id)
    const spaceIds = userSpaces.map((s) => s.id)

    if (spaceIds.length === 0) {
      return NextResponse.json({ bookings: [] })
    }

    // Get all bookings for user's spaces
    const { getDb } = await import("@/lib/db")
    const db = getDb()
    
    let bookings: any[] = []
    if (spaceIds.length > 0) {
      const placeholders = spaceIds.map(() => "?").join(",")
      bookings = db
        .prepare(
          `
        SELECT b.*, s.name as space_name, s.location as space_location, 
               p.full_name as user_full_name, p.email as user_email
        FROM bookings b
        JOIN spaces s ON b.space_id = s.id
        JOIN profiles p ON b.user_id = p.id
        WHERE b.space_id IN (${placeholders})
        ORDER BY b.start_time DESC
      `
        )
        .all(...spaceIds) as any[]
    }

    const formattedBookings = bookings.map((b) => ({
      id: b.id,
      space_id: b.space_id,
      user_id: b.user_id,
      start_time: b.start_time,
      end_time: b.end_time,
      status: b.status,
      space: {
        id: b.space_id,
        name: b.space_name,
        location: b.space_location,
      },
      user: {
        id: b.user_id,
        full_name: b.user_full_name,
        email: b.user_email,
      },
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error: any) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ bookings: [] })
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
    const booking = createBooking({
      ...body,
      user_id: user.id,
    })

    return NextResponse.json({ booking, expiresAt: booking.expires_at })
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to create booking" } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
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
    const { bookingId, action } = body

    if (action === "confirm") {
      const booking = confirmBookingDb(bookingId, user.id)
      return NextResponse.json({ booking })
    } else if (action === "approve") {
      const { getDb } = await import("@/lib/db")
      const db = getDb()
      db.prepare(
        `UPDATE bookings SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(bookingId)
      const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId)
      return NextResponse.json({ booking })
    } else if (action === "reject") {
      const { getDb } = await import("@/lib/db")
      const db = getDb()
      db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(bookingId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: { message: "Invalid action" } }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to update booking" } },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { spaceId, startTime, endTime, excludeBookingId } = await request.json()

    const db = getDb()
    const bookings = db
      .prepare(
        `
      SELECT id, status, start_time, end_time
      FROM bookings
      WHERE space_id = ? AND status IN ('reserved', 'confirmed', 'pending')
    `
      )
      .all(spaceId) as any[]

    const start = new Date(startTime)
    const end = new Date(endTime)

    const conflicts = bookings.filter((booking) => {
      if (excludeBookingId && booking.id === excludeBookingId) return false

      const bookingStart = new Date(booking.start_time)
      const bookingEnd = new Date(booking.end_time)

      return start < bookingEnd && end > bookingStart
    })

    if (conflicts.length > 0) {
      return NextResponse.json({
        hasConflict: true,
        message: "This time slot is already booked. Please choose another time.",
      })
    }

    return NextResponse.json({ hasConflict: false })
  } catch (error: any) {
    console.error("Error checking booking conflict:", error)
    return NextResponse.json(
      {
        hasConflict: true,
        message: "Error checking availability. Please try again.",
      },
      { status: 500 }
    )
  }
}

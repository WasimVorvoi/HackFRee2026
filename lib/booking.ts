// Booking helper functions - now use API routes
// This file is kept for backward compatibility but functions now call API routes

export interface BookingConflict {
  hasConflict: boolean
  message?: string
}

export async function checkBookingConflict(
  spaceId: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<BookingConflict> {
  try {
    const response = await fetch("/api/bookings/check-conflict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, startTime, endTime, excludeBookingId }),
    })

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error("Error checking booking conflict:", error)
    return {
      hasConflict: true,
      message: "Error checking availability. Please try again.",
    }
  }
}

export async function reserveBooking(
  spaceId: string,
  userId: string,
  startTime: string,
  endTime: string,
  opportunityId?: string,
  termsAccepted: boolean = false
) {
  // Check for conflicts first
  const conflict = await checkBookingConflict(spaceId, startTime, endTime)
  if (conflict.hasConflict) {
    throw new Error(conflict.message || "Booking conflict detected")
  }

  // Get space to check if approval is required
  const spaceResponse = await fetch(`/api/spaces/${spaceId}`)
  const spaceData = await spaceResponse.json()
  const space = spaceData

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 5)

  const status = space?.requires_approval ? "pending" : "reserved"

  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      space_id: spaceId,
      opportunity_id: opportunityId || null,
      start_time: startTime,
      end_time: endTime,
      terms_accepted: termsAccepted,
      status: status,
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to reserve booking")
  }

  return { data: data.booking, expiresAt: data.expiresAt }
}

export async function confirmBooking(bookingId: string) {
  const response = await fetch("/api/bookings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, action: "confirm" }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to confirm booking")
  }

  return { data: data.booking }
}

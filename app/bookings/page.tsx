"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { Calendar, Clock, MapPin, CheckCircle, X } from "lucide-react"
import { BoxLoader } from "@/components/box-loader"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type Booking = {
  id: string
  space_id: string
  user_id: string
  start_time: string
  end_time: string
  status: string
  space?: {
    id: string
    name: string
    location: string
  }
  user?: {
    id: string
    full_name: string
    email: string
  }
}

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/bookings")
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (bookingId: string) => {
    try {
      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "approve" }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to approve booking")
      }

      toast.success("Booking approved")
      fetchBookings()
    } catch (error: any) {
      toast.error(error.message || "Failed to approve booking")
    }
  }

  const handleReject = async (bookingId: string) => {
    try {
      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "reject" }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to reject booking")
      }

      toast.success("Booking rejected")
      fetchBookings()
    } catch (error: any) {
      toast.error(error.message || "Failed to reject booking")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to view bookings</p>
          </Card>
        </main>
      </div>
    )
  }

  const pendingBookings = bookings.filter((b) => b.status === "pending")
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed")
  const otherBookings = bookings.filter((b) => !["pending", "confirmed"].includes(b.status))

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 md:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Bookings</h1>
            <p className="text-muted-foreground mt-2">Review and manage bookings for your spaces</p>
          </div>

          {loading ? (
            <BoxLoader />
          ) : bookings.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No bookings yet</p>
            </Card>
          ) : (
            <div className="space-y-8">
              {pendingBookings.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Pending Approval ({pendingBookings.length})</h2>
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="font-semibold">{booking.space?.name}</h3>
                              <p className="text-sm text-muted-foreground">{booking.user?.full_name}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(booking.start_time).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(booking.start_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  -{" "}
                                  {new Date(booking.end_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => handleApprove(booking.id)} size="sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button onClick={() => handleReject(booking.id)} variant="outline" size="sm">
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {confirmedBookings.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Confirmed ({confirmedBookings.length})</h2>
                  <div className="space-y-4">
                    {confirmedBookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{booking.space?.name}</h3>
                                <Badge variant="default">Confirmed</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{booking.user?.full_name}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(booking.start_time).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(booking.start_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  -{" "}
                                  {new Date(booking.end_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

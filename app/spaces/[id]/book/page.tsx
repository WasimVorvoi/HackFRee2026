"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { reserveBooking, confirmBooking } from "@/lib/booking"
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { BoxLoader } from "@/components/box-loader"
import { toast } from "sonner"
import Link from "next/link"

type Space = {
  id: string
  name: string
  location: string
  capacity: number
  requires_approval: boolean
}

export default function BookSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [space, setSpace] = useState<Space | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<"details" | "confirm" | "success">("details")
  const [reservedBookingId, setReservedBookingId] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(300) // 5 minutes in seconds
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: "",
  })
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    fetchSpace()
  }, [id])

  useEffect(() => {
    if (step === "confirm" && expiresAt) {
      const interval = setInterval(() => {
        const now = new Date()
        const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
        setTimeLeft(diff)

        if (diff === 0) {
          toast.error("Reservation expired. Please start over.")
          setStep("details")
          setReservedBookingId(null)
          setExpiresAt(null)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [step, expiresAt])

  const fetchSpace = async () => {
    try {
      const response = await fetch(`/api/spaces/${id}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch space")
      }
      
      setSpace(data)
    } catch (error) {
      console.error("Error fetching space:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReserve = async () => {
    if (!user) {
      toast.error("Please log in to book a space")
      router.push("/login")
      return
    }

    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions")
      return
    }

    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`)

      if (endDateTime <= startDateTime) {
        toast.error("End time must be after start time")
        return
      }

      const result = await reserveBooking(
        id,
        user.id,
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        undefined,
        termsAccepted
      )

      setReservedBookingId(result.data.id)
      setExpiresAt(new Date(result.expiresAt))
      setStep("confirm")
      toast.success("Space reserved! You have 5 minutes to confirm.")
    } catch (error: any) {
      toast.error(error.message || "Failed to reserve space")
    }
  }

  const handleConfirm = async () => {
    if (!reservedBookingId) return

    try {
      await confirmBooking(reservedBookingId)
      setStep("success")
      toast.success("Booking confirmed!")
    } catch (error: any) {
      toast.error(error.message || "Failed to confirm booking")
      setStep("details")
      setReservedBookingId(null)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <BoxLoader />
        </main>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Space not found</p>
              <Button onClick={() => router.push("/spaces")}>Browse Spaces</Button>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <CheckCircle className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Booking {space.requires_approval ? "Requested" : "Confirmed"}!</CardTitle>
                <CardDescription>
                  {space.requires_approval
                    ? "Your booking request has been submitted. The host will review and approve it."
                    : "Your space has been successfully reserved"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <h3 className="font-semibold">{space.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(formData.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.startTime} to {formData.endTime}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button onClick={() => router.push("/")} className="flex-1">
                  Back to Home
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (step === "confirm") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Confirm Your Booking</CardTitle>
                <CardDescription>
                  Review your booking details. Your reservation expires in {formatTime(timeLeft)}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {timeLeft < 60 && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      Reservation expires soon! Please confirm quickly.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-1">{space.name}</h3>
                    <p className="text-sm text-muted-foreground">{space.location}</p>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(formData.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formData.startTime} - {formData.endTime}
                      </span>
                    </div>
                  </div>

                  {formData.purpose && (
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-1">Purpose:</p>
                      <p className="text-sm text-muted-foreground">{formData.purpose}</p>
                    </div>
                  )}

                  {formData.attendees && (
                    <div>
                      <p className="text-sm font-medium mb-1">Expected attendees:</p>
                      <p className="text-sm text-muted-foreground">{formData.attendees} people</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button onClick={() => setStep("details")} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleConfirm} className="flex-1" disabled={timeLeft === 0}>
                  Confirm Booking
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 md:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Book {space.name}</h1>
            <p className="text-muted-foreground">Fill in the details to reserve this space</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>
                After reserving, you'll have 5 minutes to confirm your booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose (optional)</Label>
                <Textarea
                  id="purpose"
                  placeholder="What will you use this space for?"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendees">Expected Attendees</Label>
                <Input
                  id="attendees"
                  type="number"
                  placeholder="Number of people"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  max={space.capacity}
                />
                <p className="text-xs text-muted-foreground">Maximum capacity: {space.capacity} people</p>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary underline">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/liability" className="text-primary underline">
                    Liability Waiver
                  </Link>
                  . *
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleReserve}
                disabled={!formData.date || !formData.startTime || !formData.endTime || !termsAccepted}
              >
                Reserve Space (5 min hold)
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}

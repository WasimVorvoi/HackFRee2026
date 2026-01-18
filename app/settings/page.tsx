"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { Bell, Lock, User, X, PlusCircle, Loader2, MapPin, Shield, LogOut } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AvailabilityPicker } from "@/components/availability-picker"

export default function SettingsPage() {
  const { user, resendVerificationEmail, emailVerified } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    location: "",
  })
  const [interests, setInterests] = useState<string[]>([])
  const [availability, setAvailability] = useState<Record<string, any>>({})
  const [newInterest, setNewInterest] = useState("")
  const [notifications, setNotifications] = useState({
    emailMessages: true,
    emailMatches: true,
    emailBookings: true,
  })
  const [locationSharing, setLocationSharing] = useState(true)

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || "",
        location: user.location || "",
      })
      setInterests(user.interests || [])
      setAvailability(user.availability || {})
    }
  }, [user])

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()])
      setNewInterest("")
    }
  }

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest))
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          location: formData.location || null,
          interests: interests,
          availability: availability,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to update profile")
      }

      toast.success("Profile updated successfully")
      router.refresh()
      // Refresh the auth context to get updated user data
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    const { error } = await resendVerificationEmail()
    if (error) {
      toast.error(error.message || "Failed to resend verification email")
    } else {
      toast.success("Verification email sent! Please check your inbox.")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to access settings</p>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 md:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account preferences and profile information</p>
          </div>

          {/* Email Verification */}
          {!emailVerified && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-amber-900">Email Verification Required</h3>
                    <p className="text-sm text-amber-800 mt-1">
                      Please verify your email address to access all features.
                    </p>
                  </div>
                  <Button onClick={handleResendVerification} variant="outline" size="sm">
                    Resend Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>Update your personal details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Interests</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an interest..."
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addInterest()
                      }
                    }}
                  />
                  <Button type="button" onClick={addInterest} size="icon">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                      <button
                        onClick={() => removeInterest(interest)}
                        className="ml-1.5 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Availability</Label>
                <AvailabilityPicker
                  value={availability as { days: string[]; timeSlots: string[] }}
                  onChange={(value) => setAvailability(value)}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-messages">Email Messages</Label>
                  <p className="text-sm text-muted-foreground">Receive emails when you get new messages</p>
                </div>
                <Switch
                  id="email-messages"
                  checked={notifications.emailMessages}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailMessages: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-matches">Email Matches</Label>
                  <p className="text-sm text-muted-foreground">Get notified about new matching opportunities</p>
                </div>
                <Switch
                  id="email-matches"
                  checked={notifications.emailMatches}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailMatches: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-bookings">Email Bookings</Label>
                  <p className="text-sm text-muted-foreground">Receive booking confirmations and updates</p>
                </div>
                <Switch
                  id="email-bookings"
                  checked={notifications.emailBookings}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailBookings: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <CardTitle>Location</CardTitle>
              </div>
              <CardDescription>Manage your location sharing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="location-sharing">Share Location</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to see your city for better matching
                  </p>
                </div>
                <Switch
                  id="location-sharing"
                  checked={locationSharing}
                  onCheckedChange={setLocationSharing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Privacy</CardTitle>
              </div>
              <CardDescription>How we handle your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-3">
                <p>
                  <strong>Data Collection:</strong> We collect only the information necessary to provide our services, including your profile data, interests, and activity on the platform.
                </p>
                <p>
                  <strong>Data Usage:</strong> Your data is used to match you with relevant opportunities and spaces. We never sell your personal information to third parties.
                </p>
                <p>
                  <strong>Data Security:</strong> All passwords are securely hashed. We use industry-standard security practices to protect your information.
                </p>
                <p>
                  <strong>Your Rights:</strong> You can request to download or delete your data at any time by contacting our support team.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <CardTitle>Security</CardTitle>
              </div>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>
                Change Password
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Password changes coming soon
              </p>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Sign Out</CardTitle>
              </div>
              <CardDescription>Sign out of your account on this device</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" })
                    router.push("/login")
                    window.location.reload()
                  } catch (error) {
                    toast.error("Failed to sign out")
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

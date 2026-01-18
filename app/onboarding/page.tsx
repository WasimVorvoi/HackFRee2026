"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { PlusCircle, X, ArrowRight, ArrowLeft, Users, UserPlus, SkipForward } from "lucide-react"
import { toast } from "sonner"
import { AvailabilityPicker } from "@/components/availability-picker"

type Group = {
  id: string
  name: string
  purpose: string
  type: string
  member_count: number
  is_certified: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.full_name || "",
    location: user?.location || "",
    interests: user?.interests || [],
    availability: {} as Record<string, any>,
  })
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    purpose: "",
    type: "open" as "open" | "invite-only",
  })
  const [newInterest, setNewInterest] = useState("")

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || "",
        location: user.location || "",
        interests: user.interests || [],
        availability: user.availability || {},
      })
    }
  }, [user])

  useEffect(() => {
    if (step === 2) {
      fetchGroups()
    }
  }, [step])

  const fetchGroups = async () => {
    setLoadingGroups(true)
    try {
      const response = await fetch("/api/groups")
      if (response.ok) {
        const data = await response.json()
        // Filter to only show open groups
        setGroups(data.groups?.filter((g: Group) => g.type === "open") || [])
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()],
      })
      setNewInterest("")
    }
  }

  const handleStep1Complete = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          location: formData.location || null,
          interests: formData.interests,
          availability: formData.availability,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update profile")
      }

      toast.success("Profile updated!")
      setStep(2)
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!user || !selectedGroup) return

    setLoading(true)
    try {
      const response = await fetch(`/api/groups/${selectedGroup}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to join group")
      }

      toast.success("Joined group successfully!")
      router.push("/")
    } catch (error: any) {
      toast.error(error.message || "Failed to join group")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!user || !newGroupData.name) return

    setLoading(true)
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupData.name,
          purpose: newGroupData.purpose,
          type: newGroupData.type,
          organizerId: user.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to create group")
      }

      toast.success("Group created successfully!")
      router.push("/")
    } catch (error: any) {
      toast.error(error.message || "Failed to create group")
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push("/")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Please log in</p>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 md:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              1
            </div>
            <div className={`w-16 h-1 rounded ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              2
            </div>
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Your Profile</CardTitle>
                <CardDescription>Help us match you with the right opportunities and spaces</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
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

                <div className="space-y-2">
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.interests.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                        <button
                          onClick={() =>
                            setFormData({
                              ...formData,
                              interests: formData.interests.filter((i) => i !== interest),
                            })
                          }
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Availability</Label>
                  <AvailabilityPicker
                    value={formData.availability as { days: string[]; timeSlots: string[] }}
                    onChange={(value) => setFormData({ ...formData, availability: value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleStep1Complete} disabled={loading || !formData.fullName} className="flex-1">
                    {loading ? "Saving..." : "Continue"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={handleSkip} className="flex-1">
                    Skip for Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && !showCreateGroup && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Join a Community</CardTitle>
                <CardDescription>Connect with groups that share your interests (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingGroups ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading groups...</p>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No open groups available yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Be the first to create one!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedGroup === group.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{group.name}</h3>
                              {group.is_certified && (
                                <Badge variant="secondary" className="text-xs">Certified</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{group.purpose}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedGroup === group.id ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}>
                            {selectedGroup === group.id && (
                              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-4">
                  {selectedGroup && (
                    <Button onClick={handleJoinGroup} disabled={loading}>
                      {loading ? "Joining..." : "Join Selected Group"}
                      <Users className="ml-2 h-4 w-4" />
                    </Button>
                  )}

                  <Button variant="outline" onClick={() => setShowCreateGroup(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create a New Group
                  </Button>

                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button variant="ghost" onClick={handleSkip} className="flex-1">
                      <SkipForward className="mr-2 h-4 w-4" />
                      Skip
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && showCreateGroup && (
            <Card>
              <CardHeader>
                <CardTitle>Create a Group</CardTitle>
                <CardDescription>Start your own community group</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name *</Label>
                  <Input
                    id="groupName"
                    placeholder="e.g., Bay Area Tech Enthusiasts"
                    value={newGroupData.name}
                    onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupPurpose">Purpose</Label>
                  <Input
                    id="groupPurpose"
                    placeholder="What is this group about?"
                    value={newGroupData.purpose}
                    onChange={(e) => setNewGroupData({ ...newGroupData, purpose: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Group Type</Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={newGroupData.type === "open" ? "default" : "outline"}
                      onClick={() => setNewGroupData({ ...newGroupData, type: "open" })}
                      className="flex-1"
                    >
                      Open
                    </Button>
                    <Button
                      type="button"
                      variant={newGroupData.type === "invite-only" ? "default" : "outline"}
                      onClick={() => setNewGroupData({ ...newGroupData, type: "invite-only" })}
                      className="flex-1"
                    >
                      Invite Only
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {newGroupData.type === "open"
                      ? "Anyone can join this group"
                      : "Members must be invited to join"}
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button onClick={handleCreateGroup} disabled={loading || !newGroupData.name}>
                    {loading ? "Creating..." : "Create Group"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button variant="ghost" onClick={() => setShowCreateGroup(false)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Group List
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

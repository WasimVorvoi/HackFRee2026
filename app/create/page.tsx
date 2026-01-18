"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { PlusCircle, X, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

export default function CreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)

  // Space form state
  const [spaceForm, setSpaceForm] = useState({
    name: "",
    description: "",
    location: "",
    capacity: "",
    requires_approval: false,
    min_reputation_tier: "New" as "New" | "Trusted" | "Established" | "Advanced" | "Certified",
  })
  const [spaceAmenities, setSpaceAmenities] = useState<string[]>([])
  const [newAmenity, setNewAmenity] = useState("")

  // Opportunity form state
  const [oppForm, setOppForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    participant_limit: "",
    required_rep_tier: "New" as "New" | "Trusted" | "Established" | "Advanced" | "Certified",
    requires_certified_group: false,
    group_id: "_self",
  })
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [aiPlan, setAiPlan] = useState<{ title: string; steps: string[]; resources: string[] } | null>(null)
  const [userGroups, setUserGroups] = useState<Array<{ id: string; name: string }>>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserGroups()
    }
  }, [user])

  const fetchUserGroups = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/groups/user")
      const data = await response.json()
      if (data.groups) {
        setUserGroups(data.groups)
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  const generateAIPlan = async () => {
    if (!oppForm.description) {
      toast.error("Please enter a description first")
      return
    }

    setGeneratingAI(true)
    try {
      const response = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: oppForm.description,
          category: tags[0] || "general",
          userTier: user?.reputation_tier || "New",
        }),
      })

      const plan = await response.json()
      setAiPlan(plan)
      if (plan.title && !oppForm.title) {
        setOppForm({ ...oppForm, title: plan.title })
      }
      toast.success("AI plan generated! Review and edit before publishing.")
    } catch (error) {
      toast.error("Failed to generate plan. Using template.")
      // Fallback template
      setAiPlan({
        title: oppForm.title || "Community Project",
        steps: [
          "Planning: Define goals and assign tasks",
          "Execution: Work together to complete project",
          "Reflection: Review outcomes and celebrate success",
        ],
        resources: ["Materials", "Space", "Team coordination"],
      })
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleCreateSpace = async () => {
    if (!user) {
      toast.error("Please log in")
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: spaceForm.name,
          description: spaceForm.description,
          location: spaceForm.location,
          capacity: Number.parseInt(spaceForm.capacity) || 10,
          requires_approval: spaceForm.requires_approval,
          amenities: spaceAmenities,
          min_reputation_tier: spaceForm.min_reputation_tier,
          availability: {},
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to create space")
      }

      toast.success("Space created successfully!")
      router.push("/spaces")
    } catch (error: any) {
      toast.error(error.message || "Failed to create space")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOpportunity = async () => {
    if (!user) {
      toast.error("Please log in")
      router.push("/login")
      return
    }

    if (!oppForm.date || !oppForm.startTime || !oppForm.endTime) {
      toast.error("Please select date and time")
      return
    }

    setLoading(true)
    try {
      const dateObj = new Date(oppForm.date)
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" })

      const timeSlot = {
        date: oppForm.date,
        start: oppForm.startTime,
        end: oppForm.endTime,
        day: dayName,
      }

      const response = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: oppForm.title,
          description: oppForm.description,
          group_id: oppForm.group_id && oppForm.group_id !== "_self" ? oppForm.group_id : null,
          tags: tags,
          time_slot: timeSlot,
          ai_plan: aiPlan,
          required_rep_tier: oppForm.required_rep_tier,
          requires_certified_group: oppForm.requires_certified_group,
          max_participants: Number.parseInt(oppForm.participant_limit) || 10,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to create opportunity")
      }

      // Update reputation for hosting
      // Update reputation via API
      try {
        await fetch("/api/reputation/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, change: 5, reason: "host" }),
        })
      } catch (error) {
        console.error("Failed to update reputation:", error)
        // Don't fail the whole operation if reputation update fails
      }

      toast.success("Opportunity created successfully!")
      router.push("/opportunities")
    } catch (error: any) {
      toast.error(error.message || "Failed to create opportunity")
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const addAmenity = () => {
    if (newAmenity.trim() && !spaceAmenities.includes(newAmenity.trim())) {
      setSpaceAmenities([...spaceAmenities, newAmenity.trim()])
      setNewAmenity("")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Please log in to create content</p>
            <Button asChild>
              <a href="/login">Log In</a>
            </Button>
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
            <h1 className="text-4xl font-bold tracking-tight mb-3">Create</h1>
            <p className="text-lg text-muted-foreground">List a space or create an opportunity for your community</p>
          </div>

          <Tabs defaultValue="opportunity">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="opportunity">Opportunity</TabsTrigger>
              <TabsTrigger value="space">Space</TabsTrigger>
            </TabsList>

            {/* Create Opportunity */}
            <TabsContent value="opportunity">
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl">Create an Opportunity</CardTitle>
                  <CardDescription className="text-base">Start a project or event and invite community members to join</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="opp-title">Title</Label>
                    <Input
                      id="opp-title"
                      placeholder="Urban Garden Workshop Series"
                      value={oppForm.title}
                      onChange={(e) => setOppForm({ ...oppForm, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opp-description">Description</Label>
                    <Textarea
                      id="opp-description"
                      placeholder="Describe what participants will do and learn..."
                      value={oppForm.description}
                      onChange={(e) => setOppForm({ ...oppForm, description: e.target.value })}
                      rows={6}
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag (e.g., education, tech, art)..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addTag()
                          }
                        }}
                      />
                      <Button type="button" onClick={addTag} size="icon">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <button
                            onClick={() => setTags(tags.filter((t) => t !== tag))}
                            className="ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>AI Plan Generator</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateAIPlan}
                        disabled={generatingAI || !oppForm.description}
                      >
                        {generatingAI ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Plan
                          </>
                        )}
                      </Button>
                    </div>
                    {aiPlan && (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="pt-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Plan Title</Label>
                            <Input
                              value={aiPlan.title}
                              onChange={(e) => setAiPlan({ ...aiPlan, title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>3-Step Plan</Label>
                            {aiPlan.steps.map((step, idx) => (
                              <Input
                                key={idx}
                                value={step}
                                onChange={(e) => {
                                  const newSteps = [...aiPlan.steps]
                                  newSteps[idx] = e.target.value
                                  setAiPlan({ ...aiPlan, steps: newSteps })
                                }}
                                className="mb-2"
                              />
                            ))}
                          </div>
                          <div className="space-y-2">
                            <Label>Resources</Label>
                            <div className="flex flex-wrap gap-2">
                              {aiPlan.resources.map((resource, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {resource}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="opp-date">Date *</Label>
                      <Input
                        id="opp-date"
                        type="date"
                        value={oppForm.date}
                        onChange={(e) => setOppForm({ ...oppForm, date: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="opp-time">Time *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          id="opp-start-time"
                          type="time"
                          placeholder="Start"
                          value={oppForm.startTime}
                          onChange={(e) => setOppForm({ ...oppForm, startTime: e.target.value })}
                        />
                        <Input
                          id="opp-end-time"
                          type="time"
                          placeholder="End"
                          value={oppForm.endTime}
                          onChange={(e) => setOppForm({ ...oppForm, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opp-limit">Participant Limit</Label>
                    <Input
                      id="opp-limit"
                      type="number"
                      placeholder="20"
                      value={oppForm.participant_limit}
                      onChange={(e) => setOppForm({ ...oppForm, participant_limit: e.target.value })}
                    />
                  </div>

                  {userGroups.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="opp-group">Hosted by (optional)</Label>
                      <Select
                        value={oppForm.group_id}
                        onValueChange={(value) => setOppForm({ ...oppForm, group_id: value })}
                      >
                        <SelectTrigger id="opp-group">
                          <SelectValue placeholder="Select a group or leave as self" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_self">Self (No group)</SelectItem>
                          {userGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                      Advanced Settings
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="opp-rep-tier">Required Reputation Tier</Label>
                        <Select
                          value={oppForm.required_rep_tier}
                          onValueChange={(value: any) =>
                            setOppForm({ ...oppForm, required_rep_tier: value })
                          }
                        >
                          <SelectTrigger id="opp-rep-tier">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Trusted">Trusted</SelectItem>
                            <SelectItem value="Established">Established</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Certified">Certified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCreateOpportunity}
                    disabled={!oppForm.title || !oppForm.description || !oppForm.date || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Opportunity"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Create Space */}
            <TabsContent value="space">
              <Card>
                <CardHeader>
                  <CardTitle>List a Space</CardTitle>
                  <CardDescription>Share your venue with community organizers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="space-name">Space Name *</Label>
                    <Input
                      id="space-name"
                      placeholder="Community Garden Studio"
                      value={spaceForm.name}
                      onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="space-description">Description *</Label>
                    <Textarea
                      id="space-description"
                      placeholder="Describe your space, what makes it special..."
                      value={spaceForm.description}
                      onChange={(e) => setSpaceForm({ ...spaceForm, description: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="space-location">Location *</Label>
                      <Input
                        id="space-location"
                        placeholder="123 Main St, San Francisco, CA"
                        value={spaceForm.location}
                        onChange={(e) => setSpaceForm({ ...spaceForm, location: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="space-capacity">Capacity *</Label>
                      <Input
                        id="space-capacity"
                        type="number"
                        placeholder="30"
                        value={spaceForm.capacity}
                        onChange={(e) => setSpaceForm({ ...spaceForm, capacity: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Amenities</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add an amenity..."
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addAmenity()
                          }
                        }}
                      />
                      <Button type="button" onClick={addAmenity} size="icon">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {spaceAmenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary">
                          {amenity}
                          <button
                            onClick={() => setSpaceAmenities(spaceAmenities.filter((a) => a !== amenity))}
                            className="ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requires-approval"
                      checked={spaceForm.requires_approval}
                      onChange={(e) => setSpaceForm({ ...spaceForm, requires_approval: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="requires-approval" className="cursor-pointer">
                      Requires host approval for bookings
                    </Label>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCreateSpace}
                    disabled={!spaceForm.name || !spaceForm.description || !spaceForm.location || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "List Space"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

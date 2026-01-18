"use client"

import { useState, useEffect, use } from "react"
import { Navbar } from "@/components/navbar"
import { LikeButton } from "@/components/like-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { Users, Calendar, Clock, CheckCircle, Star, Shield, MapPin, MessageSquare } from "lucide-react"
import { BoxLoader } from "@/components/box-loader"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FeedbackModal } from "@/components/feedback-modal"

type Opportunity = {
  id: string
  title: string
  description: string
  organizer_id: string
  group_id: string | null
  tags: string[]
  time_slot: Record<string, any>
  ai_plan: Record<string, any> | null
  status: string
  required_rep_tier: string
  requires_certified_group: boolean
  max_participants: number
  current_participants: number
  suggested_space_id: string | null
  organizer?: {
    id: string
    full_name: string
    email: string
    location: string | null
    reputation_tier: string
    reputation_score: number
  }
  group?: {
    id: string
    name: string
    is_certified: boolean
  }
}

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasJoined, setHasJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [hasGivenFeedback, setHasGivenFeedback] = useState(false)

  useEffect(() => {
    fetchOpportunity()
    checkIfJoined()
    fetchLikes()
    checkFeedback()
  }, [id, user])

  const checkFeedback = async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/feedback?opportunity_id=${id}`)
      if (response.ok) {
        const data = await response.json()
        const userFeedback = data.feedback?.find((f: any) => f.from_user_id === user.id)
        setHasGivenFeedback(!!userFeedback)
      }
    } catch (error) {
      // No feedback given yet
    }
  }

  const fetchLikes = async () => {
    try {
      const response = await fetch(`/api/likes?opportunity_id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked || false)
        setLikeCount(data.count || 0)
      }
    } catch (error) {
      console.error("Error fetching likes:", error)
    }
  }

  const fetchOpportunity = async () => {
    try {
      const response = await fetch(`/api/opportunities/${id}`)
      const oppData = await response.json()
      
      if (!response.ok) {
        throw new Error(oppData.error?.message || "Failed to fetch opportunity")
      }

      // Fetch organizer and group info
      try {
        const organizerResponse = await fetch(`/api/profile/${oppData.organizer_id}`)
        const organizer = organizerResponse.ok ? await organizerResponse.json() : null
        
        let group = null
        if (oppData.group_id) {
          const groupResponse = await fetch(`/api/groups/${oppData.group_id}`)
          if (groupResponse.ok) {
            group = await groupResponse.json()
          }
        }
        
        setOpportunity({
          ...oppData,
          organizer: organizer?.user || null,
          group: group || null,
        })
      } catch {
        setOpportunity(oppData)
      }
    } catch (error) {
      console.error("Error fetching opportunity:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkIfJoined = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/opportunities/${id}/participants`)
      const data = await response.json()
      
      if (data.participants) {
        const userParticipant = data.participants.find((p: any) => p.user_id === user.id)
        if (userParticipant) {
          setHasJoined(userParticipant.status === "approved" || userParticipant.status === "pending")
        }
      }
    } catch (error) {
      // Not joined
    }
  }

  const handleJoin = async () => {
    if (!user) {
      toast.error("Please log in to join")
      router.push("/login")
      return
    }

    if (!opportunity) return

    // Check reputation tier requirement
    const tierOrder = ["New", "Trusted", "Established", "Advanced", "Certified"]
    const userTierIndex = tierOrder.indexOf(user.reputation_tier)
    const requiredTierIndex = tierOrder.indexOf(opportunity.required_rep_tier)

    if (userTierIndex < requiredTierIndex) {
      toast.error(`This opportunity requires ${opportunity.required_rep_tier} reputation tier`)
      return
    }

    setJoining(true)
    try {
      const response = await fetch(`/api/opportunities/${id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to join")
      }

      setHasJoined(true)
      toast.success("Request to join submitted!")
      fetchOpportunity()
    } catch (error: any) {
      toast.error(error.message || "Failed to join")
    } finally {
      setJoining(false)
    }
  }

  const reputationTierColors: Record<string, string> = {
    New: "bg-gray-100 text-gray-800",
    Trusted: "bg-blue-100 text-blue-800",
    Established: "bg-green-100 text-green-800",
    Advanced: "bg-purple-100 text-purple-800",
    Certified: "bg-amber-100 text-amber-800",
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

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Opportunity not found</p>
            <Button asChild className="mt-4">
              <Link href="/opportunities">Browse Opportunities</Link>
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  const spotsLeft = opportunity.max_participants - opportunity.current_participants
  const formatTimeSlot = (timeSlot: Record<string, any>) => {
    if (timeSlot.date) {
      return new Date(timeSlot.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
    return "TBD"
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {opportunity.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                    <Badge variant={opportunity.status === "open" ? "default" : "outline"}>
                      {opportunity.status}
                    </Badge>
                    {opportunity.group?.is_certified && (
                      <Badge variant="secondary">Certified Group</Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">{opportunity.title}</h1>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatTimeSlot(opportunity.time_slot)}</span>
                </div>
                {opportunity.time_slot.start && opportunity.time_slot.end && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{opportunity.time_slot.start} - {opportunity.time_slot.end}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {opportunity.current_participants}/{opportunity.max_participants} participants
                  </span>
                </div>
              </div>

              {opportunity.required_rep_tier !== "New" && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Requires {opportunity.required_rep_tier} reputation tier
                    </p>
                  </div>
                </div>
              )}

              {spotsLeft <= 5 && spotsLeft > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left!
                  </p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">About this opportunity</h2>
              <p className="text-muted-foreground leading-relaxed">{opportunity.description}</p>
            </div>

            {opportunity.ai_plan && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Plan</h2>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {opportunity.ai_plan.steps && (
                      <div className="space-y-2">
                        {opportunity.ai_plan.steps.map((step: string, idx: number) => (
                          <div key={idx} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                              {idx + 1}
                            </div>
                            <p className="text-sm text-muted-foreground flex-1">{step}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {opportunity.ai_plan.resources && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Resources needed:</p>
                        <div className="flex flex-wrap gap-2">
                          {opportunity.ai_plan.resources.map((resource: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {opportunity.suggested_space_id && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Suggested Space</h2>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-3">
                      This opportunity has a suggested space. You can book it after joining.
                    </p>
                    <Button variant="outline" asChild>
                      <Link href={`/spaces/${opportunity.suggested_space_id}`}>View Space</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Organized by</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{opportunity.organizer?.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{opportunity.organizer?.full_name}</p>
                        {opportunity.organizer?.location && (
                          <p className="text-sm text-muted-foreground">{opportunity.organizer.location}</p>
                        )}
                      </div>
                    </div>

                    {opportunity.organizer && (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-medium">{opportunity.organizer.reputation_score}</span>
                        <span className="text-muted-foreground">reputation</span>
                        <Badge className={`text-xs ${reputationTierColors[opportunity.organizer.reputation_tier] || ""}`}>
                          {opportunity.organizer.reputation_tier}
                        </Badge>
                      </div>
                    )}

                    {opportunity.group && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground mb-1">Hosted by group:</p>
                        <Badge variant="secondary">{opportunity.group.name}</Badge>
                        {opportunity.group.is_certified && (
                          <Badge variant="secondary" className="ml-2">Certified</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {hasJoined ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/10 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">You've joined!</span>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href={`/messages?user=${opportunity.organizer_id}`}>Message Organizer</Link>
                    </Button>
                    {/* Feedback button - show for completed opportunities or allow early feedback */}
                    {!hasGivenFeedback && (
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => setShowFeedbackModal(true)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {opportunity.status === "completed" ? "Leave Feedback" : "Rate Experience"}
                      </Button>
                    )}
                    {hasGivenFeedback && (
                      <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm text-muted-foreground">Feedback submitted</span>
                      </div>
                    )}
                    <div className="flex justify-center mt-3">
                      <LikeButton opportunityId={id} initialLiked={liked} initialCount={likeCount} />
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleJoin}
                      disabled={spotsLeft === 0 || joining}
                    >
                      {joining ? "Joining..." : spotsLeft === 0 ? "Fully Booked" : "Join This Opportunity"}
                    </Button>

                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href={`/messages?user=${opportunity.organizer_id}`}>Ask a Question</Link>
                    </Button>
                    <div className="flex justify-center mt-3">
                      <LikeButton opportunityId={id} initialLiked={liked} initialCount={likeCount} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Feedback Modal */}
      {opportunity && user && (
        <FeedbackModal
          open={showFeedbackModal}
          onOpenChange={(open) => {
            setShowFeedbackModal(open)
            if (!open) {
              checkFeedback() // Refresh feedback status after closing
            }
          }}
          opportunityId={id}
          organizerId={opportunity.organizer_id}
          userId={user.id}
          opportunityTitle={opportunity.title}
        />
      )}
    </div>
  )
}

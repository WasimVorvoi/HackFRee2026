"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { Users, Shield, UserPlus, UserMinus } from "lucide-react"
import { BoxLoader } from "@/components/box-loader"
import { useMinLoading } from "@/hooks/use-min-loading"
import { useRouter } from "next/navigation"
import { useState, useEffect, use } from "react"
import { toast } from "sonner"
import Link from "next/link"

type Group = {
  id: string
  name: string
  purpose: string | null
  type: string
  is_certified: boolean
  average_rep_score: number
  member_count: number
  organizer_id: string
  organizer?: {
    id: string
    full_name: string
    email: string
  }
  members?: Array<{
    user_id: string
    role: string
    profiles?: {
      id: string
      full_name: string
    }
  }>
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const showLoader = useMinLoading(loading)
  const [isMember, setIsMember] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    fetchGroup()
    checkMembership()
  }, [id, user])

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${id}`)
      const groupData = await response.json()
      
      if (!response.ok) {
        throw new Error(groupData.error?.message || "Failed to fetch group")
      }

      // Fetch organizer and members
      try {
        const organizerResponse = await fetch(`/api/profile/${groupData.organizer_id}`)
        const organizer = organizerResponse.ok ? await organizerResponse.json() : null

        // Fetch members via API
        const membersResponse = await fetch(`/api/groups/${id}/members`)
        const membersData = membersResponse.ok ? await membersResponse.json() : { members: [] }

        setGroup({
          ...groupData,
          organizer: organizer?.user || null,
          members: membersData.members || [],
        })
      } catch {
        setGroup(groupData)
      }
    } catch (error) {
      console.error("Error fetching group:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkMembership = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/groups/${id}/members`)
      if (response.ok) {
        const data = await response.json()
        const isMember = data.members?.some((m: any) => m.user_id === user.id)
        if (isMember) {
          setIsMember(true)
        }
      }
    } catch (error) {
      // Not a member
    }
  }

  const handleJoin = async () => {
    if (!user) {
      toast.error("Please log in to join groups")
      router.push("/login")
      return
    }

    if (group?.type === "invite-only") {
      toast.error("This group is invite-only. Contact the organizer.")
      return
    }

    setJoining(true)
    try {
      const response = await fetch(`/api/groups/${id}/members`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to join group")
      }

      setIsMember(true)
      toast.success("Joined group!")
      fetchGroup()
    } catch (error: any) {
      toast.error(error.message || "Failed to join group")
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/groups/${id}/members`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to leave group")
      }

      setIsMember(false)
      toast.success("Left group")
      fetchGroup()
    } catch (error: any) {
      toast.error(error.message || "Failed to leave group")
    }
  }

  if (showLoader) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <BoxLoader />
        </main>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Group not found</p>
            <Button asChild className="mt-4">
              <Link href="/groups">Browse Groups</Link>
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
              {group.is_certified && (
                <Badge variant="secondary">
                  <Shield className="h-4 w-4 mr-1" />
                  Certified Group
                </Badge>
              )}
              <Badge variant={group.type === "open" ? "default" : "secondary"}>
                {group.type === "open" ? "Open" : "Invite Only"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{group.purpose || "No description"}</p>
          </div>
          {user && (
            <div>
              {isMember ? (
                <Button onClick={handleLeave} variant="outline">
                  <UserMinus className="h-4 w-4 mr-2" />
                  Leave Group
                </Button>
              ) : (
                <Button onClick={handleJoin} disabled={joining}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {joining ? "Joining..." : "Join Group"}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{group.purpose || "No description available"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Members ({group.member_count})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.members?.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{member.profiles?.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{member.profiles?.full_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Group Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Members</span>
                  <span className="font-semibold">{group.member_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Reputation</span>
                  <span className="font-semibold">{group.average_rep_score}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Organizer</span>
                  <span className="font-semibold">{group.organizer?.full_name}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

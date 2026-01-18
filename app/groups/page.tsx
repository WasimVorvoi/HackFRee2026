"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Shield, Search, ArrowRight, Star } from "lucide-react"
import { BoxLoader } from "@/components/box-loader"
import { useMinLoading } from "@/hooks/use-min-loading"
import Link from "next/link"
import { useState, useEffect } from "react"

type Group = {
  id: string
  name: string
  purpose: string | null
  type: string
  is_certified: boolean
  average_rep_score: number
  member_count: number
  organizer?: {
    id: string
    full_name: string
  }
}

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const showLoader = useMinLoading(loading)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups")
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch groups")
      }

      // Fetch organizer info for each group
      const groupsWithOrganizers = await Promise.all(
        (data || []).map(async (group: any) => {
          try {
            const organizerResponse = await fetch(`/api/profile/${group.organizer_id}`)
            if (organizerResponse.ok) {
              const organizer = await organizerResponse.json()
              return { ...group, organizer: organizer.user || null }
            }
          } catch {
            // Ignore errors
          }
          return group
        })
      )

      setGroups(groupsWithOrganizers)
    } catch (error) {
      console.error("Error fetching groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.purpose?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-10 space-y-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">Browse Groups</h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Find communities and collaborate together on meaningful projects
            </p>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <p className="text-muted-foreground">No groups found</p>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="flex flex-col bg-card border shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="space-y-4 px-6 pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Badge variant={group.type === "open" ? "default" : "secondary"} className="shadow-sm">
                        {group.type === "open" ? "Open Group" : "Invite Only"}
                      </Badge>
                      <CardTitle className="text-xl leading-tight">{group.name}</CardTitle>
                    </div>
                    {group.is_certified && (
                      <Badge variant="outline" className="shrink-0 shadow-sm bg-amber-50 text-amber-700 border-amber-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Certified
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 leading-relaxed">
                    {group.purpose || "No description available"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-5 px-6 pb-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{group.member_count} member{group.member_count !== 1 ? "s" : ""}</span>
                    </div>
                    {group.average_rep_score > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="h-4 w-4" />
                        <span>Avg Reputation: {group.average_rep_score}</span>
                      </div>
                    )}
                    {group.organizer && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">Organized by {group.organizer.full_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mt-6 pt-4 border-t">
                    <p className="text-sm font-semibold">Group highlights:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs shadow-sm">
                        {group.type === "open" ? "Anyone can join" : "Membership required"}
                      </Badge>
                      {group.is_certified && (
                        <Badge variant="secondary" className="text-xs shadow-sm">
                          Verified community
                        </Badge>
                      )}
                      {group.member_count >= 5 && (
                        <Badge variant="secondary" className="text-xs shadow-sm">
                          Active community
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-auto pt-6">
                    <Button asChild className="flex-1">
                      <Link href={`/groups/${group.id}`}>
                        View Group
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

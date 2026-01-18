"use client"

import { Navbar } from "@/components/navbar"
import { LikeButton } from "@/components/like-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Users, CheckCircle2, Calendar, Clock, Shield } from "lucide-react"
import { BoxLoader } from "@/components/box-loader"
import { useMinLoading } from "@/hooks/use-min-loading"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"

type Space = {
  id: string
  name: string
  location: string
  description: string | null
  capacity: number
  owner_id: string
  requires_approval: boolean
  amenities: string[]
  availability: Record<string, any>
  min_reputation_tier: string
  is_premium: boolean
  owner?: {
    id: string
    full_name: string
    email: string
    location: string | null
  }
}

export default function SpaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [space, setSpace] = useState<Space | null>(null)
  const [loading, setLoading] = useState(true)
  const showLoader = useMinLoading(loading)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    fetchSpace()
    fetchLikes()
  }, [id])

  const fetchLikes = async () => {
    try {
      const response = await fetch(`/api/likes?space_id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked || false)
        setLikeCount(data.count || 0)
      }
    } catch (error) {
      console.error("Error fetching likes:", error)
    }
  }

  const fetchSpace = async () => {
    try {
      const response = await fetch(`/api/spaces/${id}`)
      const spaceData = await response.json()
      
      if (!response.ok) {
        throw new Error(spaceData.error?.message || "Failed to fetch space")
      }

      // Fetch owner info
      try {
        const ownerResponse = await fetch(`/api/profile/${spaceData.owner_id}`)
        if (ownerResponse.ok) {
          const owner = await ownerResponse.json()
          setSpace({ ...spaceData, owner: owner.user || null })
        } else {
          setSpace(spaceData)
        }
      } catch {
        setSpace(spaceData)
      }
    } catch (error) {
      console.error("Error fetching space:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookSpace = () => {
    router.push(`/spaces/${id}/book`)
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

  if (!space) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Space not found</p>
            <Button onClick={() => router.push("/spaces")}>Browse Spaces</Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8 space-y-6">
        <div className="aspect-[21/9] relative overflow-hidden rounded-lg bg-muted">
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <MapPin className="h-24 w-24" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {space.requires_approval && (
                      <Badge variant="outline">Approval Required</Badge>
                    )}
                    {space.min_reputation_tier !== "New" && (
                      <Badge className={reputationTierColors[space.min_reputation_tier] || ""}>
                        <Shield className="h-3 w-3 mr-1" />
                        {space.min_reputation_tier} Required
                      </Badge>
                    )}
                    {space.is_premium && (
                      <Badge variant="secondary">Premium</Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">{space.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{space.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Capacity: {space.capacity} people</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">About this space</h2>
              <p className="text-muted-foreground leading-relaxed">{space.description || "No description available"}</p>
            </div>

            {space.amenities && space.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {space.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {space.availability && Object.keys(space.availability).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Availability</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {space.availability.days && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Days: {Array.isArray(space.availability.days) ? space.availability.days.join(", ") : "All week"}
                          </span>
                        </div>
                      )}
                      {space.availability.hours && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Hours: {space.availability.hours}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Hosted by</h3>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{space.owner?.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{space.owner?.full_name}</p>
                      {space.owner?.location && (
                        <p className="text-sm text-muted-foreground">{space.owner.location}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={handleBookSpace}>
                  Book This Space
                </Button>

                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href={`/messages?user=${space.owner_id}`}>Contact Host</Link>
                </Button>

                <div className="flex justify-center mt-4">
                  <LikeButton spaceId={id} initialLiked={liked} initialCount={likeCount} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

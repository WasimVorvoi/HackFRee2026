"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Users, DollarSign, Search, CheckCircle2, Shield } from "lucide-react"
import { BoxLoader } from "@/components/box-loader"
import { useMinLoading } from "@/hooks/use-min-loading"
import Link from "next/link"
import { useState, useEffect } from "react"

type Space = {
  id: string
  name: string
  location: string
  description: string | null
  capacity: number
  owner_id: string
  requires_approval: boolean
  amenities: string[]
  min_reputation_tier: string
  is_premium: boolean
  owner?: {
    full_name: string
    email: string
  }
}

export default function SpacesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const showLoader = useMinLoading(loading)

  useEffect(() => {
    fetchSpaces()
  }, [])

  const fetchSpaces = async () => {
    try {
      const response = await fetch("/api/spaces")
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch spaces")
      }

      // Fetch owner information for each space
      const spacesWithOwners = await Promise.all(
        (data || []).map(async (space: any) => {
          try {
            const ownerResponse = await fetch(`/api/profile/${space.owner_id}`)
            if (ownerResponse.ok) {
              const owner = await ownerResponse.json()
              return { ...space, owner: owner.user || null }
            }
          } catch {
            // Ignore errors fetching owner
          }
          return space
        })
      )

      setSpaces(spacesWithOwners)
    } catch (error) {
      console.error("Error fetching spaces:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSpaces = spaces.filter(
    (space) =>
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCityFromLocation = (location: string) => {
    const parts = location.split(",")
    return parts[parts.length - 1]?.trim() || location
  }

  const reputationTierColors: Record<string, string> = {
    New: "bg-gray-100 text-gray-800",
    Trusted: "bg-blue-100 text-blue-800",
    Established: "bg-green-100 text-green-800",
    Advanced: "bg-purple-100 text-purple-800",
    Certified: "bg-amber-100 text-amber-800",
  }

  // Stock images based on space type/keywords
  const getSpaceImage = (space: Space): string => {
    const name = space.name.toLowerCase()
    const amenities = (space.amenities || []).join(" ").toLowerCase()
    const combined = `${name} ${amenities}`

    // Match keywords to relevant Unsplash images
    if (combined.includes("yoga") || combined.includes("wellness") || combined.includes("meditation") || combined.includes("mat")) {
      return "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&h=400&fit=crop"
    }
    if (combined.includes("kitchen") || combined.includes("cooking") || combined.includes("nutrition")) {
      return "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop"
    }
    if (combined.includes("music") || combined.includes("instrument") || combined.includes("amplifier") || combined.includes("soundproof")) {
      return "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop"
    }
    if (combined.includes("art") || combined.includes("gallery") || combined.includes("exhibition")) {
      return "https://images.unsplash.com/photo-1577720643272-265f09367456?w=600&h=400&fit=crop"
    }
    if (combined.includes("garden") || combined.includes("outdoor") || combined.includes("pavilion")) {
      return "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop"
    }
    if (combined.includes("maker") || combined.includes("3d printer") || combined.includes("workshop") || combined.includes("tools")) {
      return "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=400&fit=crop"
    }
    if (combined.includes("library") || combined.includes("study") || combined.includes("book")) {
      return "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&h=400&fit=crop"
    }
    if (combined.includes("conference") || combined.includes("meeting") || combined.includes("video conferencing")) {
      return "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop"
    }
    if (combined.includes("innovation") || combined.includes("vr") || combined.includes("tech") || combined.includes("prototype")) {
      return "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&h=400&fit=crop"
    }
    if (combined.includes("community") || combined.includes("hall") || combined.includes("center")) {
      return "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop"
    }
    // Default fallback
    return "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=400&fit=crop"
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 md:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Browse Spaces</h1>
          <p className="text-muted-foreground max-w-2xl">Find the perfect venue for your community project or event</p>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filteredSpaces.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No spaces found</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpaces.map((space) => (
              <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <img
                    src={getSpaceImage(space)}
                    alt={space.name}
                    className="w-full h-full object-cover"
                  />
                  {space.min_reputation_tier !== "New" && (
                    <div className="absolute top-2 right-2 bg-background/90 rounded-full p-1.5">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {space.requires_approval && (
                          <Badge variant="outline" className="text-xs">
                            Approval Required
                          </Badge>
                        )}
                        {space.min_reputation_tier !== "New" && (
                          <Badge className={`text-xs ${reputationTierColors[space.min_reputation_tier] || ""}`}>
                            {space.min_reputation_tier}
                          </Badge>
                        )}
                        {space.is_premium && (
                          <Badge variant="secondary" className="text-xs">
                            Premium
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg leading-tight mb-1">{space.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {getCityFromLocation(space.location)}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-3 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{space.description || "No description"}</p>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Up to {space.capacity} people
                    </div>
                  </div>

                  {space.amenities && space.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {space.amenities.slice(0, 3).map((amenity) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {space.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{space.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t">
                  <Button asChild className="w-full">
                    <Link href={`/spaces/${space.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

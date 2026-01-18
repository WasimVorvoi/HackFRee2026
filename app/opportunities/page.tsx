"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Users, Calendar, Search, Shield, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { BoxLoader } from "@/components/box-loader"
import { useMinLoading } from "@/hooks/use-min-loading"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Opportunity = {
  id: string
  title: string
  description: string
  organizer_id: string
  group_id: string | null
  tags: string[]
  time_slot: Record<string, any>
  status: string
  required_rep_tier: string
  max_participants: number
  current_participants: number
  organizer?: {
    id: string
    full_name: string
    email: string
    location: string | null
  }
  group?: {
    id: string
    name: string
    is_certified: boolean
  }
}

export default function OpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const showLoader = useMinLoading(loading)

  // Filter states
  const [filterTiers, setFilterTiers] = useState<string[]>([])
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [showGroupOnly, setShowGroupOnly] = useState(false)
  const [showCertifiedOnly, setShowCertifiedOnly] = useState(false)

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    try {
      const response = await fetch("/api/opportunities")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch opportunities")
      }

      const openOpps = (data || []).filter((opp: any) => opp.status === "open")

      const opportunitiesWithDetails = await Promise.all(
        openOpps.map(async (opp: any) => {
          try {
            const organizerResponse = await fetch(`/api/profile/${opp.organizer_id}`)
            const organizer = organizerResponse.ok ? await organizerResponse.json() : null

            let group = null
            if (opp.group_id) {
              const groupResponse = await fetch(`/api/groups/${opp.group_id}`)
              if (groupResponse.ok) {
                group = await groupResponse.json()
              }
            }

            return {
              ...opp,
              organizer: organizer?.user || null,
              group: group || null,
            }
          } catch {
            return opp
          }
        })
      )

      setOpportunities(opportunitiesWithDetails)
    } catch (error) {
      console.error("Error fetching opportunities:", error)
    } finally {
      setLoading(false)
    }
  }

  // Get all unique tags from opportunities
  const allTags = [...new Set(opportunities.flatMap((opp) => opp.tags))]
  const allTiers = ["New", "Trusted", "Established", "Advanced", "Certified"]

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    // Search filter
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    // Tier filter
    const matchesTier = filterTiers.length === 0 || filterTiers.includes(opp.required_rep_tier)

    // Tag filter
    const matchesTags = filterTags.length === 0 || opp.tags.some((tag) => filterTags.includes(tag))

    // Group filter
    const matchesGroup = !showGroupOnly || opp.group_id !== null

    // Certified filter
    const matchesCertified = !showCertifiedOnly || opp.group?.is_certified === true

    return matchesSearch && matchesTier && matchesTags && matchesGroup && matchesCertified
  })

  // Reset current index when filters change
  useEffect(() => {
    setCurrentIndex(0)
  }, [searchQuery, filterTiers, filterTags, showGroupOnly, showCertifiedOnly])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? filteredOpportunities.length - 1 : prev - 1))
  }, [filteredOpportunities.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === filteredOpportunities.length - 1 ? 0 : prev + 1))
  }, [filteredOpportunities.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious()
      if (e.key === "ArrowRight") goToNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goToPrevious, goToNext])

  const reputationTierColors: Record<string, string> = {
    New: "bg-gray-100 text-gray-800",
    Trusted: "bg-blue-100 text-blue-800",
    Established: "bg-green-100 text-green-800",
    Advanced: "bg-purple-100 text-purple-800",
    Certified: "bg-amber-100 text-amber-800",
  }

  const formatTimeSlot = (timeSlot: Record<string, any>) => {
    if (timeSlot.date && timeSlot.start && timeSlot.end) {
      return `${timeSlot.day || ""} ${timeSlot.start}-${timeSlot.end}`.trim()
    }
    return "TBD"
  }

  const getCardStyle = (index: number) => {
    const diff = index - currentIndex
    const total = filteredOpportunities.length

    // Handle wrapping for infinite carousel feel
    let adjustedDiff = diff
    if (diff > total / 2) adjustedDiff = diff - total
    if (diff < -total / 2) adjustedDiff = diff + total

    const absD = Math.abs(adjustedDiff)
    const isCenter = adjustedDiff === 0
    const isAdjacent = absD === 1
    const isVisible = absD <= 2

    if (!isVisible) {
      return {
        transform: "translateX(0) translateZ(-500px) translateY(-100px) scale(0.5)",
        opacity: 0,
        zIndex: 0,
        pointerEvents: "none" as const,
      }
    }

    const translateX = adjustedDiff * 320
    const translateZ = isCenter ? 100 : isAdjacent ? -80 : -200
    // Front card is lower (positive Y), back cards go upward (negative Y)
    const translateY = isCenter ? 30 : isAdjacent ? -50 : -120
    const opacity = isCenter ? 1 : isAdjacent ? 0.7 : 0.4
    const scale = isCenter ? 1 : isAdjacent ? 0.85 : 0.7
    const zIndex = isCenter ? 30 : isAdjacent ? 20 : 10

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) translateY(${translateY}px) scale(${scale})`,
      opacity,
      zIndex,
      pointerEvents: isCenter ? ("auto" as const) : ("none" as const),
    }
  }

  const activeFiltersCount =
    filterTiers.length + filterTags.length + (showGroupOnly ? 1 : 0) + (showCertifiedOnly ? 1 : 0)

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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Header with search and filters */}
        <div className="container px-4 md:px-6 lg:px-8 py-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Browse Opportunities</h1>
              <p className="text-muted-foreground">Discover community projects and initiatives</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48 md:w-64"
                />
              </div>

              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by Tier</DropdownMenuLabel>
                  {allTiers.map((tier) => (
                    <DropdownMenuCheckboxItem
                      key={tier}
                      checked={filterTiers.includes(tier)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilterTiers([...filterTiers, tier])
                        } else {
                          setFilterTiers(filterTiers.filter((t) => t !== tier))
                        }
                      }}
                    >
                      {tier}
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
                  {allTags.slice(0, 8).map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={filterTags.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilterTags([...filterTags, tag])
                        } else {
                          setFilterTags(filterTags.filter((t) => t !== tag))
                        }
                      }}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Other Filters</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem checked={showGroupOnly} onCheckedChange={setShowGroupOnly}>
                    Group-hosted only
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showCertifiedOnly} onCheckedChange={setShowCertifiedOnly}>
                    Certified groups only
                  </DropdownMenuCheckboxItem>

                  {activeFiltersCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => {
                          setFilterTiers([])
                          setFilterTags([])
                          setShowGroupOnly(false)
                          setShowCertifiedOnly(false)
                        }}
                      >
                        Clear all filters
                      </Button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 3D Carousel - Centered Vertically */}
        <div className="flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-b from-transparent via-muted/20 to-muted/40">
          {filteredOpportunities.length === 0 ? (
            <Card className="p-12 text-center border-2">
              <p className="text-muted-foreground text-lg">No opportunities found</p>
              {activeFiltersCount > 0 && (
                <Button
                  variant="link"
                  onClick={() => {
                    setFilterTiers([])
                    setFilterTags([])
                    setShowGroupOnly(false)
                    setShowCertifiedOnly(false)
                    setSearchQuery("")
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </Card>
          ) : (
            <div className="relative w-full max-w-6xl mx-auto px-4">
              {/* Navigation Buttons */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-14 w-14 rounded-full bg-background/90 backdrop-blur-md shadow-xl hover:bg-background hover:scale-110 transition-all border-2"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-7 w-7" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-14 w-14 rounded-full bg-background/90 backdrop-blur-md shadow-xl hover:bg-background hover:scale-110 transition-all border-2"
                onClick={goToNext}
              >
                <ChevronRight className="h-7 w-7" />
              </Button>

              {/* 3D Carousel Container */}
              <div
                className="relative h-[520px] flex items-center justify-center mb-8"
                style={{ perspective: "1500px", perspectiveOrigin: "center 50%" }}
              >
                <div
                  className="relative w-full h-full flex items-center justify-center"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {filteredOpportunities.map((opportunity, index) => {
                    const style = getCardStyle(index)
                    return (
                      <div
                        key={opportunity.id}
                        className="absolute transition-all duration-500 ease-out"
                        style={{
                          ...style,
                          transformStyle: "preserve-3d",
                          width: "380px",
                        }}
                      >
                        <Card className="overflow-hidden border-2 border-border hover:border-primary/50 transition-all shadow-2xl bg-card h-[450px] flex flex-col rounded-3xl">
                          <CardHeader className="pb-3 pt-8">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                  {opportunity.tags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {opportunity.group?.is_certified && (
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                      Certified
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="font-bold text-xl leading-tight mb-3">{opportunity.title}</h3>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-sm">
                                      {opportunity.organizer?.full_name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-muted-foreground truncate">
                                    {opportunity.organizer?.full_name || "Unknown"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pb-3 space-y-4 flex-1">
                            <p className="text-sm text-muted-foreground line-clamp-3">{opportunity.description}</p>

                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatTimeSlot(opportunity.time_slot)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {opportunity.current_participants}/{opportunity.max_participants}
                              </div>
                              {opportunity.organizer?.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {opportunity.organizer.location.split(",")[0]}
                                </div>
                              )}
                            </div>

                            {opportunity.required_rep_tier !== "New" && (
                              <Badge
                                className={`text-xs ${reputationTierColors[opportunity.required_rep_tier] || ""}`}
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Requires {opportunity.required_rep_tier}
                              </Badge>
                            )}
                          </CardContent>

                          <CardFooter className="pt-3 pb-6 border-t mt-auto">
                            <Button asChild className="w-full" size="lg">
                              <Link href={`/opportunities/${opportunity.id}`}>View Details</Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Dots indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {filteredOpportunities.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-3 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "bg-primary w-8 shadow-md"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-3"
                    }`}
                  />
                ))}
              </div>

              {/* Counter */}
              <div className="text-center mt-4 text-sm text-muted-foreground">
                {currentIndex + 1} of {filteredOpportunities.length} opportunities
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

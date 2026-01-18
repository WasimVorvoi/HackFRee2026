"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { Calendar, MapPin, Users, Sparkles, ArrowRight, CheckCircle2, Globe, Heart, Shield } from "lucide-react"
import { BoxLoader } from "@/components/box-loader"
import { useMinLoading } from "@/hooks/use-min-loading"
import Link from "next/link"
import { useEffect, useState } from "react"

type Match = {
  id: string
  type: "opportunity" | "space"
  item: any
  score: number
  reasons: string[]
}

type FilterType = "all" | "me" | "group" | "certified"

export default function HomePage() {
  const { user, isLoggedIn, isLoading } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const showAuthLoader = useMinLoading(isLoading)
  const showMatchesLoader = useMinLoading(loadingMatches)

  useEffect(() => {
    if (user && isLoggedIn) {
      fetchMatches()
    }
  }, [user, isLoggedIn])

  const fetchMatches = async () => {
    if (!user) return

    setLoadingMatches(true)
    try {
      const response = await fetch("/api/matches")
      const data = await response.json()
      if (data.matches) {
        setMatches(data.matches.slice(0, 6))
      }
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoadingMatches(false)
    }
  }

  if (showAuthLoader) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <BoxLoader />
        </main>
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <Navbar />
        
        {/* Animated Bubbles */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="bubble">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="bubble">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="bubble">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="bubble">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="bubble">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <section className="border-b bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-20 md:py-32">
            <div className="flex flex-col items-center text-center space-y-10">
              <Badge variant="secondary" className="text-sm px-5 py-2 shadow-sm">
                Community Activation Platform
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-5xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Turn Ideas Into Reality with Community & Space
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
                Communify connects passionate people with spaces and opportunities to create meaningful projects
                together
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button size="lg" asChild className="text-lg px-8 h-14 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-lg px-8 h-14 bg-background hover:bg-accent transition-colors"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32">
          <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
            <div className="text-center space-y-5 mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How Communify Works</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Three simple steps to activate your community project
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 justify-items-center">
              <div className="feature-card">
                <h1>Find Your Match</h1>
                <p>
                  Get personalized recommendations for opportunities and collaborators based on your skills and interests
                </p>
              </div>

              <div className="feature-card">
                <h1>Book a Space</h1>
                <p>
                  Reserve verified community spaces for your projects with our secure booking system
                </p>
              </div>

              <div className="feature-card">
                <h1>Make It Happen</h1>
                <p>
                  Collaborate with your team, track progress, and bring your community project to life
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Built for Community Organizers</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Whether you're teaching coding to youth, organizing urban gardens, or hosting art workshops, Communify
                  gives you the tools to succeed
                </p>

                <div className="space-y-6">
                  {[
                    {
                      title: "Smart Matching Algorithm",
                      desc: "Connect with the right people and spaces automatically",
                    },
                    {
                      title: "Verified Spaces & Users",
                      desc: "Trust and safety built into every interaction",
                    },
                    {
                      title: "Reputation System",
                      desc: "Build credibility as you complete projects",
                    },
                    {
                      title: "Free & Affordable Options",
                      desc: "Many spaces available at no cost to support community work",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: "500+", label: "Active Projects" },
                  { value: "10k+", label: "Community Members" },
                  { value: "200+", label: "Verified Spaces" },
                  { value: "50+", label: "Cities Nationwide" },
                ].map((stat, idx) => (
                  <Card key={idx} className="p-8 text-center space-y-3 hover:shadow-lg transition-shadow bg-card">
                    <div className="text-5xl font-bold text-primary">{stat.value}</div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32">
          <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
            <Card className="border-0 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground shadow-2xl">
              <CardHeader className="text-center space-y-8 py-16">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-primary-foreground/10 flex items-center justify-center backdrop-blur-sm">
                    <Heart className="h-10 w-10" />
                  </div>
                </div>
                <div className="space-y-5">
                  <CardTitle className="text-4xl md:text-5xl font-bold tracking-tight">
                    Ready to Activate Your Community?
                  </CardTitle>
                  <CardDescription className="text-xl text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed">
                    Join thousands of organizers turning ideas into real-world projects
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  <Button
                    size="lg"
                    variant="secondary"
                    asChild
                    className="text-lg px-8 h-14 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Link href="/signup">
                      Create Free Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="text-lg px-8 h-14 bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                  >
                    <Link href="/spaces">
                      <Globe className="mr-2 h-5 w-5" />
                      Explore Spaces
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      
      {/* Animated Bubbles */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="bubble">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="bubble">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="bubble">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="bubble">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="bubble">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl py-10 space-y-10 px-4 md:px-6 lg:px-8">
        <section className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <h1 className="text-5xl font-bold tracking-tight">Welcome back, {user.full_name.split(" ")[0]}</h1>
              <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
                Your personalized matches based on skills, interests, and availability
              </p>
            </div>
            <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-all">
              <Link href="/create">
                <Sparkles className="mr-2 h-5 w-5" />
                Create
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm py-2 px-4 shadow-sm">
              {user.reputation_score} Rep
            </Badge>
            <Badge className={`text-sm py-2 px-4 shadow-sm ${reputationTierColors[user.reputation_tier] || ""}`}>
              {user.reputation_tier}
            </Badge>
            {user.is_verified && (
              <Badge variant="outline" className="text-sm py-2 px-4 shadow-sm">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold tracking-tight">Your Matches</h2>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="shadow-sm hover:shadow-md transition-all bg-transparent"
              >
                <Link href="/opportunities">All Opportunities</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="shadow-sm hover:shadow-md transition-all bg-transparent"
              >
                <Link href="/spaces">All Spaces</Link>
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all" as FilterType, label: "All" },
              { key: "me" as FilterType, label: "For Me" },
              { key: "group" as FilterType, label: "Group-hosted" },
              { key: "certified" as FilterType, label: "Certified-only" },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.key)}
                className={activeFilter === filter.key ? "" : "bg-transparent"}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {showMatchesLoader ? (
            <BoxLoader />
          ) : matches.length === 0 ? (
            <Card className="p-16 text-center border-2 border-dashed card-template">
              <div className="flex flex-col items-center gap-6">
                <Sparkles className="h-16 w-16 text-muted-foreground" />
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">No matches yet</h3>
                  <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                    Update your profile with skills and interests to see personalized matches
                  </p>
                </div>
                <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-all">
                  <Link href="/profile">Update Profile</Link>
                </Button>
              </div>
            </Card>
          ) : matches.filter((match) => {
              if (activeFilter === "all") return true
              if (activeFilter === "me") return true
              if (activeFilter === "group") return match.type === "opportunity" && match.item.group_id
              if (activeFilter === "certified") return match.type === "opportunity" && match.item.required_rep_tier === "Certified"
              return true
            }).length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <div className="flex flex-col items-center gap-4">
                <Sparkles className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No matches for this filter</h3>
                  <p className="text-muted-foreground max-w-md">
                    Try selecting a different filter or check back later for new opportunities.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setActiveFilter("all")} className="bg-transparent">
                  Show All Matches
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {matches
                .filter((match) => {
                  if (activeFilter === "all") return true
                  if (activeFilter === "me") return true // Already personalized
                  if (activeFilter === "group") {
                    return match.type === "opportunity" && match.item.group_id
                  }
                  if (activeFilter === "certified") {
                    return (
                      match.type === "opportunity" &&
                      match.item.required_rep_tier === "Certified"
                    )
                  }
                  return true
                })
                .map((match) => {
                const isOpportunity = match.type === "opportunity"
                const item = match.item

                return (
                  <Card
                    key={`${match.type}-${match.id}`}
                    className="flex flex-col bg-card border shadow-sm rounded-2xl overflow-hidden"
                  >
                    <CardHeader className="space-y-4 px-6 pt-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <Badge variant={isOpportunity ? "default" : "secondary"} className="shadow-sm">
                            {isOpportunity ? "Opportunity" : "Space"}
                          </Badge>
                          <CardTitle className="text-xl leading-tight">
                            {item.title || item.name}
                          </CardTitle>
                        </div>
                        <Badge variant="outline" className="shrink-0 shadow-sm">
                          {match.score}% match
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-5 px-6 pb-6">
                      <div className="space-y-3 text-sm">
                        {item.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{item.location.split(",")[0]}</span>
                          </div>
                        )}
                        {isOpportunity && item.time_slot && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatTimeSlot(item.time_slot)}</span>
                          </div>
                        )}
                        {item.capacity && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Capacity: {item.capacity}</span>
                          </div>
                        )}
                        {isOpportunity && item.max_participants && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              {item.current_participants}/{item.max_participants} joined
                            </span>
                          </div>
                        )}
                        {isOpportunity && item.required_rep_tier !== "New" && (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-amber-600" />
                            <Badge className={`text-xs ${reputationTierColors[item.required_rep_tier] || ""}`}>
                              Requires {item.required_rep_tier}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 mt-6 pt-4 border-t">
                        <p className="text-sm font-semibold">Why this matches:</p>
                        <div className="flex flex-wrap gap-2">
                          {match.reasons.slice(0, 3).map((reason, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs shadow-sm">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-auto pt-6">
                        <Button asChild className="flex-1">
                          <Link href={`/${isOpportunity ? "opportunities" : "spaces"}/${match.id}`}>
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

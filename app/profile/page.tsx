"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { Star, MapPin, Mail, CheckCircle2, Edit, Shield, Plus, GraduationCap, Trash2 } from "lucide-react"
import { BoxLoader } from "@/components/box-loader"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CredentialBadge, Credential } from "@/components/credential-badge"
import { CredentialModal } from "@/components/credential-modal"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, emailVerified } = useAuth()
  const router = useRouter()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [credentialModalOpen, setCredentialModalOpen] = useState(false)
  const [loadingCredentials, setLoadingCredentials] = useState(true)

  const fetchCredentials = async () => {
    try {
      const response = await fetch("/api/credentials")
      if (response.ok) {
        const data = await response.json()
        setCredentials(data.credentials || [])
      }
    } catch (error) {
      console.error("Failed to fetch credentials:", error)
    } finally {
      setLoadingCredentials(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchCredentials()
    }
  }, [user])

  const handleDeleteCredential = async (credentialId: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) return

    try {
      const response = await fetch(`/api/credentials?id=${credentialId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Credential deleted")
        fetchCredentials()
      } else {
        const data = await response.json()
        toast.error(data.error?.message || "Failed to delete credential")
      }
    } catch (error) {
      toast.error("Failed to delete credential")
    }
  }

  const handleVerifyCredential = async (credentialId: string) => {
    try {
      const response = await fetch("/api/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential_id: credentialId, action: "verify" }),
      })

      if (response.ok) {
        toast.success("Credential verified! Reputation boost applied.")
        fetchCredentials()
        // Refresh the page to update user data
        window.location.reload()
      } else {
        const data = await response.json()
        toast.error(data.error?.message || "Failed to verify credential")
      }
    } catch (error) {
      toast.error("Failed to verify credential")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to view your profile</p>
            <Button asChild className="mt-4">
              <Link href="/login">Log In</Link>
            </Button>
          </Card>
        </main>
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 md:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl">{user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">{user.full_name}</h1>
                      {emailVerified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    {user.location && (
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      <span className="font-semibold">{user.reputation_score}</span>
                      <span className="text-sm text-muted-foreground">reputation</span>
                    </div>

                    <Badge className={reputationTierColors[user.reputation_tier] || "bg-gray-100 text-gray-800"}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.reputation_tier}
                    </Badge>

                    {user.is_verified && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified Account
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{user.completed_opportunities} opportunities completed</span>
                    {user.no_shows > 0 && <span>• {user.no_shows} no-shows</span>}
                  </div>

                  <Button size="sm" variant="outline" asChild>
                    <Link href="/settings">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interests</CardTitle>
              </CardHeader>
              <CardContent>
                {user.interests && user.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No interests added yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Availability</CardTitle>
              </CardHeader>
              <CardContent>
                {user.availability && Object.keys(user.availability).length > 0 ? (
                  <div className="space-y-1 text-sm">
                    {Object.entries(user.availability).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No availability set</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reputation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reputation Score</span>
                <span className="font-semibold">{user.reputation_score}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tier</span>
                <Badge className={reputationTierColors[user.reputation_tier] || "bg-gray-100 text-gray-800"}>
                  {user.reputation_tier}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed Opportunities</span>
                <span className="font-semibold">{user.completed_opportunities}</span>
              </div>
            </CardContent>
          </Card>

          {/* Credentials Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Credentials & Certifications
              </CardTitle>
              <Button size="sm" onClick={() => setCredentialModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {loadingCredentials ? (
                <p className="text-sm text-muted-foreground">Loading credentials...</p>
              ) : credentials.length === 0 ? (
                <div className="text-center py-6">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No credentials added yet. Add your degrees, certifications, or licenses to boost your reputation.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setCredentialModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Your First Credential
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {credentials.map((credential) => (
                    <div
                      key={credential.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1">
                        <CredentialBadge credential={credential} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {credential.institution}
                          {credential.year_obtained && ` (${credential.year_obtained})`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {credential.verification_status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyCredential(credential.id)}
                            className="text-xs"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verify (Demo)
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCredential(credential.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    Verified credentials provide reputation boosts: Degrees +15, Certifications +10, Licenses +12
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <CredentialModal
          open={credentialModalOpen}
          onOpenChange={setCredentialModalOpen}
          onSuccess={fetchCredentials}
        />
      </main>
    </div>
  )
}

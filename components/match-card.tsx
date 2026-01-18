import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Users, Calendar, Sparkles } from "lucide-react"
import Link from "next/link"
import type { Match } from "@/lib/matching-algorithm"

interface MatchCardProps {
  match: Match
}

export function MatchCard({ match }: MatchCardProps) {
  const isOpportunity = match.type === "opportunity"
  const item = match.item

  if (isOpportunity) {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {item.tags?.slice(0, 2).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                  <Sparkles className="h-3 w-3" />
                  {match.score}% match
                </div>
              </div>
              <h3 className="font-semibold text-lg leading-tight mb-2">{item.title}</h3>
              {item.organizer && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{item.organizer.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground truncate">{item.organizer.full_name}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3 space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {item.time_slot && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {item.time_slot.day || "TBD"}
              </div>
            )}
            {item.max_participants && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {item.current_participants || 0}/{item.max_participants} joined
              </div>
            )}
            {item.organizer?.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {item.organizer.location.split(",")[0]}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium">Why this matches you:</p>
            <ul className="space-y-0.5">
              {match.reasons.slice(0, 2).map((reason, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t">
          <Button asChild className="w-full">
            <Link href={`/opportunities/${item.id}`}>View Details</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden bg-muted">
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <MapPin className="h-12 w-12" />
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                <Sparkles className="h-3 w-3" />
                {match.score}% match
              </div>
            </div>
            <h3 className="font-semibold text-lg leading-tight mb-1">{item.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {item.location?.split(",")[0] || item.location}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{item.description || "No description"}</p>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {item.capacity && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Up to {item.capacity} people
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium">Why this matches you:</p>
          <ul className="space-y-0.5">
            {match.reasons.slice(0, 2).map((reason, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <Button asChild className="w-full">
          <Link href={`/spaces/${item.id}`}>View Space</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

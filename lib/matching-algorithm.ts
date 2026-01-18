import { getAllOpportunities, getAllSpaces, getAllProfiles } from "./db-helpers"

// Mark this module as server-only
if (typeof window !== "undefined") {
  throw new Error("Matching algorithm can only be used server-side")
}

export interface Match {
  id: string
  type: "opportunity" | "space"
  item: any
  score: number
  reasons: string[]
}

type Profile = {
  id: string
  location: string | null
  interests: string[]
  availability: Record<string, any>
  reputation_tier: string
  reputation_score: number
}

type Opportunity = {
  id: string
  title: string
  description: string
  tags: string[]
  time_slot: Record<string, any>
  organizer_id: string
  required_rep_tier: string
  max_participants: number
  current_participants: number
  organizer?: {
    location: string | null
    reputation_tier: string
    is_verified: boolean
  }
}

type Space = {
  id: string
  name: string
  location: string
  min_reputation_tier: string
}

// Calculate distance between two locations (simplified - same city = 0, different = 1)
function calculateDistance(loc1: string | null, loc2: string | null): number {
  if (!loc1 || !loc2) return 0.5 // Unknown distance

  const city1 = loc1.split(",")[0]?.trim().toLowerCase()
  const city2 = loc2.split(",")[0]?.trim().toLowerCase()

  if (city1 === city2) return 0
  return 1
}

// Check time overlap between user availability and opportunity time slot
function checkTimeOverlap(userAvailability: Record<string, any>, timeSlot: Record<string, any>): number {
  // Simplified: if user has availability set, give partial credit
  // In production, would do more sophisticated time matching
  if (!userAvailability || Object.keys(userAvailability).length === 0) return 0.5
  if (!timeSlot || !timeSlot.day) return 0.5

  // Basic check: if user availability includes the day
  const userDays = userAvailability.days || []
  const oppDay = timeSlot.day?.toLowerCase()

  if (Array.isArray(userDays) && userDays.some((d: string) => d.toLowerCase().includes(oppDay))) {
    return 1.0
  }

  return 0.3 // Partial match
}

// Calculate match score between user and opportunity
export function calculateOpportunityMatch(user: Profile, opportunity: Opportunity): Match {
  let score = 0
  const reasons: string[] = []

  // 35% Tag Match (tags vs user interests) - reduced from 40% to make room for reputation
  const tagMatches = user.interests.filter((interest) =>
    opportunity.tags.some(
      (tag) =>
        interest.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(interest.toLowerCase())
    )
  )

  if (tagMatches.length > 0) {
    const tagScore = Math.min(35, (tagMatches.length / Math.max(opportunity.tags.length, 1)) * 35)
    score += tagScore
    reasons.push(`${tagMatches.length} tag match${tagMatches.length > 1 ? "es" : ""}: ${tagMatches.slice(0, 2).join(", ")}`)
  } else if (opportunity.tags.length === 0) {
    score += 17 // No tags = open to all
    reasons.push("Open to all interests")
  }

  // 25% Time Overlap - reduced from 30%
  const timeOverlap = checkTimeOverlap(user.availability, opportunity.time_slot)
  const timeScore = timeOverlap * 25
  score += timeScore
  if (timeOverlap > 0.7) {
    reasons.push(`Matches your availability (${opportunity.time_slot.day || "scheduled time"})`)
  }

  // 15% Distance - unchanged
  const distance = calculateDistance(user.location, opportunity.organizer?.location || null)
  const distanceScore = (1 - distance) * 15
  score += distanceScore
  if (distance === 0) {
    reasons.push(`Same city as organizer`)
  } else if (distance < 0.5) {
    reasons.push("Nearby location")
  }

  // 20% Reputation/Verification - increased from 10% to prioritize reliable organizers
  const tierOrder = ["New", "Trusted", "Established", "Advanced", "Certified"]
  const organizerTierIndex = tierOrder.indexOf(opportunity.organizer?.reputation_tier || "New")

  // Base reputation score: up to 12 points based on tier (0, 3, 6, 9, 12)
  const tierScore = organizerTierIndex * 3
  score += tierScore

  // Verification bonus: +5 points for verified organizers
  if (opportunity.organizer?.is_verified) {
    score += 5
    reasons.push("Verified organizer")
  }

  // High reputation bonus: +3 points for Established+, displayed prominently
  if (organizerTierIndex >= 2) {
    score += 3
    reasons.push(`${opportunity.organizer?.reputation_tier} organizer`)
  }

  // 5% Momentum (current_participants / max_participants)
  const momentum = opportunity.current_participants / Math.max(opportunity.max_participants, 1)
  const momentumScore = momentum * 5
  score += momentumScore
  if (momentum > 0.5) {
    reasons.push(`${opportunity.current_participants} people already joined`)
  }

  // Ensure we have at least one reason
  if (reasons.length === 0) {
    reasons.push("Active community project")
  }

  return {
    id: opportunity.id,
    type: "opportunity",
    item: opportunity,
    score: Math.round(score),
    reasons: reasons.slice(0, 3), // Top 3 reasons
  }
}

// Calculate match score between user and space
export function calculateSpaceMatch(user: Profile, space: Space): Match {
  let score = 0
  const reasons: string[] = []

  // 40% Tag Match (space name/description keywords vs interests)
  const spaceKeywords = [
    ...space.name.toLowerCase().split(" "),
    ...space.location.toLowerCase().split(" "),
  ]

  const tagMatches = user.interests.filter((interest) =>
    spaceKeywords.some((keyword) => interest.toLowerCase().includes(keyword) || keyword.includes(interest.toLowerCase()))
  )

  if (tagMatches.length > 0) {
    score += 40
    reasons.push(`Matches your interests: ${tagMatches[0]}`)
  } else {
    score += 15
  }

  // 30% Time Overlap (simplified - assume spaces are generally available)
  score += 20 // Base availability score
  reasons.push("Available for booking")

  // 15% Distance
  const distance = calculateDistance(user.location, space.location)
  const distanceScore = (1 - distance) * 15
  score += distanceScore
  if (distance === 0) {
    reasons.push(`In your city`)
  }

  // 10% Reputation (space tier requirement)
  const tierOrder = ["New", "Trusted", "Established", "Advanced", "Certified"]
  const userTierIndex = tierOrder.indexOf(user.reputation_tier)
  const spaceTierIndex = tierOrder.indexOf(space.min_reputation_tier)

  if (userTierIndex >= spaceTierIndex) {
    score += 10
    reasons.push("Meets reputation requirements")
  }

  // 5% Momentum (simplified - assume spaces are in demand)
  score += 3
  reasons.push("Popular space")

  return {
    id: space.id,
    type: "space",
    item: space,
    score: Math.round(score),
    reasons: reasons.slice(0, 3),
  }
}

// Get personalized matches for a user from local database
export async function getPersonalizedMatches(user: Profile): Promise<Match[]> {
  try {
    // Fetch opportunities
    const opportunities = getAllOpportunities().filter((opp) => opp.status === "open")
    
    // Fetch spaces
    const spaces = getAllSpaces()
    
    // Fetch profiles for organizer info
    const profiles = getAllProfiles()
    const profilesMap = new Map(profiles.map((p) => [p.id, p]))

    const matches: Match[] = []

    // Calculate matches for opportunities
    for (const opp of opportunities) {
      const organizer = profilesMap.get(opp.organizer_id)
      const match = calculateOpportunityMatch(user, {
        ...opp,
        organizer: organizer ? {
          location: organizer.location,
          reputation_tier: organizer.reputation_tier,
          is_verified: organizer.is_verified,
        } : null,
      } as Opportunity)
      matches.push(match)
    }

    // Calculate matches for spaces
    for (const space of spaces) {
      const match = calculateSpaceMatch(user, space as Space)
      matches.push(match)
    }

    // Sort by score (highest first) and return
    return matches.sort((a, b) => b.score - a.score).slice(0, 20)
  } catch (error) {
    console.error("Error in getPersonalizedMatches:", error)
    return []
  }
}

import { getDb } from "./db"
import { getProfileById } from "./db-helpers"
import { randomUUID } from "crypto"

// Mark this module as server-only
if (typeof window !== "undefined") {
  throw new Error("Reputation module can only be used server-side")
}

const REPUTATION_TIERS = {
  New: { min: 0, max: 24 },
  Trusted: { min: 25, max: 49 },
  Established: { min: 50, max: 99 },
  Advanced: { min: 100, max: 149 },
  Certified: { min: 150, max: Infinity },
}

export function calculateReputationTier(score: number): "New" | "Trusted" | "Established" | "Advanced" | "Certified" {
  if (score >= REPUTATION_TIERS.Certified.min) return "Certified"
  if (score >= REPUTATION_TIERS.Advanced.min) return "Advanced"
  if (score >= REPUTATION_TIERS.Established.min) return "Established"
  if (score >= REPUTATION_TIERS.Trusted.min) return "Trusted"
  return "New"
}

export async function updateReputation(
  userId: string,
  change: number,
  reason: "host" | "attend" | "no_show" | "feedback"
) {
  try {
    const db = getDb()
    
    // Get current profile
    const profile = getProfileById(userId)
    if (!profile) {
      throw new Error("Profile not found")
    }

    // Calculate new score
    let newScore = profile.reputation_score + change
    let completedOpps = profile.completed_opportunities
    let noShows = profile.no_shows

    // Update related fields
    if (reason === "host") {
      completedOpps += 1
    } else if (reason === "attend") {
      completedOpps += 1
    } else if (reason === "no_show") {
      noShows += 1
    }

    // Ensure score doesn't go below 0
    newScore = Math.max(0, newScore)

    // Calculate new tier
    const newTier = calculateReputationTier(newScore)

    // Update profile
    const stmt = db.prepare(`
      UPDATE profiles 
      SET reputation_score = ?,
          reputation_tier = ?,
          completed_opportunities = ?,
          no_shows = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    stmt.run(newScore, newTier, completedOpps, noShows, userId)

    return { newScore, newTier }
  } catch (error) {
    console.error("Error updating reputation:", error)
    throw error
  }
}

export async function checkCertificationEligibility(userId: string): Promise<boolean> {
  try {
    const profile = getProfileById(userId)
    if (!profile) return false

    // Requirements for Certified:
    // - Advanced+ rep tier (score >= 100)
    // - At least 10 completed opportunities
    // - No more than 2 no-shows
    return (
      profile.reputation_score >= 100 &&
      profile.reputation_tier === "Advanced" &&
      profile.completed_opportunities >= 10 &&
      profile.no_shows <= 2
    )
  } catch (error) {
    console.error("Error checking certification:", error)
    return false
  }
}

export async function updateGroupReputation(groupId: string) {
  try {
    const db = getDb()
    
    // Get all group members
    const members = db.prepare(`
      SELECT gm.user_id, p.reputation_score
      FROM group_members gm
      JOIN profiles p ON gm.user_id = p.id
      WHERE gm.group_id = ?
    `).all(groupId) as any[]

    if (!members || members.length === 0) return

    // Calculate average reputation
    const totalRep = members.reduce((sum, m) => sum + (m.reputation_score || 0), 0)
    const avgRep = Math.round(totalRep / members.length)

    // Update group
    const updateStmt = db.prepare(`
      UPDATE groups 
      SET average_rep_score = ?,
          member_count = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(avgRep, members.length, groupId)

    // Check if group should be certified
    const certifiedCount = members.filter(
      (m) => m.reputation_score >= 100 || m.reputation_score >= 50
    ).length

    const shouldBeCertified = avgRep >= 100 && certifiedCount >= Math.ceil(members.length / 2)

    if (shouldBeCertified) {
      db.prepare("UPDATE groups SET is_certified = 1 WHERE id = ?").run(groupId)
    }
  } catch (error) {
    console.error("Error updating group reputation:", error)
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getDb, stringifyJsonField } from "@/lib/db"
import { randomUUID } from "crypto"

// POST - Create feedback
export async function POST(request: NextRequest) {
  try {
    const { opportunity_id, from_user_id, to_user_id, rating, feedback_tags, attended } = await request.json()

    if (!opportunity_id || !from_user_id || !to_user_id || !rating) {
      return NextResponse.json(
        { error: { message: "Missing required fields" } },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: { message: "Rating must be between 1 and 5" } },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if feedback already exists
    const existingFeedback = db.prepare(`
      SELECT id FROM feedback
      WHERE opportunity_id = ? AND from_user_id = ? AND to_user_id = ?
    `).get(opportunity_id, from_user_id, to_user_id)

    if (existingFeedback) {
      return NextResponse.json(
        { error: { message: "You have already submitted feedback for this opportunity" } },
        { status: 400 }
      )
    }

    // Create feedback
    const feedbackId = randomUUID()
    db.prepare(`
      INSERT INTO feedback (id, opportunity_id, from_user_id, to_user_id, rating, feedback_tags, attended)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      feedbackId,
      opportunity_id,
      from_user_id,
      to_user_id,
      rating,
      stringifyJsonField(feedback_tags || []),
      attended ? 1 : 0
    )

    // Update reputation for the organizer based on rating
    // Good ratings (4-5) give +3 points, average (3) gives +1, poor (1-2) gives -1
    let repChange = 0
    if (rating >= 4) {
      repChange = 3
    } else if (rating === 3) {
      repChange = 1
    } else {
      repChange = -1
    }

    // Update organizer's reputation
    db.prepare(`
      UPDATE profiles
      SET reputation_score = MAX(0, reputation_score + ?),
          reputation_tier = CASE
            WHEN reputation_score + ? >= 150 THEN 'Certified'
            WHEN reputation_score + ? >= 100 THEN 'Advanced'
            WHEN reputation_score + ? >= 50 THEN 'Established'
            WHEN reputation_score + ? >= 25 THEN 'Trusted'
            ELSE 'New'
          END
      WHERE id = ?
    `).run(repChange, repChange, repChange, repChange, repChange, to_user_id)

    // If user attended, update their completed opportunities count
    if (attended) {
      db.prepare(`
        UPDATE profiles
        SET completed_opportunities = completed_opportunities + 1,
            reputation_score = reputation_score + 2,
            reputation_tier = CASE
              WHEN reputation_score + 2 >= 150 THEN 'Certified'
              WHEN reputation_score + 2 >= 100 THEN 'Advanced'
              WHEN reputation_score + 2 >= 50 THEN 'Established'
              WHEN reputation_score + 2 >= 25 THEN 'Trusted'
              ELSE 'New'
            END
        WHERE id = ?
      `).run(from_user_id)
    }

    return NextResponse.json({
      success: true,
      feedback: { id: feedbackId },
    })
  } catch (error: any) {
    console.error("Feedback creation error:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to create feedback" } },
      { status: 500 }
    )
  }
}

// GET - Get feedback for an opportunity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const opportunityId = searchParams.get("opportunity_id")

    if (!opportunityId) {
      return NextResponse.json(
        { error: { message: "opportunity_id is required" } },
        { status: 400 }
      )
    }

    const db = getDb()
    const feedback = db.prepare(`
      SELECT f.*,
             p.full_name as from_user_name
      FROM feedback f
      LEFT JOIN profiles p ON f.from_user_id = p.id
      WHERE f.opportunity_id = ?
      ORDER BY f.created_at DESC
    `).all(opportunityId)

    return NextResponse.json({ feedback })
  } catch (error: any) {
    console.error("Feedback fetch error:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to fetch feedback" } },
      { status: 500 }
    )
  }
}

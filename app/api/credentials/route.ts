import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { randomUUID } from "crypto"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

// Reputation boosts for different credential types
const CREDENTIAL_REPUTATION_BOOSTS: Record<string, number> = {
  degree: 15,
  certification: 10,
  license: 12,
}

// POST - Submit a new credential
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: { message: "Invalid token" } },
        { status: 401 }
      )
    }

    const { type, title, institution, field_of_study, year_obtained, document_url } = await request.json()

    if (!type || !title || !institution) {
      return NextResponse.json(
        { error: { message: "Type, title, and institution are required" } },
        { status: 400 }
      )
    }

    if (!["degree", "certification", "license"].includes(type)) {
      return NextResponse.json(
        { error: { message: "Invalid credential type" } },
        { status: 400 }
      )
    }

    const db = getDb()
    const credentialId = randomUUID()

    db.prepare(`
      INSERT INTO user_credentials (id, user_id, type, title, institution, field_of_study, year_obtained, document_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      credentialId,
      decoded.userId,
      type,
      title,
      institution,
      field_of_study || null,
      year_obtained || null,
      document_url || null
    )

    return NextResponse.json({
      success: true,
      credential: {
        id: credentialId,
        type,
        title,
        institution,
        verification_status: "pending",
      },
    })
  } catch (error: any) {
    console.error("Credential submission error:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to submit credential" } },
      { status: 500 }
    )
  }
}

// GET - Get credentials for current user or specific user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    let targetUserId = userId

    // If no user_id provided, get current user's credentials
    if (!targetUserId && token) {
      const decoded = verifyToken(token)
      if (decoded) {
        targetUserId = decoded.userId
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: { message: "User ID required" } },
        { status: 400 }
      )
    }

    const db = getDb()
    const credentials = db.prepare(`
      SELECT id, type, title, institution, field_of_study, year_obtained,
             verification_status, verified_at, reputation_boost, created_at
      FROM user_credentials
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(targetUserId)

    return NextResponse.json({ credentials })
  } catch (error: any) {
    console.error("Credentials fetch error:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to fetch credentials" } },
      { status: 500 }
    )
  }
}

// PUT - Verify a credential (admin action - for demo, any user can verify)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: { message: "Invalid token" } },
        { status: 401 }
      )
    }

    const { credential_id, action } = await request.json()

    if (!credential_id || !action) {
      return NextResponse.json(
        { error: { message: "credential_id and action are required" } },
        { status: 400 }
      )
    }

    if (!["verify", "reject"].includes(action)) {
      return NextResponse.json(
        { error: { message: "Invalid action" } },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get the credential
    const credential = db.prepare(`
      SELECT * FROM user_credentials WHERE id = ?
    `).get(credential_id) as any

    if (!credential) {
      return NextResponse.json(
        { error: { message: "Credential not found" } },
        { status: 404 }
      )
    }

    if (credential.verification_status !== "pending") {
      return NextResponse.json(
        { error: { message: "Credential has already been processed" } },
        { status: 400 }
      )
    }

    const newStatus = action === "verify" ? "verified" : "rejected"
    const reputationBoost = action === "verify" ? CREDENTIAL_REPUTATION_BOOSTS[credential.type] || 10 : 0

    // Update credential status
    db.prepare(`
      UPDATE user_credentials
      SET verification_status = ?,
          verified_at = CASE WHEN ? = 'verified' THEN CURRENT_TIMESTAMP ELSE NULL END,
          reputation_boost = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, newStatus, reputationBoost, credential_id)

    // If verified, update user's reputation and is_verified status
    if (action === "verify") {
      db.prepare(`
        UPDATE profiles
        SET reputation_score = reputation_score + ?,
            is_verified = 1,
            reputation_tier = CASE
              WHEN reputation_score + ? >= 150 THEN 'Certified'
              WHEN reputation_score + ? >= 100 THEN 'Advanced'
              WHEN reputation_score + ? >= 50 THEN 'Established'
              WHEN reputation_score + ? >= 25 THEN 'Trusted'
              ELSE 'New'
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reputationBoost, reputationBoost, reputationBoost, reputationBoost, reputationBoost, credential.user_id)
    }

    return NextResponse.json({
      success: true,
      credential: {
        id: credential_id,
        verification_status: newStatus,
        reputation_boost: reputationBoost,
      },
    })
  } catch (error: any) {
    console.error("Credential verification error:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to process credential" } },
      { status: 500 }
    )
  }
}

// DELETE - Remove a credential
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: { message: "Invalid token" } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const credentialId = searchParams.get("id")

    if (!credentialId) {
      return NextResponse.json(
        { error: { message: "Credential ID required" } },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get the credential to check ownership and reputation boost
    const credential = db.prepare(`
      SELECT * FROM user_credentials WHERE id = ? AND user_id = ?
    `).get(credentialId, decoded.userId) as any

    if (!credential) {
      return NextResponse.json(
        { error: { message: "Credential not found or unauthorized" } },
        { status: 404 }
      )
    }

    // If credential was verified, remove the reputation boost
    if (credential.verification_status === "verified" && credential.reputation_boost > 0) {
      db.prepare(`
        UPDATE profiles
        SET reputation_score = MAX(0, reputation_score - ?),
            reputation_tier = CASE
              WHEN reputation_score - ? >= 150 THEN 'Certified'
              WHEN reputation_score - ? >= 100 THEN 'Advanced'
              WHEN reputation_score - ? >= 50 THEN 'Established'
              WHEN reputation_score - ? >= 25 THEN 'Trusted'
              ELSE 'New'
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        credential.reputation_boost,
        credential.reputation_boost,
        credential.reputation_boost,
        credential.reputation_boost,
        credential.reputation_boost,
        decoded.userId
      )

      // Check if user has any other verified credentials
      const otherVerified = db.prepare(`
        SELECT COUNT(*) as count FROM user_credentials
        WHERE user_id = ? AND verification_status = 'verified' AND id != ?
      `).get(decoded.userId, credentialId) as any

      // If no other verified credentials, remove is_verified status
      if (otherVerified.count === 0) {
        db.prepare(`
          UPDATE profiles SET is_verified = 0 WHERE id = ?
        `).run(decoded.userId)
      }
    }

    // Delete the credential
    db.prepare(`DELETE FROM user_credentials WHERE id = ?`).run(credentialId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Credential deletion error:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to delete credential" } },
      { status: 500 }
    )
  }
}

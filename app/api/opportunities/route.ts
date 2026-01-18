import { NextResponse } from "next/server"
import { getAllOpportunities, createOpportunity } from "@/lib/db-helpers"
import { getUserByToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const opportunities = getAllOpportunities()
    return NextResponse.json(opportunities)
  } catch (error: any) {
    console.error("Error fetching opportunities:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to fetch opportunities" } },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    
    console.log("Creating opportunity - Token present:", !!token)
    console.log("All cookies:", Array.from(cookieStore.getAll()).map(c => c.name))
    
    if (!token) {
      console.error("No auth token found in cookies")
      return NextResponse.json(
        { error: { message: "Unauthorized - Please log in to create opportunities" } },
        { status: 401 }
      )
    }

    const user = getUserByToken(token)
    if (!user) {
      console.error("Token verification failed. Token length:", token.length)
      return NextResponse.json(
        { error: { message: "Unauthorized - Invalid or expired token. Please log in again." } },
        { status: 401 }
      )
    }
    
    console.log("User authenticated:", user.email)

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.description || !body.time_slot) {
      return NextResponse.json(
        { error: { message: "Title, description, and time slot are required" } },
        { status: 400 }
      )
    }

    try {
      const opportunity = createOpportunity({
        title: body.title,
        description: body.description,
        organizer_id: user.id,
        group_id: body.group_id || null,
        tags: body.tags || [],
        time_slot: body.time_slot,
        suggested_space_id: body.suggested_space_id || null,
        ai_plan: body.ai_plan || null,
        required_rep_tier: body.required_rep_tier || "New",
        requires_certified_group: body.requires_certified_group || false,
        max_participants: body.max_participants || 10,
      })

      return NextResponse.json(opportunity)
    } catch (dbError: any) {
      console.error("Database error creating opportunity:", dbError)
      return NextResponse.json(
        { error: { message: dbError.message || "Failed to create opportunity in database" } },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error in POST /api/opportunities:", error)
    return NextResponse.json(
      { error: { message: error.message || "Failed to create opportunity" } },
      { status: 500 }
    )
  }
}

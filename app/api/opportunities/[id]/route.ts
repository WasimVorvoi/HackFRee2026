import { NextRequest, NextResponse } from "next/server"
import { getOpportunityById } from "@/lib/db-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const opportunity = getOpportunityById(id)
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 })
    }
    return NextResponse.json(opportunity)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch opportunity" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getSpaceById } from "@/lib/db-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const space = getSpaceById(id)
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 })
    }
    return NextResponse.json(space)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch space" },
      { status: 500 }
    )
  }
}

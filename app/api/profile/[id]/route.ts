import { NextRequest, NextResponse } from "next/server"
import { getProfileById } from "@/lib/db-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = getProfileById(id)
    if (!profile) {
      return NextResponse.json({ error: { message: "Profile not found" } }, { status: 404 })
    }
    return NextResponse.json({ user: profile })
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to fetch profile" } },
      { status: 500 }
    )
  }
}

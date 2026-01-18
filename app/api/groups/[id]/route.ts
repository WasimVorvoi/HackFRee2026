import { NextRequest, NextResponse } from "next/server"
import { getGroupById } from "@/lib/db-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const group = getGroupById(id)
    if (!group) {
      return NextResponse.json({ error: { message: "Group not found" } }, { status: 404 })
    }
    return NextResponse.json(group)
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to fetch group" } },
      { status: 500 }
    )
  }
}

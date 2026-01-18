import { NextResponse } from "next/server"
import { getAllGroups, createGroup } from "@/lib/db-helpers"
import { getUserByToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const groups = getAllGroups()
    return NextResponse.json(groups)
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to fetch groups" } },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 })
    }

    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 })
    }

    const body = await request.json()
    const group = createGroup({
      ...body,
      organizer_id: user.id,
    })

    return NextResponse.json(group)
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to create group" } },
      { status: 500 }
    )
  }
}

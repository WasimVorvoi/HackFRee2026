import { NextResponse } from "next/server"
import { getAllSpaces, createSpace } from "@/lib/db-helpers"
import { getUserByToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const spaces = getAllSpaces()
    return NextResponse.json(spaces)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch spaces" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = getUserByToken(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const space = createSpace({
      ...body,
      owner_id: user.id,
    })

    return NextResponse.json(space)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create space" },
      { status: 500 }
    )
  }
}

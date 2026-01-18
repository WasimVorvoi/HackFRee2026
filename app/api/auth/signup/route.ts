import { NextRequest, NextResponse } from "next/server"
import { createUser, getUserById } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name, location, interests, availability } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: { message: "Email and password are required" } },
        { status: 400 }
      )
    }

    // Check if user already exists
    const db = getDb()
    const existingUser = db.prepare("SELECT id FROM profiles WHERE email = ?").get(email)
    if (existingUser) {
      return NextResponse.json(
        { error: { message: "An account with this email already exists. Please log in instead." } },
        { status: 400 }
      )
    }

    console.log("Creating user with email:", email)
    const result = await createUser(email, password, {
      full_name,
      location,
      interests,
      availability,
    })

    console.log("User created:", result?.user?.id, result?.user?.email)
    
    if (!result || !result.user) {
      console.error("Failed to create user - result:", result)
      return NextResponse.json(
        { error: { message: "Failed to create user" } },
        { status: 500 }
      )
    }

    // Set cookie
    try {
      const cookieStore = await cookies()
      cookieStore.set("auth-token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      })
      console.log("Cookie set successfully")
    } catch (cookieError) {
      console.error("Cookie setting error:", cookieError)
      // Continue anyway - token is in response
    }

    return NextResponse.json({
      user: result.user,
      token: result.token,
    })
  } catch (error: any) {
    console.error("Signup error:", error)
    const errorMessage = error?.message || error?.toString() || "Signup failed. Please try again."
    return NextResponse.json(
      { error: { message: errorMessage } },
      { status: 500 }
    )
  }
}

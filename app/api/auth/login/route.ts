import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: { message: "Email and password are required" } },
        { status: 400 }
      )
    }

    const result = await authenticateUser(email, password)

    if (!result) {
      console.error("Login failed: Invalid credentials for", email)
      return NextResponse.json(
        { error: { message: "Invalid email or password" } },
        { status: 401 }
      )
    }

    if (!result.user) {
      console.error("Login failed: No user returned")
      return NextResponse.json(
        { error: { message: "Failed to retrieve user data" } },
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
      console.log("Login cookie set successfully for:", result.user.email)
    } catch (cookieError) {
      console.error("Cookie setting error:", cookieError)
      // Continue anyway - token is in response
    }

    return NextResponse.json({
      user: result.user,
      token: result.token,
    })
  } catch (error: any) {
    console.error("Login error:", error)
    const errorMessage = error?.message || error?.toString() || "Login failed. Please try again."
    return NextResponse.json(
      { error: { message: errorMessage } },
      { status: 500 }
    )
  }
}

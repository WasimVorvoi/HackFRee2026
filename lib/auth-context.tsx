"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Profile = {
  id: string
  email: string
  full_name: string
  location: string | null
  interests: string[]
  availability: Record<string, any>
  reputation_score: number
  reputation_tier: "New" | "Trusted" | "Established" | "Advanced" | "Certified"
  is_verified: boolean
  completed_opportunities: number
  no_shows: number
}

type AuthContextType = {
  user: Profile | null
  isLoggedIn: boolean
  isLoading: boolean
  emailVerified: boolean
  login: (email: string, password: string) => Promise<{ error: any }>
  signup: (email: string, password: string, metadata: any) => Promise<{ error: any }>
  logout: () => Promise<void>
  resendVerificationEmail: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [emailVerified, setEmailVerified] = useState(false)

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()
      if (data.user) {
        console.log("User session found:", data.user.email)
        setUser(data.user)
        setIsLoggedIn(true)
        setEmailVerified(data.user.is_verified)
      } else {
        console.log("No user session found")
        setUser(null)
        setIsLoggedIn(false)
        setEmailVerified(false)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
      setIsLoggedIn(false)
      setEmailVerified(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.user) {
        setUser(data.user)
        setIsLoggedIn(true)
        setEmailVerified(data.user.is_verified)
        return { error: null }
      } else {
        const errorMessage = data.error?.message || data.error || "Login failed"
        console.error("Login error:", errorMessage)
        return { error: { message: errorMessage } }
      }
    } catch (error: any) {
      console.error("Login network error:", error)
      return { error: { message: error.message || "Network error. Please try again." } }
    }
  }

  const signup = async (email: string, password: string, metadata: any) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: metadata.full_name,
          location: metadata.location,
          interests: metadata.interests,
          availability: metadata.availability,
        }),
      })

      const data = await response.json()

      if (response.ok && data.user) {
        setUser(data.user)
        setIsLoggedIn(true)
        setEmailVerified(data.user.is_verified)
        return { error: null }
      } else {
        // Handle different error formats
        let errorMessage = "Signup failed"
        if (typeof data.error === "string") {
          errorMessage = data.error
        } else if (data.error?.message) {
          errorMessage = data.error.message
        } else if (data.error && typeof data.error === "object") {
          errorMessage = JSON.stringify(data.error)
        }
        console.error("Signup error:", errorMessage)
        return { error: { message: errorMessage } }
      }
    } catch (error: any) {
      console.error("Signup network error:", error)
      return { error: { message: error.message || "Network error. Please try again." } }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      setIsLoggedIn(false)
      setEmailVerified(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const resendVerificationEmail = async () => {
    // For local database, we can just mark as verified
    // In a real app, you'd send an email
    return { error: null }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        emailVerified,
        login,
        signup,
        logout,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

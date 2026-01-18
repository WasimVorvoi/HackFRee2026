import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getDb } from "./db"
import { randomUUID } from "crypto"

// Mark this module as server-only
if (typeof window !== "undefined") {
  throw new Error("Auth module can only be used server-side")
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const JWT_EXPIRES_IN = "7d"

export interface User {
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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded
  } catch (error: any) {
    console.log("Token verification error:", error.message)
    return null
  }
}

export async function createUser(
  email: string,
  password: string,
  metadata: {
    full_name?: string
    location?: string
    interests?: string[]
    availability?: Record<string, any>
  }
): Promise<{ user: User; token: string }> {
  try {
    const db = getDb()
    const id = randomUUID()
    const passwordHash = await hashPassword(password)

    const stmt = db.prepare(`
      INSERT INTO profiles (
        id, email, password_hash, full_name, location, interests, availability
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      email,
      passwordHash,
      metadata.full_name || email.split("@")[0],
      metadata.location || null,
      JSON.stringify(metadata.interests || []),
      JSON.stringify(metadata.availability || {})
    )

    const user = getUserById(id)
    if (!user) {
      throw new Error("Failed to retrieve created user")
    }

    const token = generateToken(id)

    // Store session
    try {
      const sessionStmt = db.prepare(`
        INSERT INTO sessions (id, user_id, token, expires_at)
        VALUES (?, ?, ?, datetime('now', '+7 days'))
      `)
      sessionStmt.run(randomUUID(), id, token)
    } catch (sessionError) {
      console.warn("Failed to create session, continuing anyway:", sessionError)
    }

    return { user, token }
  } catch (error: any) {
    console.error("Error in createUser:", error)
    throw new Error(error.message || "Failed to create user")
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: User; token: string } | null> {
  try {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM profiles WHERE email = ?")
    const row = stmt.get(email) as any

    if (!row) {
      console.log("User not found:", email)
      return null
    }

    if (!row.password_hash) {
      console.error("User has no password hash:", email)
      return null
    }

    const isValid = await verifyPassword(password, row.password_hash)
    if (!isValid) {
      console.log("Invalid password for:", email)
      return null
    }

    const user: User = {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      location: row.location,
      interests: JSON.parse(row.interests || "[]"),
      availability: JSON.parse(row.availability || "{}"),
      reputation_score: row.reputation_score,
      reputation_tier: row.reputation_tier,
      is_verified: row.is_verified === 1,
      completed_opportunities: row.completed_opportunities,
      no_shows: row.no_shows,
    }

    const token = generateToken(user.id)

    // Store session
    try {
      const sessionStmt = db.prepare(`
        INSERT INTO sessions (id, user_id, token, expires_at)
        VALUES (?, ?, ?, datetime('now', '+7 days'))
      `)
      sessionStmt.run(randomUUID(), user.id, token)
    } catch (sessionError) {
      console.warn("Failed to create session, continuing anyway:", sessionError)
    }

    return { user, token }
  } catch (error: any) {
    console.error("Error in authenticateUser:", error)
    return null
  }
}

export function getUserById(userId: string): User | null {
  const db = getDb()
  const stmt = db.prepare("SELECT * FROM profiles WHERE id = ?")
  const row = stmt.get(userId) as any

  if (!row) return null

  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    location: row.location,
    interests: JSON.parse(row.interests || "[]"),
    availability: JSON.parse(row.availability || "{}"),
    reputation_score: row.reputation_score,
    reputation_tier: row.reputation_tier,
    is_verified: row.is_verified === 1,
    completed_opportunities: row.completed_opportunities,
    no_shows: row.no_shows,
  }
}

export function getUserByToken(token: string): User | null {
  if (!token) {
    console.log("getUserByToken: No token provided")
    return null
  }
  
  const decoded = verifyToken(token)
  if (!decoded) {
    console.log("getUserByToken: Token verification failed")
    return null
  }

  const user = getUserById(decoded.userId)
  if (!user) {
    console.log("getUserByToken: User not found for ID:", decoded.userId)
  }
  
  return user
}

export function updateUser(userId: string, updates: Partial<User>): void {
  const db = getDb()
  const fields: string[] = []
  const values: any[] = []

  if (updates.full_name !== undefined) {
    fields.push("full_name = ?")
    values.push(updates.full_name)
  }
  if (updates.location !== undefined) {
    fields.push("location = ?")
    values.push(updates.location)
  }
  if (updates.interests !== undefined) {
    fields.push("interests = ?")
    values.push(JSON.stringify(updates.interests))
  }
  if (updates.availability !== undefined) {
    fields.push("availability = ?")
    values.push(JSON.stringify(updates.availability))
  }

  fields.push("updated_at = CURRENT_TIMESTAMP")
  values.push(userId)

  if (fields.length > 1) {
    const stmt = db.prepare(`UPDATE profiles SET ${fields.join(", ")} WHERE id = ?`)
    stmt.run(...values)
  }
}

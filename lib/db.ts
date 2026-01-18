import Database from "better-sqlite3"
import { join } from "path"
import { existsSync, mkdirSync } from "fs"

// Mark this module as server-only
if (typeof window !== "undefined") {
  throw new Error("Database module can only be used server-side")
}

// Database file location
const dbDir = join(process.cwd(), "data")
const dbPath = join(dbDir, "communify.db")

// Ensure data directory exists
if (!existsSync(dbDir)) {
  try {
    mkdirSync(dbDir, { recursive: true })
  } catch (error) {
    console.error("Failed to create data directory:", error)
    throw error
  }
}

// Create database connection
let db: Database.Database | null = null

let seedingDone = false

export function getDb(): Database.Database {
  if (!db) {
    try {
      db = new Database(dbPath)
      db.pragma("journal_mode = WAL")
      db.pragma("foreign_keys = ON")
      initializeSchema(db)
      console.log("Database initialized at:", dbPath)

      // Seed demo data on first initialization
      if (!seedingDone) {
        seedingDone = true
        // Use dynamic import to avoid circular dependency
        import("./seed-data").then(({ seedDemoData }) => {
          try {
            seedDemoData()
          } catch (seedError) {
            console.error("Error seeding demo data:", seedError)
          }
        }).catch(err => {
          console.error("Error loading seed-data module:", err)
        })
      }
    } catch (error) {
      console.error("Failed to initialize database:", error)
      throw error
    }
  }
  return db
}

// Initialize database schema
function initializeSchema(database: Database.Database) {
  // Profiles table
  database.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      location TEXT,
      interests TEXT DEFAULT '[]',
      availability TEXT DEFAULT '{}',
      reputation_score INTEGER DEFAULT 0,
      reputation_tier TEXT DEFAULT 'New' CHECK (reputation_tier IN ('New', 'Trusted', 'Established', 'Advanced', 'Certified')),
      is_verified BOOLEAN DEFAULT 0,
      completed_opportunities INTEGER DEFAULT 0,
      no_shows INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Groups table
  database.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      purpose TEXT,
      organizer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      type TEXT DEFAULT 'open' CHECK (type IN ('open', 'invite-only')),
      is_certified BOOLEAN DEFAULT 0,
      average_rep_score INTEGER DEFAULT 0,
      member_count INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Group members
  database.exec(`
    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member' CHECK (role IN ('organizer', 'member')),
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, user_id)
    )
  `)

  // Spaces table
  database.exec(`
    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      capacity INTEGER NOT NULL,
      owner_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      requires_approval BOOLEAN DEFAULT 0,
      amenities TEXT DEFAULT '[]',
      availability TEXT DEFAULT '{}',
      min_reputation_tier TEXT DEFAULT 'New' CHECK (min_reputation_tier IN ('New', 'Trusted', 'Established', 'Advanced', 'Certified')),
      is_premium BOOLEAN DEFAULT 0,
      is_demo BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Opportunities table
  database.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      organizer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
      tags TEXT DEFAULT '[]',
      time_slot TEXT NOT NULL,
      suggested_space_id TEXT REFERENCES spaces(id) ON DELETE SET NULL,
      ai_plan TEXT,
      status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reserved', 'confirmed', 'completed', 'cancelled')),
      required_rep_tier TEXT DEFAULT 'New' CHECK (required_rep_tier IN ('New', 'Trusted', 'Established', 'Advanced', 'Certified')),
      requires_certified_group BOOLEAN DEFAULT 0,
      max_participants INTEGER DEFAULT 10,
      current_participants INTEGER DEFAULT 0,
      is_demo BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Bookings table
  database.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
      opportunity_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'cancelled', 'completed', 'pending')),
      reserved_at TEXT DEFAULT CURRENT_TIMESTAMP,
      confirmed_at TEXT,
      expires_at TEXT,
      terms_accepted BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create index for booking conflict checks
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookings_space_time_range 
    ON bookings(space_id, start_time, end_time) 
    WHERE status IN ('reserved', 'confirmed', 'pending')
  `)

  // Opportunity participants
  database.exec(`
    CREATE TABLE IF NOT EXISTS opportunity_participants (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(opportunity_id, user_id)
    )
  `)

  // Messages table
  database.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Feedback table
  database.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      from_user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      to_user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      feedback_tags TEXT DEFAULT '[]',
      attended BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Sessions table for auth
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Likes table
  database.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      opportunity_id TEXT REFERENCES opportunities(id) ON DELETE CASCADE,
      space_id TEXT REFERENCES spaces(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, opportunity_id, space_id)
    )
  `)

  // User credentials table for degrees and certifications
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('degree', 'certification', 'license')),
      title TEXT NOT NULL,
      institution TEXT NOT NULL,
      field_of_study TEXT,
      year_obtained INTEGER,
      document_url TEXT,
      verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
      verified_at TEXT,
      reputation_boost INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON profiles(reputation_tier, reputation_score);
    CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
    CREATE INDEX IF NOT EXISTS idx_opportunities_organizer ON opportunities(organizer_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_space_time ON bookings(space_id, status);
    CREATE INDEX IF NOT EXISTS idx_messages_opportunity ON messages(opportunity_id);
    CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_opportunity ON likes(opportunity_id);
    CREATE INDEX IF NOT EXISTS idx_likes_space ON likes(space_id);
    CREATE INDEX IF NOT EXISTS idx_credentials_user ON user_credentials(user_id);
    CREATE INDEX IF NOT EXISTS idx_credentials_status ON user_credentials(verification_status);
  `)
}

// Helper to parse JSON fields
export function parseJsonField<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue
  try {
    return JSON.parse(value) as T
  } catch {
    return defaultValue
  }
}

// Helper to stringify JSON fields
export function stringifyJsonField(value: any): string {
  return JSON.stringify(value)
}

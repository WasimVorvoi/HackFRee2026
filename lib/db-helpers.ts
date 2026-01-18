import { getDb, parseJsonField, stringifyJsonField } from "./db"
import { randomUUID } from "crypto"

// Mark this module as server-only
if (typeof window !== "undefined") {
  throw new Error("Database helpers can only be used server-side")
}

// Helper functions for database operations

export function getAllProfiles() {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM profiles").all() as any[]
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    location: row.location,
    interests: parseJsonField(row.interests, []),
    availability: parseJsonField(row.availability, {}),
    reputation_score: row.reputation_score,
    reputation_tier: row.reputation_tier,
    is_verified: row.is_verified === 1,
    completed_opportunities: row.completed_opportunities,
    no_shows: row.no_shows,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export function getProfileById(id: string) {
  const db = getDb()
  const row = db.prepare("SELECT * FROM profiles WHERE id = ?").get(id) as any
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    location: row.location,
    interests: parseJsonField(row.interests, []),
    availability: parseJsonField(row.availability, {}),
    reputation_score: row.reputation_score,
    reputation_tier: row.reputation_tier,
    is_verified: row.is_verified === 1,
    completed_opportunities: row.completed_opportunities,
    no_shows: row.no_shows,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function getAllOpportunities() {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM opportunities ORDER BY created_at DESC").all() as any[]
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    organizer_id: row.organizer_id,
    group_id: row.group_id,
    tags: parseJsonField(row.tags, []),
    time_slot: parseJsonField(row.time_slot, {}),
    suggested_space_id: row.suggested_space_id,
    ai_plan: parseJsonField(row.ai_plan, null),
    status: row.status,
    required_rep_tier: row.required_rep_tier,
    requires_certified_group: row.requires_certified_group === 1,
    max_participants: row.max_participants,
    current_participants: row.current_participants,
    is_demo: row.is_demo === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export function getOpportunityById(id: string) {
  const db = getDb()
  const row = db.prepare("SELECT * FROM opportunities WHERE id = ?").get(id) as any
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    organizer_id: row.organizer_id,
    group_id: row.group_id,
    tags: parseJsonField(row.tags, []),
    time_slot: parseJsonField(row.time_slot, {}),
    suggested_space_id: row.suggested_space_id,
    ai_plan: parseJsonField(row.ai_plan, null),
    status: row.status,
    required_rep_tier: row.required_rep_tier,
    requires_certified_group: row.requires_certified_group === 1,
    max_participants: row.max_participants,
    current_participants: row.current_participants,
    is_demo: row.is_demo === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function createOpportunity(data: {
  title: string
  description: string
  organizer_id: string
  group_id?: string
  tags?: string[]
  time_slot: any
  suggested_space_id?: string
  ai_plan?: any
  required_rep_tier?: string
  requires_certified_group?: boolean
  max_participants?: number
}) {
  const db = getDb()
  
  // Verify organizer exists
  const organizer = db.prepare("SELECT id FROM profiles WHERE id = ?").get(data.organizer_id)
  if (!organizer) {
    throw new Error(`Organizer with ID ${data.organizer_id} not found. Please ensure you are logged in.`)
  }
  
  const id = randomUUID()
  try {
    const stmt = db.prepare(`
      INSERT INTO opportunities (
        id, title, description, organizer_id, group_id, tags, time_slot,
        suggested_space_id, ai_plan, required_rep_tier, requires_certified_group,
        max_participants, current_participants
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `)
    stmt.run(
      id,
      data.title,
      data.description,
      data.organizer_id,
      data.group_id || null,
      stringifyJsonField(data.tags || []),
      stringifyJsonField(data.time_slot),
      data.suggested_space_id || null,
      data.ai_plan ? stringifyJsonField(data.ai_plan) : null,
      data.required_rep_tier || "New",
      data.requires_certified_group ? 1 : 0,
      data.max_participants || 10
    )
    return getOpportunityById(id)!
  } catch (error: any) {
    console.error("Error creating opportunity:", error)
    if (error.message.includes("FOREIGN KEY constraint")) {
      throw new Error("Invalid organizer or group. Please ensure you are logged in with a valid account.")
    }
    throw new Error(error.message || "Failed to create opportunity")
  }
}

export function getAllSpaces() {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM spaces ORDER BY created_at DESC").all() as any[]
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    location: row.location,
    description: row.description,
    capacity: row.capacity,
    owner_id: row.owner_id,
    requires_approval: row.requires_approval === 1,
    amenities: parseJsonField(row.amenities, []),
    availability: parseJsonField(row.availability, {}),
    min_reputation_tier: row.min_reputation_tier,
    is_premium: row.is_premium === 1,
    is_demo: row.is_demo === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export function getSpaceById(id: string) {
  const db = getDb()
  const row = db.prepare("SELECT * FROM spaces WHERE id = ?").get(id) as any
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    description: row.description,
    capacity: row.capacity,
    owner_id: row.owner_id,
    requires_approval: row.requires_approval === 1,
    amenities: parseJsonField(row.amenities, []),
    availability: parseJsonField(row.availability, {}),
    min_reputation_tier: row.min_reputation_tier,
    is_premium: row.is_premium === 1,
    is_demo: row.is_demo === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function createSpace(data: {
  name: string
  location: string
  description?: string
  capacity: number
  owner_id: string
  requires_approval?: boolean
  amenities?: string[]
  availability?: any
  min_reputation_tier?: string
  is_premium?: boolean
}) {
  const db = getDb()
  const id = randomUUID()
  const stmt = db.prepare(`
    INSERT INTO spaces (
      id, name, location, description, capacity, owner_id, requires_approval,
      amenities, availability, min_reputation_tier, is_premium
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(
    id,
    data.name,
    data.location,
    data.description || null,
    data.capacity,
    data.owner_id,
    data.requires_approval ? 1 : 0,
    stringifyJsonField(data.amenities || []),
    stringifyJsonField(data.availability || {}),
    data.min_reputation_tier || "New",
    data.is_premium ? 1 : 0
  )
  return getSpaceById(id)!
}

export function getAllGroups() {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM groups ORDER BY created_at DESC").all() as any[]
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    purpose: row.purpose,
    organizer_id: row.organizer_id,
    type: row.type,
    is_certified: row.is_certified === 1,
    average_rep_score: row.average_rep_score,
    member_count: row.member_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export function getGroupById(id: string) {
  const db = getDb()
  const row = db.prepare("SELECT * FROM groups WHERE id = ?").get(id) as any
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    purpose: row.purpose,
    organizer_id: row.organizer_id,
    type: row.type,
    is_certified: row.is_certified === 1,
    average_rep_score: row.average_rep_score,
    member_count: row.member_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function createGroup(data: {
  name: string
  purpose?: string
  organizer_id: string
  type?: string
}) {
  const db = getDb()
  const id = randomUUID()
  const stmt = db.prepare(`
    INSERT INTO groups (id, name, purpose, organizer_id, type)
    VALUES (?, ?, ?, ?, ?)
  `)
  stmt.run(id, data.name, data.purpose || null, data.organizer_id, data.type || "open")
  return getGroupById(id)!
}

export function getBookingsByUserId(userId: string) {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC").all(userId) as any[]
  return rows.map((row) => ({
    id: row.id,
    space_id: row.space_id,
    opportunity_id: row.opportunity_id,
    user_id: row.user_id,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    reserved_at: row.reserved_at,
    confirmed_at: row.confirmed_at,
    expires_at: row.expires_at,
    terms_accepted: row.terms_accepted === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export function createBooking(data: {
  space_id: string
  opportunity_id?: string
  user_id: string
  start_time: string
  end_time: string
  terms_accepted: boolean
  status?: string
}) {
  const db = getDb()
  
  // Check for conflicts
  const conflicts = db.prepare(`
    SELECT id FROM bookings
    WHERE space_id = ? 
      AND status IN ('reserved', 'confirmed', 'pending')
      AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
      )
  `).all(
    data.space_id,
    data.start_time, data.start_time,
    data.end_time, data.end_time,
    data.start_time, data.end_time
  )
  
  if (conflicts.length > 0) {
    throw new Error("Time slot is already booked")
  }
  
  const id = randomUUID()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  
  const status = data.status || "reserved"
  const stmt = db.prepare(`
    INSERT INTO bookings (
      id, space_id, opportunity_id, user_id, start_time, end_time,
      status, expires_at, terms_accepted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(
    id,
    data.space_id,
    data.opportunity_id || null,
    data.user_id,
    data.start_time,
    data.end_time,
    status,
    expiresAt,
    data.terms_accepted ? 1 : 0
  )
  
  return db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as any
}

export function confirmBooking(bookingId: string, userId: string) {
  const db = getDb()
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ?").get(bookingId, userId) as any
  
  if (!booking) {
    throw new Error("Booking not found")
  }
  
  if (booking.status !== "reserved") {
    throw new Error("Booking is not in reserved status")
  }
  
  const now = new Date().toISOString()
  if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
    throw new Error("Booking reservation has expired")
  }
  
  db.prepare(`
    UPDATE bookings 
    SET status = 'confirmed', confirmed_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(now, bookingId)
  
  return db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId) as any
}

export function getMessagesByOpportunity(opportunityId: string, userId: string) {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM messages 
    WHERE opportunity_id = ? AND (sender_id = ? OR receiver_id = ?)
    ORDER BY created_at ASC
  `).all(opportunityId, userId, userId) as any[]
  
  return rows.map((row) => ({
    id: row.id,
    opportunity_id: row.opportunity_id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    content: row.content,
    is_read: row.is_read === 1,
    created_at: row.created_at,
  }))
}

export function createMessage(data: {
  opportunity_id: string
  sender_id: string
  receiver_id: string
  content: string
}) {
  const db = getDb()
  const id = randomUUID()
  const stmt = db.prepare(`
    INSERT INTO messages (id, opportunity_id, sender_id, receiver_id, content)
    VALUES (?, ?, ?, ?, ?)
  `)
  stmt.run(id, data.opportunity_id, data.sender_id, data.receiver_id, data.content)
  return db.prepare("SELECT * FROM messages WHERE id = ?").get(id) as any
}

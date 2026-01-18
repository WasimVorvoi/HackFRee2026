import { getDb, stringifyJsonField } from "./db"
import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"

// Mark this module as server-only
if (typeof window !== "undefined") {
  throw new Error("Seed data module can only be used server-side")
}

// Demo user (organizer with high reputation)
const DEMO_USER = {
  id: "demo-user-001",
  email: "demo@communify.tech",
  password: "demo123",
  full_name: "Alex Community",
  location: "San Francisco, CA",
  interests: ["technology", "education", "environment", "wellness", "art"],
  reputation_score: 150,
  reputation_tier: "Certified",
  is_verified: true,
  completed_opportunities: 25,
  no_shows: 0,
}

// Demo spaces
const DEMO_SPACES = [
  {
    name: "Community Center - Main Hall",
    location: "San Francisco, CA",
    description: "A spacious main hall perfect for large community gatherings, workshops, and events.",
    capacity: 100,
    requires_approval: false,
    amenities: ["WiFi", "Projector", "Sound System", "Chairs", "Tables"],
    min_reputation_tier: "New",
  },
  {
    name: "University Library Study Room",
    location: "Berkeley, CA",
    description: "Quiet study room ideal for small group sessions and tutoring.",
    capacity: 8,
    requires_approval: false,
    amenities: ["WiFi", "Whiteboard", "Power Outlets"],
    min_reputation_tier: "New",
  },
  {
    name: "Maker Space Workshop",
    location: "Oakland, CA",
    description: "Fully equipped maker space with tools for DIY projects and tech workshops.",
    capacity: 15,
    requires_approval: true,
    amenities: ["3D Printer", "Tools", "Workbenches", "WiFi"],
    min_reputation_tier: "Trusted",
  },
  {
    name: "Yoga & Wellness Studio",
    location: "San Francisco, CA",
    description: "Serene studio space for yoga, meditation, and wellness activities.",
    capacity: 20,
    requires_approval: false,
    amenities: ["Mats", "Mirrors", "Sound System", "Natural Lighting"],
    min_reputation_tier: "New",
  },
  {
    name: "Art Gallery Event Space",
    location: "San Francisco, CA",
    description: "Beautiful gallery space for art exhibitions, creative workshops, and cultural events.",
    capacity: 50,
    requires_approval: true,
    amenities: ["Track Lighting", "Display Walls", "A/V Equipment"],
    min_reputation_tier: "Established",
  },
  {
    name: "Tech Hub Conference Room",
    location: "San Jose, CA",
    description: "Modern conference room with video conferencing and presentation capabilities.",
    capacity: 25,
    requires_approval: false,
    amenities: ["WiFi", "Video Conferencing", "Projector", "Whiteboard"],
    min_reputation_tier: "New",
  },
  {
    name: "Community Garden Pavilion",
    location: "Palo Alto, CA",
    description: "Outdoor covered pavilion in a beautiful community garden setting.",
    capacity: 30,
    requires_approval: false,
    amenities: ["Covered Area", "Tables", "Garden Tools Storage"],
    min_reputation_tier: "New",
  },
  {
    name: "Music Practice Room",
    location: "Oakland, CA",
    description: "Soundproofed room for music practice, band rehearsals, and small performances.",
    capacity: 10,
    requires_approval: true,
    amenities: ["Soundproofing", "Basic Instruments", "Amplifiers"],
    min_reputation_tier: "Trusted",
  },
  {
    name: "Cooking & Nutrition Lab",
    location: "San Francisco, CA",
    description: "Commercial-grade kitchen for cooking classes and nutrition workshops.",
    capacity: 12,
    requires_approval: true,
    amenities: ["Commercial Kitchen", "Cooking Equipment", "Dining Area"],
    min_reputation_tier: "Established",
  },
  {
    name: "Innovation Lab",
    location: "Mountain View, CA",
    description: "Premium innovation space for certified community leaders and advanced projects.",
    capacity: 40,
    requires_approval: true,
    amenities: ["High-Speed WiFi", "VR Equipment", "Prototyping Tools", "Meeting Pods"],
    min_reputation_tier: "Certified",
  },
]

// Demo opportunities
const DEMO_OPPORTUNITIES = [
  {
    title: "Python Coding Workshop for Beginners",
    description: "Learn the fundamentals of Python programming in this beginner-friendly workshop. We'll cover variables, loops, functions, and build a simple project together.",
    tags: ["coding", "education", "technology"],
    time_slot: { day: "Saturday", start: "10:00", end: "12:00", date: getNextWeekDate(6) },
    required_rep_tier: "New",
    max_participants: 15,
    ai_plan: {
      steps: [
        "Setup: Help participants install Python and set up their development environment",
        "Learning: Cover core concepts through interactive coding exercises",
        "Project: Build a simple calculator or text-based game together"
      ],
      resources: ["Laptops", "Python 3 installed", "Code examples"]
    },
  },
  {
    title: "Community Garden Volunteer Day",
    description: "Join us for a hands-on gardening session! We'll plant seasonal vegetables, maintain flower beds, and learn about sustainable gardening practices.",
    tags: ["environment", "volunteer", "wellness"],
    time_slot: { day: "Sunday", start: "09:00", end: "12:00", date: getNextWeekDate(0) },
    required_rep_tier: "New",
    max_participants: 20,
    ai_plan: {
      steps: [
        "Gather: Meet at the pavilion for assignments and safety briefing",
        "Work: Plant new seedlings and tend to existing garden beds",
        "Celebrate: Share harvest samples and plan next session"
      ],
      resources: ["Gardening gloves", "Water bottles", "Sun protection"]
    },
  },
  {
    title: "Mindfulness Meditation Session",
    description: "Take a break from the hustle and join our guided meditation session. Perfect for beginners and experienced practitioners alike.",
    tags: ["wellness", "mindfulness", "health"],
    time_slot: { day: "Wednesday", start: "18:00", end: "19:00", date: getNextWeekDate(3) },
    required_rep_tier: "New",
    max_participants: 20,
    ai_plan: {
      steps: [
        "Welcome: Introduction to mindfulness and settling into the space",
        "Practice: Guided meditation focusing on breath and body awareness",
        "Integration: Discussion and tips for daily practice"
      ],
      resources: ["Yoga mats", "Cushions", "Calm environment"]
    },
  },
  {
    title: "Local Art Exhibition Opening",
    description: "Celebrate local artists at our community exhibition opening. Meet the artists, enjoy refreshments, and explore diverse creative works.",
    tags: ["art", "culture", "community"],
    time_slot: { day: "Friday", start: "17:00", end: "20:00", date: getNextWeekDate(5) },
    required_rep_tier: "Trusted",
    max_participants: 50,
    ai_plan: {
      steps: [
        "Setup: Arrange artworks and prepare refreshment area",
        "Opening: Welcome guests and introduce featured artists",
        "Mingle: Facilitate artist-guest conversations and art tours"
      ],
      resources: ["Art displays", "Refreshments", "Name tags"]
    },
  },
  {
    title: "Tech Mentorship Circle",
    description: "Connect with tech professionals for career guidance and skill development. Open to all levels from students to career changers.",
    tags: ["technology", "career", "education"],
    time_slot: { day: "Thursday", start: "18:30", end: "20:30", date: getNextWeekDate(4) },
    required_rep_tier: "Trusted",
    max_participants: 12,
    ai_plan: {
      steps: [
        "Introductions: Share backgrounds and goals for the session",
        "Mentorship: Small group discussions on career topics",
        "Networking: Exchange contacts and plan follow-ups"
      ],
      resources: ["Name tags", "Notepads", "Refreshments"]
    },
  },
  {
    title: "Youth STEM Saturday",
    description: "Hands-on science and technology activities for kids ages 8-14. Fun experiments and projects that spark curiosity!",
    tags: ["education", "youth", "technology"],
    time_slot: { day: "Saturday", start: "14:00", end: "16:00", date: getNextWeekDate(6) },
    required_rep_tier: "Established",
    max_participants: 20,
    ai_plan: {
      steps: [
        "Welcome: Engage kids with an exciting science demo",
        "Explore: Rotate through STEM activity stations",
        "Create: Take-home project for continued learning"
      ],
      resources: ["Science kits", "Safety goggles", "Parent volunteers"]
    },
  },
  {
    title: "Sustainable Living Workshop",
    description: "Learn practical tips for reducing your environmental footprint. Topics include zero-waste living, composting, and energy conservation.",
    tags: ["environment", "sustainability", "education"],
    time_slot: { day: "Sunday", start: "13:00", end: "15:00", date: getNextWeekDate(0) },
    required_rep_tier: "New",
    max_participants: 25,
    ai_plan: {
      steps: [
        "Learn: Presentation on sustainable living principles",
        "Practice: DIY workshop making reusable items",
        "Plan: Create personal sustainability action plans"
      ],
      resources: ["Craft supplies", "Handouts", "Sample products"]
    },
  },
  {
    title: "Music Jam Session",
    description: "Bring your instrument and join fellow musicians for an informal jam session. All skill levels and genres welcome!",
    tags: ["music", "creative", "social"],
    time_slot: { day: "Friday", start: "19:00", end: "21:00", date: getNextWeekDate(5) },
    required_rep_tier: "Trusted",
    max_participants: 10,
    ai_plan: {
      steps: [
        "Setup: Arrange instruments and sound check",
        "Jam: Collaborative music sessions in rotating groups",
        "Share: Optional solo or group performances"
      ],
      resources: ["Instruments", "Amplifiers", "Music stands"]
    },
  },
  {
    title: "Healthy Cooking Class",
    description: "Master the art of nutritious and delicious cooking! This hands-on class covers meal prep, healthy recipes, and nutrition basics.",
    tags: ["health", "cooking", "education"],
    time_slot: { day: "Tuesday", start: "18:00", end: "20:00", date: getNextWeekDate(2) },
    required_rep_tier: "Established",
    max_participants: 12,
    ai_plan: {
      steps: [
        "Demo: Chef demonstrates key techniques and recipes",
        "Cook: Participants prepare dishes with guidance",
        "Feast: Enjoy the meal together and share recipes"
      ],
      resources: ["Fresh ingredients", "Cooking utensils", "Recipe cards"]
    },
  },
  {
    title: "Advanced AI & Machine Learning Workshop",
    description: "Deep dive into AI/ML concepts including neural networks, model training, and real-world applications. For experienced developers only.",
    tags: ["technology", "AI", "education"],
    time_slot: { day: "Saturday", start: "10:00", end: "14:00", date: getNextWeekDate(6) },
    required_rep_tier: "Certified",
    max_participants: 15,
    ai_plan: {
      steps: [
        "Theory: Overview of advanced ML architectures",
        "Build: Hands-on model training with real datasets",
        "Deploy: Best practices for production ML systems"
      ],
      resources: ["Laptops with GPU", "Cloud credits", "Dataset access"]
    },
  },
  {
    title: "Book Club: Science Fiction",
    description: "Join our monthly book club focusing on science fiction. This month we're discussing 'Project Hail Mary' by Andy Weir.",
    tags: ["reading", "social", "culture"],
    time_slot: { day: "Monday", start: "19:00", end: "20:30", date: getNextWeekDate(1) },
    required_rep_tier: "New",
    max_participants: 15,
    ai_plan: {
      steps: [
        "Gather: Settle in with snacks and beverages",
        "Discuss: Guided conversation about themes and characters",
        "Vote: Choose next month's book together"
      ],
      resources: ["Books", "Discussion questions", "Snacks"]
    },
  },
  {
    title: "Community Leadership Summit",
    description: "Exclusive gathering for certified community leaders to share best practices, plan collaborative initiatives, and strengthen our network.",
    tags: ["leadership", "community", "networking"],
    time_slot: { day: "Sunday", start: "10:00", end: "15:00", date: getNextWeekDate(0) },
    required_rep_tier: "Certified",
    max_participants: 30,
    ai_plan: {
      steps: [
        "Keynote: Inspiring talk from community impact leader",
        "Workshops: Breakout sessions on leadership topics",
        "Planning: Collaborative session for upcoming initiatives"
      ],
      resources: ["Meeting materials", "Lunch provided", "Action plan templates"]
    },
  },
]

// Demo groups
const DEMO_GROUPS = [
  {
    name: "Bay Area Tech Enthusiasts",
    purpose: "A community for tech lovers to learn, share, and build together. Open to all skill levels!",
    type: "open",
    is_certified: false,
    average_rep_score: 45,
  },
  {
    name: "SF Environmental Action",
    purpose: "Dedicated to making San Francisco greener through volunteer projects and advocacy. Members must commit to monthly participation.",
    type: "invite-only",
    is_certified: false,
    average_rep_score: 75,
  },
  {
    name: "Certified Community Leaders",
    purpose: "Elite group of verified community organizers who have demonstrated exceptional leadership and impact.",
    type: "invite-only",
    is_certified: true,
    average_rep_score: 160,
  },
]

// Helper function to get a date in the next week
function getNextWeekDate(dayOfWeek: number): string {
  const today = new Date()
  const currentDay = today.getDay()
  const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7 || 7
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + daysUntilTarget)
  return targetDate.toISOString().split("T")[0]
}

// Seed function
export function seedDemoData() {
  const db = getDb()

  // Check if demo data already exists
  const existingDemoUser = db.prepare("SELECT id FROM profiles WHERE id = ?").get(DEMO_USER.id)
  if (existingDemoUser) {
    console.log("Demo data already seeded, skipping...")
    return
  }

  console.log("Seeding demo data...")

  // Create demo user
  const passwordHash = bcrypt.hashSync(DEMO_USER.password, 10)
  db.prepare(`
    INSERT INTO profiles (id, email, password_hash, full_name, location, interests, reputation_score, reputation_tier, is_verified, completed_opportunities, no_shows)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    DEMO_USER.id,
    DEMO_USER.email,
    passwordHash,
    DEMO_USER.full_name,
    DEMO_USER.location,
    stringifyJsonField(DEMO_USER.interests),
    DEMO_USER.reputation_score,
    DEMO_USER.reputation_tier,
    DEMO_USER.is_verified ? 1 : 0,
    DEMO_USER.completed_opportunities,
    DEMO_USER.no_shows
  )
  console.log("Created demo user:", DEMO_USER.email)

  // Create demo spaces
  for (const space of DEMO_SPACES) {
    const spaceId = randomUUID()
    db.prepare(`
      INSERT INTO spaces (id, name, location, description, capacity, owner_id, requires_approval, amenities, min_reputation_tier, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      spaceId,
      space.name,
      space.location,
      space.description,
      space.capacity,
      DEMO_USER.id,
      space.requires_approval ? 1 : 0,
      stringifyJsonField(space.amenities),
      space.min_reputation_tier,
      1 // is_demo = true
    )
  }
  console.log(`Created ${DEMO_SPACES.length} demo spaces`)

  // Create demo groups
  const groupIds: string[] = []
  for (const group of DEMO_GROUPS) {
    const groupId = randomUUID()
    groupIds.push(groupId)
    db.prepare(`
      INSERT INTO groups (id, name, purpose, organizer_id, type, is_certified, average_rep_score, member_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      groupId,
      group.name,
      group.purpose,
      DEMO_USER.id,
      group.type,
      group.is_certified ? 1 : 0,
      group.average_rep_score,
      1
    )
    // Add demo user as organizer member
    db.prepare(`
      INSERT INTO group_members (id, group_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `).run(randomUUID(), groupId, DEMO_USER.id, "organizer")
  }
  console.log(`Created ${DEMO_GROUPS.length} demo groups`)

  // Create demo opportunities
  let opportunityIndex = 0
  for (const opp of DEMO_OPPORTUNITIES) {
    const oppId = randomUUID()
    // Assign some opportunities to groups
    const groupId = opportunityIndex < 3 ? null : (opportunityIndex < 6 ? groupIds[0] : (opportunityIndex < 9 ? groupIds[1] : groupIds[2]))

    db.prepare(`
      INSERT INTO opportunities (id, title, description, organizer_id, group_id, tags, time_slot, status, required_rep_tier, max_participants, current_participants, ai_plan, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      oppId,
      opp.title,
      opp.description,
      DEMO_USER.id,
      groupId,
      stringifyJsonField(opp.tags),
      stringifyJsonField(opp.time_slot),
      "open",
      opp.required_rep_tier,
      opp.max_participants,
      Math.floor(Math.random() * (opp.max_participants / 2)), // Random current participants
      stringifyJsonField(opp.ai_plan),
      1 // is_demo = true
    )
    opportunityIndex++
  }
  console.log(`Created ${DEMO_OPPORTUNITIES.length} demo opportunities`)

  console.log("Demo data seeding complete!")
}

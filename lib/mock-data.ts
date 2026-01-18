// Mock data simulating the database seed
export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  bio?: string
  location?: string
  skills: string[]
  interests: string[]
  reputation_score: number
  verification_badges: string[]
  created_at: string
}

export interface Group {
  id: string
  name: string
  description: string
  created_by: string
  member_count: number
  created_at: string
}

export interface Space {
  id: string
  owner_id: string
  name: string
  description: string
  space_type: string
  address: string
  city: string
  capacity?: number
  amenities: string[]
  availability_rules: any
  images: string[]
  hourly_rate?: number
  verification_status: string
  created_at: string
  owner?: User
}

export interface Opportunity {
  id: string
  organizer_id: string
  title: string
  description: string
  category: string
  required_skills: string[]
  time_commitment: string
  start_date: string
  end_date?: string
  participant_limit: number
  current_participants: number
  status: string
  space_needed: boolean
  space_requirements?: any
  created_at: string
  organizer?: User
}

export interface Booking {
  id: string
  space_id: string
  opportunity_id?: string
  booker_id: string
  start_time: string
  end_time: string
  status: string
  lock_expires_at?: string
  total_cost?: number
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  opportunity_id?: string
  content: string
  read_at?: string
  created_at: string
  sender?: User
}

// Demo users
export const mockUsers: User[] = [
  {
    id: "1",
    email: "alex@example.com",
    full_name: "Alex Chen",
    avatar_url: "/diverse-person-smiling.png",
    bio: "Community organizer passionate about urban gardening",
    location: "San Francisco, CA",
    skills: ["event planning", "gardening", "community building"],
    interests: ["sustainability", "urban farming", "education"],
    reputation_score: 85,
    verification_badges: ["email_verified", "phone_verified"],
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    email: "maya@example.com",
    full_name: "Maya Rodriguez",
    avatar_url: "/professional-woman.png",
    bio: "Tech educator building coding workshops for youth",
    location: "Oakland, CA",
    skills: ["teaching", "web development", "curriculum design"],
    interests: ["education", "technology", "mentorship"],
    reputation_score: 92,
    verification_badges: ["email_verified", "phone_verified", "background_check"],
    created_at: "2024-01-10T10:00:00Z",
  },
  {
    id: "3",
    email: "jordan@example.com",
    full_name: "Jordan Kim",
    avatar_url: "/person-creative.jpg",
    bio: "Artist creating inclusive public art installations",
    location: "Berkeley, CA",
    skills: ["painting", "sculpture", "community engagement"],
    interests: ["art", "social justice", "public spaces"],
    reputation_score: 78,
    verification_badges: ["email_verified"],
    created_at: "2024-02-01T10:00:00Z",
  },
  {
    id: "4",
    email: "sam@example.com",
    full_name: "Sam Patel",
    avatar_url: "/person-friendly.jpg",
    bio: "Musician organizing community concerts and music education",
    location: "San Francisco, CA",
    skills: ["music production", "teaching", "event coordination"],
    interests: ["music", "education", "community"],
    reputation_score: 88,
    verification_badges: ["email_verified", "phone_verified"],
    created_at: "2024-01-20T10:00:00Z",
  },
  {
    id: "5",
    email: "riley@example.com",
    full_name: "Riley Thompson",
    avatar_url: "/person-happy.jpg",
    bio: "Fitness instructor bringing free yoga to public spaces",
    location: "Oakland, CA",
    skills: ["yoga instruction", "wellness coaching", "group facilitation"],
    interests: ["health", "mindfulness", "accessibility"],
    reputation_score: 90,
    verification_badges: ["email_verified", "phone_verified"],
    created_at: "2024-01-25T10:00:00Z",
  },
  {
    id: "6",
    email: "casey@example.com",
    full_name: "Casey Wu",
    avatar_url: "/person-glasses.png",
    bio: "Environmental scientist organizing climate action workshops",
    location: "Berkeley, CA",
    skills: ["research", "public speaking", "workshop facilitation"],
    interests: ["climate", "sustainability", "education"],
    reputation_score: 95,
    verification_badges: ["email_verified", "phone_verified", "background_check"],
    created_at: "2024-01-05T10:00:00Z",
  },
]

// Demo groups
export const mockGroups: Group[] = [
  {
    id: "1",
    name: "Urban Gardeners Network",
    description: "Community of gardeners transforming urban spaces",
    created_by: "1",
    member_count: 145,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Bay Area Tech Educators",
    description: "Teaching technology skills to underserved communities",
    created_by: "2",
    member_count: 89,
    created_at: "2024-01-20T10:00:00Z",
  },
  {
    id: "3",
    name: "Public Art Collective",
    description: "Creating accessible art experiences for everyone",
    created_by: "3",
    member_count: 67,
    created_at: "2024-02-01T10:00:00Z",
  },
]

// Demo spaces
export const mockSpaces: Space[] = [
  {
    id: "1",
    owner_id: "1",
    name: "Sunshine Community Garden",
    description:
      "Beautiful outdoor garden space perfect for workshops, gatherings, and educational events. Features raised beds, seating areas, and tool storage.",
    space_type: "outdoor",
    address: "123 Garden St",
    city: "San Francisco",
    capacity: 30,
    amenities: ["seating", "water access", "tools available", "shade structure"],
    availability_rules: { days: ["weekends", "weekday evenings"], hours: "9am-7pm" },
    images: ["/community-garden.png"],
    hourly_rate: 0,
    verification_status: "verified",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    owner_id: "2",
    name: "TechHub Classroom",
    description:
      "Modern classroom with computers, projector, and high-speed internet. Ideal for coding workshops and tech education programs.",
    space_type: "indoor",
    address: "456 Tech Ave",
    city: "Oakland",
    capacity: 25,
    amenities: ["WiFi", "computers", "projector", "whiteboard", "AC"],
    availability_rules: { days: ["all week"], hours: "9am-9pm" },
    images: ["/modern-classroom.jpg"],
    hourly_rate: 35,
    verification_status: "verified",
    created_at: "2024-01-16T10:00:00Z",
  },
  {
    id: "3",
    owner_id: "3",
    name: "Gallery Wall Studio",
    description:
      "Bright studio space with natural light and wall space for installations. Perfect for art workshops and creative sessions.",
    space_type: "indoor",
    address: "789 Art Blvd",
    city: "Berkeley",
    capacity: 20,
    amenities: ["natural light", "wall space", "tables", "art supplies storage"],
    availability_rules: { days: ["weekdays"], hours: "10am-6pm" },
    images: ["/art-studio-bright.jpg"],
    hourly_rate: 25,
    verification_status: "verified",
    created_at: "2024-01-17T10:00:00Z",
  },
  {
    id: "4",
    owner_id: "4",
    name: "Music Rehearsal Room",
    description:
      "Soundproofed room with instruments and audio equipment. Great for music lessons and small performances.",
    space_type: "indoor",
    address: "321 Sound St",
    city: "San Francisco",
    capacity: 15,
    amenities: ["soundproof", "instruments", "audio equipment", "AC"],
    availability_rules: { days: ["all week"], hours: "12pm-10pm" },
    images: ["/music-studio.png"],
    hourly_rate: 40,
    verification_status: "verified",
    created_at: "2024-01-18T10:00:00Z",
  },
  {
    id: "5",
    owner_id: "5",
    name: "Park Pavilion",
    description:
      "Covered outdoor space in a popular park. Excellent for fitness classes, yoga, and community gatherings.",
    space_type: "outdoor",
    address: "654 Park Lane",
    city: "Oakland",
    capacity: 40,
    amenities: ["covered", "open air", "nearby parking", "restrooms"],
    availability_rules: { days: ["weekends", "early mornings"], hours: "7am-11am, 5pm-8pm" },
    images: ["/park-pavilion.jpg"],
    hourly_rate: 0,
    verification_status: "verified",
    created_at: "2024-01-19T10:00:00Z",
  },
  {
    id: "6",
    owner_id: "6",
    name: "Science Lab Space",
    description: "Equipped lab for hands-on science education and environmental workshops. Safety equipment included.",
    space_type: "indoor",
    address: "987 Science Dr",
    city: "Berkeley",
    capacity: 20,
    amenities: ["lab equipment", "safety gear", "WiFi", "whiteboard", "AC"],
    availability_rules: { days: ["weekdays"], hours: "9am-5pm" },
    images: ["/science-lab.png"],
    hourly_rate: 45,
    verification_status: "verified",
    created_at: "2024-01-20T10:00:00Z",
  },
  {
    id: "7",
    owner_id: "1",
    name: "Community Kitchen",
    description: "Commercial kitchen available for cooking classes and food-based community projects.",
    space_type: "indoor",
    address: "147 Kitchen Way",
    city: "San Francisco",
    capacity: 12,
    amenities: ["commercial kitchen", "cooking equipment", "dining area", "storage"],
    availability_rules: { days: ["weekends"], hours: "10am-8pm" },
    images: ["/community-kitchen.png"],
    hourly_rate: 50,
    verification_status: "verified",
    created_at: "2024-01-21T10:00:00Z",
  },
  {
    id: "8",
    owner_id: "2",
    name: "Makerspace Workshop",
    description: "3D printers, laser cutters, and tools for hands-on making and prototyping workshops.",
    space_type: "indoor",
    address: "258 Maker St",
    city: "Oakland",
    capacity: 15,
    amenities: ["3D printers", "laser cutter", "hand tools", "work benches", "WiFi"],
    availability_rules: { days: ["all week"], hours: "10am-8pm" },
    images: ["/makerspace.jpg"],
    hourly_rate: 55,
    verification_status: "verified",
    created_at: "2024-01-22T10:00:00Z",
  },
  {
    id: "9",
    owner_id: "4",
    name: "Dance Studio",
    description: "Spacious studio with mirrors and sound system for dance classes and movement workshops.",
    space_type: "indoor",
    address: "369 Dance Ave",
    city: "San Francisco",
    capacity: 30,
    amenities: ["mirrors", "sound system", "sprung floor", "AC", "changing rooms"],
    availability_rules: { days: ["all week"], hours: "8am-10pm" },
    images: ["/dance-studio.jpg"],
    hourly_rate: 60,
    verification_status: "verified",
    created_at: "2024-01-23T10:00:00Z",
  },
  {
    id: "10",
    owner_id: "5",
    name: "Rooftop Terrace",
    description: "Open rooftop with city views, perfect for sunset yoga, meditation, and small gatherings.",
    space_type: "outdoor",
    address: "741 Skyline Blvd",
    city: "Oakland",
    capacity: 25,
    amenities: ["city views", "seating", "lighting", "nearby restrooms"],
    availability_rules: { days: ["all week"], hours: "6am-9pm" },
    images: ["/rooftop-terrace.png"],
    hourly_rate: 30,
    verification_status: "verified",
    created_at: "2024-01-24T10:00:00Z",
  },
]

// Demo opportunities
export const mockOpportunities: Opportunity[] = [
  {
    id: "1",
    organizer_id: "1",
    title: "Urban Garden Workshop Series",
    description:
      "Join us for a 4-week hands-on workshop learning organic gardening, composting, and sustainable growing practices. Perfect for beginners!",
    category: "education",
    required_skills: [],
    time_commitment: "4 weeks, 2 hours/week",
    start_date: "2024-03-15T10:00:00Z",
    end_date: "2024-04-12T12:00:00Z",
    participant_limit: 20,
    current_participants: 12,
    status: "active",
    space_needed: true,
    space_requirements: { type: "outdoor", capacity: 20 },
    created_at: "2024-02-01T10:00:00Z",
  },
  {
    id: "2",
    organizer_id: "2",
    title: "Free Coding Bootcamp for Teens",
    description:
      "Intensive 8-week program teaching web development fundamentals. Build real projects and learn industry tools. All materials provided free.",
    category: "education",
    required_skills: ["teaching", "mentorship"],
    time_commitment: "8 weeks, 6 hours/week",
    start_date: "2024-03-20T14:00:00Z",
    end_date: "2024-05-15T17:00:00Z",
    participant_limit: 15,
    current_participants: 8,
    status: "active",
    space_needed: true,
    space_requirements: { type: "indoor", capacity: 15, needs_computers: true },
    created_at: "2024-02-02T10:00:00Z",
  },
  {
    id: "3",
    organizer_id: "3",
    title: "Community Mural Project",
    description:
      "Collaborative mural painting celebrating neighborhood diversity. All skill levels welcome - we provide training, supplies, and snacks!",
    category: "creative",
    required_skills: [],
    time_commitment: "3 weekends, 4 hours each",
    start_date: "2024-03-23T10:00:00Z",
    end_date: "2024-04-07T14:00:00Z",
    participant_limit: 25,
    current_participants: 18,
    status: "active",
    space_needed: false,
    created_at: "2024-02-03T10:00:00Z",
  },
  {
    id: "4",
    organizer_id: "4",
    title: "Youth Music Mentorship Program",
    description:
      "Connect with young musicians to teach instruments, songwriting, or music production. Help nurture the next generation of artists!",
    category: "education",
    required_skills: ["music", "teaching"],
    time_commitment: "Ongoing, 2 hours/week",
    start_date: "2024-03-18T16:00:00Z",
    participant_limit: 10,
    current_participants: 6,
    status: "active",
    space_needed: true,
    space_requirements: { type: "indoor", capacity: 10, needs_instruments: true },
    created_at: "2024-02-04T10:00:00Z",
  },
  {
    id: "5",
    organizer_id: "5",
    title: "Free Community Yoga Classes",
    description:
      "Donation-based outdoor yoga every Saturday morning. All levels welcome. Bring your own mat or borrow one of ours.",
    category: "wellness",
    required_skills: [],
    time_commitment: "Weekly, 1 hour",
    start_date: "2024-03-16T08:00:00Z",
    participant_limit: 30,
    current_participants: 22,
    status: "active",
    space_needed: true,
    space_requirements: { type: "outdoor", capacity: 30 },
    created_at: "2024-02-05T10:00:00Z",
  },
  {
    id: "6",
    organizer_id: "6",
    title: "Climate Action Workshop",
    description:
      "Interactive workshop on local climate solutions. Learn about sustainability projects you can start in your neighborhood.",
    category: "education",
    required_skills: [],
    time_commitment: "Single session, 3 hours",
    start_date: "2024-03-30T14:00:00Z",
    participant_limit: 25,
    current_participants: 15,
    status: "active",
    space_needed: true,
    space_requirements: { type: "indoor", capacity: 25 },
    created_at: "2024-02-06T10:00:00Z",
  },
  {
    id: "7",
    organizer_id: "1",
    title: "Community Composting Initiative",
    description:
      "Help set up neighborhood composting stations and teach residents how to reduce food waste. Training provided!",
    category: "environment",
    required_skills: [],
    time_commitment: "6 weeks, 3 hours/week",
    start_date: "2024-03-25T10:00:00Z",
    participant_limit: 12,
    current_participants: 7,
    status: "active",
    space_needed: false,
    created_at: "2024-02-07T10:00:00Z",
  },
  {
    id: "8",
    organizer_id: "2",
    title: "Tech Resume Workshop",
    description:
      "Learn to create compelling tech resumes and LinkedIn profiles. Practice interviews and get personalized feedback.",
    category: "career",
    required_skills: ["tech industry experience", "mentorship"],
    time_commitment: "2 sessions, 2 hours each",
    start_date: "2024-03-28T18:00:00Z",
    participant_limit: 20,
    current_participants: 14,
    status: "active",
    space_needed: true,
    space_requirements: { type: "indoor", capacity: 20 },
    created_at: "2024-02-08T10:00:00Z",
  },
  {
    id: "9",
    organizer_id: "3",
    title: "Public Sculpture Installation",
    description:
      "Collaborative creation of temporary sculptures for public spaces. All materials provided. Great for portfolios!",
    category: "creative",
    required_skills: [],
    time_commitment: "4 weekends, 5 hours each",
    start_date: "2024-04-06T10:00:00Z",
    participant_limit: 15,
    current_participants: 9,
    status: "active",
    space_needed: true,
    space_requirements: { type: "outdoor", capacity: 15 },
    created_at: "2024-02-09T10:00:00Z",
  },
  {
    id: "10",
    organizer_id: "5",
    title: "Mindfulness Meditation Circle",
    description:
      "Weekly guided meditation and mindfulness practice. Create a supportive community for mental wellness.",
    category: "wellness",
    required_skills: [],
    time_commitment: "Weekly, 1 hour",
    start_date: "2024-03-17T18:00:00Z",
    participant_limit: 20,
    current_participants: 11,
    status: "active",
    space_needed: true,
    space_requirements: { type: "indoor", capacity: 20 },
    created_at: "2024-02-10T10:00:00Z",
  },
]

// Get current user (for demo, we'll use user 1)
export const getCurrentUser = (): User => mockUsers[0]

// Add owner details to spaces
export const getSpacesWithOwners = (): Space[] => {
  return mockSpaces.map((space) => ({
    ...space,
    owner: mockUsers.find((u) => u.id === space.owner_id),
  }))
}

// Add organizer details to opportunities
export const getOpportunitiesWithOrganizers = (): Opportunity[] => {
  return mockOpportunities.map((opp) => ({
    ...opp,
    organizer: mockUsers.find((u) => u.id === opp.organizer_id),
  }))
}

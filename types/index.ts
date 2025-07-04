export interface User {
  id: string
  email: string
  userType: "patient" | "professional"
  isVerified?: boolean
  subscriptionTier?: "basic" | "pro" | "practice"
  createdAt: Date
  updatedAt: Date
}

export interface Article {
  id: string
  title: string
  slug: string
  description: string
  content: string
  category: string
  readingLevel: "basic" | "advanced"
  readTime: number
  lastMedicallyReviewed: Date
  references: Reference[]
  tags: string[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Reference {
  id: string
  title: string
  authors: string[]
  journal?: string
  year: number
  url?: string
  doi?: string
}

export interface ChatSession {
  id: string
  userId: string
  sessionId: string
  createdAt: Date
  expiresAt: Date
  lastActivity: Date
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: "user" | "assistant"
  content: string
  pageContext?: PageContext
  createdAt: Date
}

export interface PageContext {
  title: string
  category: string
  content?: string
  url?: string
}

export interface PracticeProfile {
  id: string
  name: string
  slug: string
  address: Address
  location: {
    lat: number
    lng: number
  }
  contact: {
    phone: string
    email: string
    website?: string
  }
  services: string[]
  nhsAccepted: boolean
  privateAccepted: boolean
  accessibility: string[]
  openingHours: OpeningHours
  photos: string[]
  teamMembers: TeamMember[]
  claimedBy?: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  street: string
  city: string
  postcode: string
  country: string
}

export interface OpeningHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export interface DayHours {
  isOpen: boolean
  open?: string
  close?: string
  breaks?: TimeSlot[]
}

export interface TimeSlot {
  start: string
  end: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  qualifications: string[]
  bio?: string
  photo?: string
  gdcNumber?: string
}

export interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  type: "article" | "procedure" | "glossary" | "practice"
  url: string
  relevanceScore: number
}

export interface SearchFilters {
  categories: string[]
  readingLevel: "all" | "basic" | "advanced"
  contentType: "all" | "article" | "procedure" | "glossary"
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface ProfessionalVerification {
  id: string
  userId: string
  gdcNumber: string
  verificationStatus: "pending" | "approved" | "rejected"
  verifiedAt?: Date
  verifiedBy?: string
  documents: string[]
  createdAt: Date
}

export interface Bookmark {
  id: string
  userId: string
  articleSlug: string
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message?: string
  data?: Record<string, any>
  read: boolean
  createdAt: Date
}

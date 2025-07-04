export const DENTAL_CATEGORIES = [
  {
    id: "dental-problems",
    name: "Dental Problems",
    description: "Common dental issues and their causes",
    color: "bg-red-500",
  },
  {
    id: "treatments",
    name: "Treatments",
    description: "Dental procedures and treatment options",
    color: "bg-blue-500",
  },
  {
    id: "prevention",
    name: "Prevention",
    description: "Maintaining good oral health",
    color: "bg-green-500",
  },
  {
    id: "oral-surgery",
    name: "Oral Surgery",
    description: "Surgical procedures and recovery",
    color: "bg-purple-500",
  },
  {
    id: "cosmetic-dentistry",
    name: "Cosmetic Dentistry",
    description: "Improving your smile",
    color: "bg-pink-500",
  },
  {
    id: "pediatric-dentistry",
    name: "Pediatric Dentistry",
    description: "Dental care for children",
    color: "bg-yellow-500",
  },
] as const

export const SUBSCRIPTION_TIERS = {
  basic: {
    name: "Basic",
    price: 0,
    features: [
      "Access to all dental content",
      "Basic search functionality",
      "Save up to 10 bookmarks",
      "AI assistant (limited)",
    ],
  },
  pro: {
    name: "Professional",
    price: 9.99,
    features: [
      "Everything in Basic",
      "Unlimited bookmarks",
      "Advanced search filters",
      "Unlimited AI assistant",
      "Consent form templates",
      "Patient handouts",
      "Priority support",
    ],
  },
  practice: {
    name: "Practice",
    price: 29.99,
    features: [
      "Everything in Pro",
      "Multiple team members",
      "Practice listing management",
      "Analytics dashboard",
      "Custom branding",
      "API access",
    ],
  },
} as const

export const GDC_REGEX = /^\d{7}$/

export const CHAT_SESSION_EXPIRY_DAYS = 180

export const MAX_CHAT_HISTORY = 50

export const SEARCH_DEBOUNCE_MS = 300

export const DEFAULT_SEARCH_LIMIT = 20

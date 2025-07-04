import { Database } from './database'

// Base profile type from database
export type Profile = Database['public']['Tables']['profiles']['Row']

// Extended user profile with computed properties
export interface UserProfile extends Profile {
  // Computed display name
  display_name: string
  // Whether the user is verified as a professional
  is_verified_professional: boolean
  // Full name convenience getter
  full_name: string | null
}

// Helper to convert database profile to UserProfile
export function toUserProfile(profile: Profile): UserProfile {
  const full_name = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(' ') || null
    
  return {
    ...profile,
    display_name: full_name || profile.email.split('@')[0] || 'User',
    is_verified_professional: profile.user_type === 'professional',
    full_name,
  }
}

// User role types
export type UserRole = 'admin' | 'professional' | 'patient'

// Chat message types matching database schema
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row']

// Professional verification type
export type ProfessionalVerification = Database['public']['Tables']['professional_verifications']['Row']
import { supabaseAdmin } from './supabase'
import { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

/**
 * Sync user profile with Supabase when they sign up or update their profile
 */
export async function syncUserProfile(clerkUser: {
  id: string
  emailAddresses: Array<{ emailAddress: string }>
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  publicMetadata?: {
    userType?: 'patient' | 'professional'
  }
}) {
  try {
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      throw new Error('User must have an email address')
    }

    const userType = clerkUser.publicMetadata?.userType || 'patient'

    const profileData: ProfileInsert = {
      clerk_id: clerkUser.id,
      email,
      user_type: userType,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      avatar_url: clerkUser.imageUrl,
    }

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('clerk_id', clerkUser.id)
      .single()

    if (existingProfile) {
      // Update existing profile
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', clerkUser.id)

      if (error) {
        throw error
      }

      console.log('User profile updated:', clerkUser.id)
    } else {
      // Create new profile
      const { error } = await supabaseAdmin
        .from('profiles')
        .insert([profileData])

      if (error) {
        throw error
      }

      console.log('User profile created:', clerkUser.id)

      // Create default user preferences
      await createDefaultUserPreferences(clerkUser.id)
    }

    return { success: true }
  } catch (error) {
    console.error('Error syncing user profile:', error)
    throw error
  }
}

/**
 * Create default user preferences for new users
 */
async function createDefaultUserPreferences(clerkId: string) {
  try {
    // Get the user's database ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', clerkId)
      .single()

    if (!profile) {
      throw new Error('Profile not found')
    }

    const { error } = await supabaseAdmin
      .from('user_preferences')
      .insert([
        {
          user_id: profile.id,
          reading_level: 'basic',
          email_notifications: true,
          push_notifications: false,
          marketing_emails: false,
          theme: 'light',
          language: 'en-GB',
        },
      ])

    if (error) {
      throw error
    }

    console.log('Default preferences created for user:', clerkId)
  } catch (error) {
    console.error('Error creating default preferences:', error)
    // Don't throw - this is not critical
  }
}

/**
 * Delete user profile when they delete their account
 */
export async function deleteUserProfile(clerkId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('clerk_id', clerkId)

    if (error) {
      throw error
    }

    console.log('User profile deleted:', clerkId)
    return { success: true }
  } catch (error) {
    console.error('Error deleting user profile:', error)
    throw error
  }
}

/**
 * Get user profile from Supabase
 */
export async function getUserProfile(clerkId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('clerk_id', clerkId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}
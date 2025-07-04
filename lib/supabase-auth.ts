import { createClient } from '@supabase/supabase-js'
import { auth, currentUser } from '@clerk/nextjs/server'
import { Database } from '@/types/database'
import { toUserProfile } from '@/types/user'
import { supabaseAdmin } from './supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Create a Supabase client for use in Server Components with Clerk authentication
 * This client will pass the Clerk JWT token to Supabase for RLS
 */
export async function createServerSupabaseClient() {
  try {
    const { getToken } = await auth()
    
    // Get the Clerk session token - this might fail if template isn't configured
    const token = await getToken({ template: 'supabase' }).catch((error) => {
      console.warn(
        'Failed to get Clerk JWT token. Make sure the "supabase" JWT template is configured in your Clerk dashboard.',
        'Visit: https://dashboard.clerk.com/apps/[YOUR_APP_ID]/jwt-templates',
        'Error:', error.message
      )
      return null
    })
    
    if (!token) {
      // Return a client without custom auth if no token
      return createClient<Database>(supabaseUrl, supabaseAnonKey)
    }
    
    // Create a client with the Clerk token
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
  } catch (error) {
    // If auth fails entirely, return anonymous client
    console.warn('Auth failed in createServerSupabaseClient:', error)
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
}

/**
 * Create a Supabase client for use in API routes with Clerk authentication
 * This function extracts the token from the request context
 */
export async function createRouteSupabaseClient() {
  try {
    const { getToken } = await auth()
    
    // Get the Clerk session token - this might fail if template isn't configured
    const token = await getToken({ template: 'supabase' }).catch((error) => {
      console.warn(
        'Failed to get Clerk JWT token. Make sure the "supabase" JWT template is configured in your Clerk dashboard.',
        'Visit: https://dashboard.clerk.com/apps/[YOUR_APP_ID]/jwt-templates',
        'Error:', error.message
      )
      return null
    })
    
    if (!token) {
      // Return a client without custom auth if no token
      return createClient<Database>(supabaseUrl, supabaseAnonKey)
    }
    
    // Create a client with the Clerk token
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
  } catch (error) {
    // If auth fails entirely, return anonymous client
    console.warn('Auth failed in createRouteSupabaseClient:', error)
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
}

/**
 * Get the current user's profile from Supabase using Clerk ID
 */
export async function getCurrentUserProfile() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }
  
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_id', userId)
    .single()
  
  if (error) {
    // If profile doesn't exist, create it
    if (error.code === 'PGRST116') {
      const user = await currentUser()
      if (!user) {
        return null
      }
      
      // Use admin client to bypass RLS for profile creation
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          clerk_id: userId,
          email: user.emailAddresses[0]?.emailAddress || '',
          user_type: 'patient', // Default to patient
          first_name: user.firstName || null,
          last_name: user.lastName || null,
          avatar_url: user.imageUrl || null,
        })
        .select()
        .single()
      
      if (createError) {
        // If it's a duplicate key error, try to fetch the existing profile
        if (createError.code === '23505') {
          const { data: existingProfile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('clerk_id', userId)
            .single()
          
          if (!fetchError && existingProfile) {
            return toUserProfile(existingProfile)
          }
          
          console.error('Failed to fetch existing profile after duplicate key error:', fetchError)
        }
        
        // Log specific error types for better debugging
        if (createError.code === '42501') {
          console.error(
            'Row Level Security (RLS) policy violation when creating user profile.',
            'Make sure the service role key is being used for profile creation.',
            createError
          )
        } else if (createError.code === 'PGRST204') {
          console.error(
            'Database schema mismatch. The profiles table may be missing required columns.',
            'Required columns: clerk_id, email, user_type, first_name, last_name, avatar_url',
            createError
          )
        } else {
          console.error('Error creating user profile:', createError)
        }
        
        return null
      }
      
      return toUserProfile(newProfile)
    }
    
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return toUserProfile(data)
}
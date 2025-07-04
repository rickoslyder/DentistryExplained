import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { Database } from '@/types/database'

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
    const token = await getToken({ template: 'supabase' }).catch(() => null)
    
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
    const token = await getToken({ template: 'supabase' }).catch(() => null)
    
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
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return data
}
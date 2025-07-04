'use client'

import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs'
import { Database } from '@/types/database'
import { useMemo } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Hook to create a Supabase client with Clerk authentication
 * Use this in client components
 */
export function useSupabaseClient() {
  const { getToken } = useAuth()
  
  return useMemo(() => {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken({ template: 'supabase' })
          
          const headers = new Headers(options.headers)
          if (token) {
            headers.set('Authorization', `Bearer ${token}`)
          }
          
          return fetch(url, {
            ...options,
            headers,
          })
        },
      },
    })
  }, [getToken])
}

/**
 * Create a Supabase client without authentication
 * Use this for public queries that don't need RLS
 */
export const supabasePublic = createClient<Database>(supabaseUrl, supabaseAnonKey)
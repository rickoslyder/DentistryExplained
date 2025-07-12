import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { cacheManager } from '@/lib/cache'

const CACHE_KEY = 'glossary:all-terms'
const CACHE_TTL = 3600 // 1 hour

export async function GET(request: NextRequest) {
  try {
    // Try to get from cache first
    const cached = await cacheManager.get(CACHE_KEY)
    if (cached) {
      return NextResponse.json({ terms: cached, cached: true })
    }

    const supabase = await createServerSupabaseClient()
    
    // Fetch all glossary terms
    const { data: terms, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .order('term', { ascending: true })
    
    if (error) {
      console.error('Error fetching glossary terms:', error)
      return NextResponse.json({ error: 'Failed to fetch glossary terms' }, { status: 500 })
    }
    
    // Cache the results
    if (terms && terms.length > 0) {
      await cacheManager.set(CACHE_KEY, terms, {
        ttl: CACHE_TTL,
        tags: ['glossary', 'terms']
      })
    }
    
    return NextResponse.json({ terms: terms || [] })
    
  } catch (error) {
    console.error('Glossary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
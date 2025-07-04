import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.length < 2) {
      return NextResponse.json({ terms: [] })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Search glossary terms using full-text search
    const { data: terms, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: 'english'
      })
      .order('term', { ascending: true })
      .limit(50)
    
    if (error) {
      console.error('Glossary search error:', error)
      // Fallback to basic search if full-text search fails
      const { data: fallbackTerms, error: fallbackError } = await supabase
        .from('glossary_terms')
        .select('*')
        .or(`term.ilike.%${query}%,definition.ilike.%${query}%`)
        .order('term', { ascending: true })
        .limit(50)
      
      if (fallbackError) {
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
      }
      
      return NextResponse.json({ terms: fallbackTerms || [] })
    }
    
    return NextResponse.json({ terms: terms || [] })
    
  } catch (error) {
    console.error('Glossary search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
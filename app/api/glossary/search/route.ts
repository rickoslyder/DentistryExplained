import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, validateQueryParams, mapDatabaseError } from '@/lib/api-errors'
import { withOptionalAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'

// Schema for glossary search
const glossarySearchSchema = z.object({
  q: z.string().min(2).optional(),
})

const glossarySearchHandler = compose(
  withRateLimit(60000, 100), // 100 requests per minute
  withOptionalAuth
)(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url)
  
  // Validate query parameters
  const { data: params, error: validationError } = validateQueryParams(
    searchParams,
    glossarySearchSchema
  )
  
  if (validationError) {
    return validationError
  }
  
  const query = params.q
  
  if (!query || query.length < 2) {
    return NextResponse.json({ 
      terms: [],
      query: query || '',
      total: 0
    })
  }
  
  const supabase = context.supabase!
  
  // Search glossary terms using full-text search
  const { data: terms, error } = await supabase
    .from('glossary_terms')
    .select('*, count:id.count()', { count: 'exact', head: false })
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english'
    })
    .order('term', { ascending: true })
    .limit(50)
  
  if (error) {
    console.error('[Glossary] Full-text search error:', error)
    
    // Fallback to basic search if full-text search fails
    try {
      const { data: fallbackTerms, error: fallbackError, count } = await supabase
        .from('glossary_terms')
        .select('*, count:id.count()', { count: 'exact', head: false })
        .or(`term.ilike.%${query}%,definition.ilike.%${query}%`)
        .order('term', { ascending: true })
        .limit(50)
      
      if (fallbackError) {
        return mapDatabaseError(fallbackError)
      }
      
      return NextResponse.json({ 
        terms: fallbackTerms || [],
        query: query,
        total: count || 0,
        searchType: 'fallback',
        requestId: context.requestId
      })
    } catch (fallbackError) {
      return ApiErrors.internal(fallbackError, 'glossary search fallback')
    }
  }
  
  return NextResponse.json({ 
    terms: terms || [],
    query: query,
    total: terms?.length || 0,
    searchType: 'full-text',
    requestId: context.requestId
  })
})

export const GET = glossarySearchHandler
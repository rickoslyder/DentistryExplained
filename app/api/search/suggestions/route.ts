import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, validateQueryParams, mapDatabaseError } from '@/lib/api-errors'
import { withOptionalAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'

// Schema for suggestions query
const suggestionsSchema = z.object({
  q: z.string().min(1).optional(),
})

const suggestionsHandler = compose(
  withRateLimit(60000, 200), // 200 requests per minute
  withOptionalAuth
)(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url)
  
  // Validate query parameters
  const { data: params, error: validationError } = validateQueryParams(
    searchParams,
    suggestionsSchema
  )
  
  if (validationError) {
    return validationError
  }
  
  const query = params.q
  
  if (!query || query.length < 1) {
    return NextResponse.json({ 
      suggestions: [],
      query: query || ''
    })
  }
  
  const supabase = context.supabase!
  
  // Get search suggestions using our PostgreSQL function
  const { data: suggestions, error } = await supabase
    .rpc('get_search_suggestions', {
      partial_query: query,
      suggestion_limit: 8
    })
  
  if (error) {
    return mapDatabaseError(error)
  }
  
  return NextResponse.json({ 
    suggestions: suggestions || [],
    query: query,
    requestId: context.requestId
  })
})

export const GET = suggestionsHandler
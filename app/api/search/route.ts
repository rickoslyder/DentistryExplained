import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withOptionalAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { rateLimiters } from '@/lib/rate-limiter'
import { z } from 'zod'
import { serverAnalytics } from '@/lib/analytics-server'
import { cacheManager, createCacheKey } from '@/lib/cache'

// Validation schema for search parameters
const searchParamsSchema = z.object({
  q: z.string().min(1).max(100),
  category: z.string().nullable().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0)
})

const searchHandler = compose(
  withOptionalAuth
)(async (request: NextRequest, context) => {
  // Apply search-specific rate limiting
  return await rateLimiters.search(request, async () => {
    const requestId = getRequestId(request)
    
    try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const params = searchParamsSchema.parse({
      q: searchParams.get('q'),
      category: searchParams.get('category') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined
    })
    
    const { q: query, category, limit, offset } = params
    
    // Return empty results for short queries
    if (query.length < 2) {
      return NextResponse.json({ 
        results: [], 
        suggestions: [],
        totalResults: 0,
        hasMore: false
      })
    }
    
    const supabase = context.supabase!
    
    // Create cache key for this search
    const cacheKey = createCacheKey('search', query.toLowerCase(), category || 'all', limit, offset)
    const CACHE_TTL = 300 // 5 minutes for search results
    
    // Try to get cached results
    const cached = await cacheManager.get(cacheKey)
    let searchResults
    let fromCache = false
    
    if (cached) {
      searchResults = cached
      fromCache = true
    } else {
      // Use our PostgreSQL full-text search function
      const { data, error: searchError } = await supabase
        .rpc('search_content', {
          search_query: query,
          search_category: category && category !== 'all' ? category : null,
          result_limit: limit,
          result_offset: offset
        })
      
      if (searchError) {
        return ApiErrors.fromDatabaseError(searchError, 'search_content', requestId)
      }
      
      searchResults = data
      
      // Cache the results if we got any
      if (searchResults && searchResults.length > 0) {
        await cacheManager.set(cacheKey, searchResults, {
          ttl: CACHE_TTL,
          tags: ['search', `search:${category || 'all'}`]
        })
      }
    }
    
    // Get search suggestions for autocomplete
    let suggestions = []
    try {
      const { data, error } = await supabase
        .rpc('get_search_suggestions', {
          partial_query: query,
          suggestion_limit: 5
        })
      
      if (!error && data) {
        suggestions = data
      }
    } catch (error) {
      // Log but don't fail the request if suggestions fail
      console.error(`[Search ${requestId}] Suggestions error:`, error)
    }
    
    // Track the search query for analytics (non-blocking) - only if not from cache
    if (!fromCache && context.userId) {
      supabase
        .from('search_queries')
        .insert({
          query: query,
          results_count: searchResults?.length || 0,
          session_id: request.headers.get('x-session-id') || null,
          user_id: context.userId,
          category: category
        })
        .then(({ error }) => {
          if (error) {
            console.error(`[Search ${requestId}] Tracking error:`, error)
          }
        })
        .catch(error => {
          console.error(`[Search ${requestId}] Tracking error:`, error)
        })
    }
    
    // Transform results to match frontend expectations
    const transformedResults = searchResults?.map(result => ({
      id: result.id,
      title: result.title,
      description: result.excerpt,
      type: result.type,
      category: result.category,
      slug: result.slug,
      relevance: result.rank
    })) || []
    
    // Track server-side search analytics (non-blocking)
    serverAnalytics.trackSearch(
      query,
      transformedResults.length,
      'article',
      context.userId
    ).catch(err => console.error('[Analytics] Failed to track search:', err))
    
    return NextResponse.json({ 
      results: transformedResults,
      suggestions: suggestions,
      totalResults: transformedResults.length,
      hasMore: transformedResults.length === limit
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.fromValidationError(error, requestId)
    }
    return ApiErrors.internal(error, 'search', requestId)
  }
  })
})

export const GET = searchHandler

// Schema for click tracking
const clickTrackingSchema = z.object({
  query: z.string().min(1),
  resultId: z.string().uuid(),
  resultType: z.enum(['article', 'glossary', 'practice']),
  position: z.number().min(0).optional()
})

const clickTrackingHandler = compose(
  withRateLimit(60000, 200), // 200 requests per minute
  withOptionalAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const body = await request.json()
    
    // Validate request body
    const params = clickTrackingSchema.parse(body)
    const { query, resultId, resultType, position } = params
    
    const supabase = context.supabase!
    
    // Update the most recent search query record with the clicked result
    const { error } = await supabase
      .from('search_queries')
      .update({
        clicked_result_id: resultId,
        clicked_result_type: resultType
      })
      .eq('query', query)
      .eq('user_id', context.userId || null)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'update_search_click', requestId)
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Click tracked successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.fromValidationError(error, requestId)
    }
    return ApiErrors.internal(error, 'click_tracking', requestId)
  }
})

export const POST = clickTrackingHandler
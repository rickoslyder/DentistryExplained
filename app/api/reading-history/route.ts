import { NextRequest, NextResponse } from 'next/server'
import { ApiErrors, validateRequestBody, validateQueryParams, paginationSchema, mapDatabaseError } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'

// Schema for updating reading history
const updateReadingHistorySchema = z.object({
  articleSlug: z.string().min(1).max(255),
  articleTitle: z.string().min(1).max(500),
  articleCategory: z.string().optional(),
  durationSeconds: z.number().int().min(0).default(0),
  scrollPercentage: z.number().int().min(0).max(100).default(0),
  completed: z.boolean().default(false),
})

const updateReadingHistoryHandler = compose(
  withRateLimit(60000, 120), // 120 updates per minute (for real-time tracking)
  withAuth
)(async (request: NextRequest, context) => {
  const body = await request.json()
  
  // Validate request body
  const { data: params, error: validationError } = validateRequestBody(
    body,
    updateReadingHistorySchema,
    context.requestId
  )
  
  if (validationError) {
    return validationError
  }
  
  const { userProfile, supabase } = context

  // Update reading history using the database function
  const { error } = await supabase.rpc('update_reading_history', {
    p_user_id: userProfile.id,
    p_article_slug: params.articleSlug,
    p_article_title: params.articleTitle,
    p_article_category: params.articleCategory || null,
    p_duration_seconds: params.durationSeconds,
    p_scroll_percentage: params.scrollPercentage,
    p_completed: params.completed,
  })

  if (error) {
    // Check if the error is because the function doesn't exist
    if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
      console.warn('Reading history function not found. Migration may not have been run.')
      return NextResponse.json({ 
        success: true,
        message: 'Reading history feature not yet available'
      })
    }
    return mapDatabaseError(error, 'update_reading_history', context.requestId)
  }

  return NextResponse.json({ 
    success: true,
    message: 'Reading history updated'
  })
})

export const POST = updateReadingHistoryHandler
export const PUT = updateReadingHistoryHandler

// Schema for fetching reading history
const getReadingHistorySchema = z.object({
  category: z.string().optional(),
  completed: z.enum(['true', 'false']).optional(),
  ...paginationSchema.shape,
})

const getReadingHistoryHandler = withAuth(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url)
  
  // Validate query parameters
  const { data: params, error: validationError } = validateQueryParams(
    searchParams,
    getReadingHistorySchema,
    context.requestId
  )
  
  if (validationError) {
    return validationError
  }
  
  const { category, completed, limit, offset } = params
  const { userProfile, supabase } = context

  let query = supabase
    .from('reading_history')
    .select('*', { count: 'exact' })
    .eq('user_id', userProfile.id)
    .order('last_read_at', { ascending: false })

  if (category) {
    query = query.eq('article_category', category)
  }

  if (completed !== undefined) {
    query = query.eq('completed', completed === 'true')
  }

  const { data: history, error, count } = await query
    .range(offset, offset + limit - 1)

  if (error) {
    // Check if the error is because the table doesn't exist
    if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
      console.warn('Reading history table not found. Migration may not have been run.')
      return NextResponse.json({ 
        history: [],
        stats: {
          total_articles_read: 0,
          total_reading_time_minutes: 0,
          articles_completed: 0,
          current_streak_days: 0,
        },
        total: 0,
        limit,
        offset,
        hasMore: false
      })
    }
    return mapDatabaseError(error, 'fetch_reading_history', context.requestId)
  }

  // Get reading stats
  const { data: stats, error: statsError } = await supabase.rpc('get_reading_stats', {
    p_user_id: userProfile.id
  })

  if (statsError) {
    console.error('Failed to fetch reading stats:', statsError)
  }

  return NextResponse.json({ 
    history: history || [],
    stats: stats?.[0] || {
      total_articles_read: 0,
      total_reading_time_minutes: 0,
      articles_completed: 0,
      current_streak_days: 0,
    },
    total: count || 0,
    limit,
    offset,
    hasMore: (count || 0) > offset + limit
  })
})

export const GET = getReadingHistoryHandler

// Delete specific reading history entry
const deleteReadingHistorySchema = z.object({
  articleSlug: z.string().min(1),
})

const deleteReadingHistoryHandler = compose(
  withRateLimit(60000, 30), // 30 deletions per minute
  withAuth
)(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url)
  
  // Validate query parameters
  const { data: params, error: validationError } = validateQueryParams(
    searchParams,
    deleteReadingHistorySchema,
    context.requestId
  )
  
  if (validationError) {
    return validationError
  }
  
  const { articleSlug } = params
  const { userProfile, supabase } = context

  const { error } = await supabase
    .from('reading_history')
    .delete()
    .eq('user_id', userProfile.id)
    .eq('article_slug', articleSlug)

  if (error) {
    return mapDatabaseError(error, 'delete_reading_history', context.requestId)
  }

  return NextResponse.json({ 
    success: true,
    message: 'Reading history entry deleted'
  })
})

export const DELETE = deleteReadingHistoryHandler
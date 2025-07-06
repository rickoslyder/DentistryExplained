import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'

const getContentStatusHandler = compose(
  withRateLimit(60000, 100),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    
    // Get article counts by status
    const { data: articles, error } = await supabase
      .from('articles')
      .select('status')
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'get_content_status', requestId)
    }
    
    // Count articles by status
    const statusCounts = {
      published: 0,
      draft: 0,
      scheduled: 0,
      archived: 0,
    }
    
    articles?.forEach(article => {
      if (article.status in statusCounts) {
        statusCounts[article.status as keyof typeof statusCounts]++
      }
    })
    
    // Check for scheduled articles
    const { data: scheduledArticles } = await supabase
      .from('scheduled_articles')
      .select('id')
      .eq('status', 'pending')
    
    if (scheduledArticles && scheduledArticles.length > 0) {
      statusCounts.scheduled = scheduledArticles.length
    }
    
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
    
    return NextResponse.json({
      statusCounts,
      total,
    })
  } catch (error) {
    return ApiErrors.internal(error, 'get_content_status', requestId)
  }
})

export const GET = getContentStatusHandler
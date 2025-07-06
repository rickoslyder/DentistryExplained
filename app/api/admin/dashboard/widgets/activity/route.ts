import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'

const getActivityHandler = compose(
  withRateLimit(60000, 100),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Get recent activity logs with user profiles
    const { data: logs, error, count } = await supabase
      .from('activity_logs')
      .select(`
        *,
        profiles!activity_logs_user_id_fkey (
          first_name,
          last_name,
          email,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'get_recent_activity', requestId)
    }
    
    return NextResponse.json({
      logs: logs || [],
      totalCount: count || 0,
    })
  } catch (error) {
    return ApiErrors.internal(error, 'get_recent_activity', requestId)
  }
})

export const GET = getActivityHandler
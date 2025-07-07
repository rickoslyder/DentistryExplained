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

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}

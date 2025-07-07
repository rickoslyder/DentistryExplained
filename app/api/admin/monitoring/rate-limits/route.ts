import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withCSRF, compose } from '@/lib/api-middleware'
import { getRateLimitStats, clearAllRateLimits } from '@/lib/rate-limiter'
import { ApiErrors, getRequestId } from '@/lib/api-errors'

// GET /api/admin/monitoring/rate-limits - Get rate limit statistics
const getRateLimitStatsHandler = compose(
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const user = context.userProfile!
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    const stats = getRateLimitStats()
    
    return NextResponse.json(stats)
  } catch (error) {
    return ApiErrors.internal(error, 'get_rate_limit_stats', requestId)
  }
})

// DELETE /api/admin/monitoring/rate-limits - Clear rate limit data
const clearRateLimitsHandler = compose(
  withCSRF,
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const user = context.userProfile!
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    clearAllRateLimits()
    
    // Log the action
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'clear_rate_limits',
        details: {
          cleared_at: new Date().toISOString(),
          cleared_by: user.email,
        }
      })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rate limit data cleared successfully' 
    })
  } catch (error) {
    return ApiErrors.internal(error, 'clear_rate_limits', requestId)
  }
})

export const GET = getRateLimitStatsHandler
export const DELETE = clearRateLimitsHandler

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}

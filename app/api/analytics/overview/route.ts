import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')
    
    const supabase = await createServerSupabaseClient()
    const startDate = startOfDay(subDays(new Date(), days - 1))
    const endDate = endOfDay(new Date())

    // Fetch all metrics in parallel
    const [
      revenueResponse,
      funnelResponse,
      contentResponse
    ] = await Promise.all([
      fetch(new URL('/api/analytics/revenue', request.url).toString() + `?days=${days}`, {
        headers: request.headers
      }),
      fetch(new URL('/api/analytics/funnel', request.url).toString() + `?days=${days}`, {
        headers: request.headers
      }),
      fetch(new URL('/api/analytics/content-performance', request.url).toString() + `?days=${days}&limit=10`, {
        headers: request.headers
      })
    ])

    if (!revenueResponse.ok || !funnelResponse.ok || !contentResponse.ok) {
      throw new Error('Failed to fetch analytics data')
    }

    const [revenueMetrics, funnelData, contentPerformance] = await Promise.all([
      revenueResponse.json(),
      funnelResponse.json(),
      contentResponse.json()
    ])

    // Get basic analytics data for backward compatibility
    const [
      { count: totalArticles },
      { count: totalUsers },
      { count: totalSessions },
      { count: totalViews }
    ] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('chat_sessions').select('*', { count: 'exact', head: true }),
      supabase
        .from('article_views')
        .select('*', { count: 'exact', head: true })
        .gte('viewed_at', startDate.toISOString())
        .lte('viewed_at', endDate.toISOString())
    ])

    return NextResponse.json({
      revenueMetrics,
      funnelData,
      contentPerformance,
      basicData: {
        overview: {
          totalArticles: totalArticles || 0,
          totalUsers: totalUsers || 0,
          totalSessions: totalSessions || 0,
          totalViews: totalViews || 0,
        }
      }
    })
  } catch (error) {
    console.error('Failed to fetch overview analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overview analytics' },
      { status: 500 }
    )
  }
}
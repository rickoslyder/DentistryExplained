import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { startOfDay, subDays } from 'date-fns'

const getStatsHandler = compose(
  withRateLimit(60000, 100),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const sevenDaysAgo = subDays(now, 7)
    
    // Get article stats
    const { data: articleStats } = await supabase
      .from('articles')
      .select('status, created_at')
    
    const totalArticles = articleStats?.length || 0
    const publishedArticles = articleStats?.filter(a => a.status === 'published').length || 0
    const recentArticles = articleStats?.filter(a => 
      new Date(a.created_at) >= sevenDaysAgo
    ).length || 0
    const previousWeekArticles = articleStats?.filter(a => {
      const createdAt = new Date(a.created_at)
      return createdAt < sevenDaysAgo && createdAt >= subDays(now, 14)
    }).length || 0
    
    const articlesChange = previousWeekArticles > 0 
      ? Math.round(((recentArticles - previousWeekArticles) / previousWeekArticles) * 100)
      : 100
    
    // Get user stats
    const { data: userStats } = await supabase
      .from('profiles')
      .select('user_type, created_at')
    
    const totalUsers = userStats?.length || 0
    const professionalUsers = userStats?.filter(u => u.user_type === 'professional').length || 0
    const recentUsers = userStats?.filter(u => 
      new Date(u.created_at) >= sevenDaysAgo
    ).length || 0
    const previousWeekUsers = userStats?.filter(u => {
      const createdAt = new Date(u.created_at)
      return createdAt < sevenDaysAgo && createdAt >= subDays(now, 14)
    }).length || 0
    
    const usersChange = previousWeekUsers > 0
      ? Math.round(((recentUsers - previousWeekUsers) / previousWeekUsers) * 100)
      : 100
    
    // Get view stats (30 days)
    const { data: viewStats } = await supabase
      .from('article_views')
      .select('viewed_at')
      .gte('viewed_at', thirtyDaysAgo.toISOString())
    
    const totalViews = viewStats?.length || 0
    const recentViews = viewStats?.filter(v => 
      new Date(v.viewed_at) >= sevenDaysAgo
    ).length || 0
    const previousWeekViews = viewStats?.filter(v => {
      const viewedAt = new Date(v.viewed_at)
      return viewedAt < sevenDaysAgo && viewedAt >= subDays(now, 14)
    }).length || 0
    
    const viewsChange = previousWeekViews > 0
      ? Math.round(((recentViews - previousWeekViews) / previousWeekViews) * 100)
      : 100
    
    // Get active sessions (simplified - count unique users in last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const { data: activeSessions } = await supabase
      .from('article_views')
      .select('user_id')
      .gte('viewed_at', fiveMinutesAgo.toISOString())
    
    const uniqueActiveSessions = new Set(activeSessions?.map(s => s.user_id) || []).size
    
    // Calculate trend data for views (last 7 days)
    const viewTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(now, i))
      const nextDate = startOfDay(subDays(now, i - 1))
      const dayViews = viewStats?.filter(v => {
        const viewedAt = new Date(v.viewed_at)
        return viewedAt >= date && viewedAt < nextDate
      }).length || 0
      viewTrend.push(dayViews)
    }
    
    return NextResponse.json({
      articles: {
        total: totalArticles,
        published: publishedArticles,
        change: articlesChange,
      },
      users: {
        total: totalUsers,
        professionals: professionalUsers,
        change: usersChange,
      },
      views: {
        total: totalViews,
        trend: viewTrend,
        change: viewsChange,
      },
      activeSessions: {
        count: uniqueActiveSessions,
        change: 0, // Real-time metric, no change calculation
      },
    })
  } catch (error) {
    return ApiErrors.internal(error, 'get_dashboard_stats', requestId)
  }
})

export const GET = getStatsHandler
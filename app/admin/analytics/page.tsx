import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'
import { EnhancedAnalyticsDashboard } from '@/components/admin/analytics-dashboard-enhanced'
import { EnhancedAnalyticsDashboardLive } from '@/components/admin/analytics-dashboard-enhanced-live'
import { PostHogRealtimeAnalytics } from '@/components/admin/analytics/posthog-realtime'
import { PerformanceDashboard } from '@/components/admin/analytics/performance-dashboard'
import { AnalyticsPageClient } from '@/components/admin/analytics/analytics-page-client'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export const dynamic = 'force-dynamic'

interface SearchParams {
  days?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

async function getAnalyticsDataOptimized(days: number = 7) {
  const supabase = await createServerSupabaseClient()
  const startDate = startOfDay(subDays(new Date(), days - 1))
  const endDate = endOfDay(new Date())
  
  // Parallel fetch all overview stats
  const [
    { count: totalArticles },
    { count: totalUsers },
    { count: totalSessions },
    articleViewsData,
    dailyViewsData,
    topArticlesData,
    recentSessionsData,
    searchData
  ] = await Promise.all([
    // Basic counts
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('chat_sessions').select('*', { count: 'exact', head: true }),
    
    // Total views in period
    supabase
      .from('article_views')
      .select('viewed_at', { count: 'exact' })
      .gte('viewed_at', startDate.toISOString())
      .lte('viewed_at', endDate.toISOString()),
    
    // Daily views aggregated in a single query using RPC
    supabase.rpc('get_daily_article_views', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    }),
    
    // Top articles with counts using RPC
    supabase.rpc('get_top_articles_by_views', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      limit_count: 10
    }),
    
    // Recent sessions with user info
    supabase
      .from('chat_sessions')
      .select(`
        id,
        user_id,
        created_at,
        profiles!inner(
          email,
          user_type
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(20),
    
    // Search analytics
    supabase
      .from('web_searches')
      .select('query')
      .gte('created_at', startDate.toISOString())
  ])
  
  // Process daily views data
  const dailyViews = dailyViewsData.data?.map(row => ({
    date: format(new Date(row.view_date), 'MMM d'),
    views: row.view_count
  })) || []
  
  // Process search data
  const searchCounts = searchData.data?.reduce((acc, { query }) => {
    acc[query] = (acc[query] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  const topSearches = Object.entries(searchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }))
  
  return {
    overview: {
      totalArticles: totalArticles || 0,
      totalUsers: totalUsers || 0,
      totalSessions: totalSessions || 0,
      totalViews: articleViewsData.count || 0,
    },
    dailyViews,
    popularArticles: topArticlesData.data || [],
    recentActivity: recentSessionsData.data?.map(session => ({
      id: session.id,
      userEmail: session.profiles?.email || 'Unknown',
      userType: session.profiles?.user_type || 'Unknown',
      createdAt: session.created_at
    })) || [],
    topSearches
  }
}

async function getEnhancedAnalyticsDataOptimized(days: number = 7) {
  const supabase = await createServerSupabaseClient()
  const startDate = startOfDay(subDays(new Date(), days - 1))
  const endDate = endOfDay(new Date())
  
  // Previous period for calculating changes
  const previousStartDate = startOfDay(subDays(new Date(), (days * 2) - 1))
  const previousEndDate = startOfDay(subDays(new Date(), days))
  
  // Get all data in parallel
  const [
    basicData,
    professionalData,
    performanceData,
    userActivityData
  ] = await Promise.all([
    // Basic analytics data
    getAnalyticsDataOptimized(days),
    
    // Professional funnel data using RPC
    supabase.rpc('get_professional_funnel_metrics', {
      current_start: startDate.toISOString(),
      current_end: endDate.toISOString(),
      previous_start: previousStartDate.toISOString(),
      previous_end: previousEndDate.toISOString()
    }),
    
    // Content performance using RPC
    supabase.rpc('get_content_performance_metrics', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      limit_count: 20
    }),
    
    // User activity metrics
    supabase.rpc('get_user_activity_metrics', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })
  ])
  
  // Process professional data
  const profData = professionalData.data?.[0] || {}
  const verificationStats = {
    started: profData.verifications_started || 0,
    submitted: profData.verifications_submitted || 0,
    verified: profData.verifications_approved || 0,
  }
  
  // Calculate changes
  const pageviewChange = profData.prev_views > 0 
    ? ((basicData.overview.totalViews - profData.prev_views) / profData.prev_views * 100)
    : 0
    
  const conversionChange = profData.prev_verified > 0
    ? ((verificationStats.verified - profData.prev_verified) / profData.prev_verified * 100)
    : 0
    
  const professionalSignupChange = profData.prev_signups > 0
    ? ((profData.professional_signups - profData.prev_signups) / profData.prev_signups * 100)
    : 0
  
  // Process content performance
  const contentPerformance = performanceData.data?.map(article => ({
    id: article.article_id,
    title: article.title,
    category: article.category,
    views: article.view_count,
    avgTimeOnPage: article.avg_time_on_page || 3.5,
    scrollDepth: 65,
    engagementScore: Math.min(100, article.view_count),
    revenueValue: article.view_count * 0.002
  })) || []
  
  return {
    revenueMetrics: {
      adRevenuePotential: {
        value: basicData.overview.totalViews * 0.002,
        change: Math.round(pageviewChange),
        pageviews: basicData.overview.totalViews,
        avgEngagement: userActivityData.data?.[0]?.avg_engagement || 0
      },
      professionalConversions: {
        value: verificationStats.verified,
        change: Math.round(conversionChange),
        verificationRate: verificationStats.submitted > 0 
          ? Math.round((verificationStats.verified / verificationStats.submitted) * 100)
          : 0,
        avgTimeToConvert: profData.avg_time_to_convert || 0
      },
      userMetrics: {
        totalUsers: basicData.overview.totalUsers,
        activeUsers: userActivityData.data?.[0]?.active_users || 0,
        professionalUsers: profData.total_professionals || 0,
        change: Math.round(professionalSignupChange)
      },
      contentMetrics: {
        totalArticles: basicData.overview.totalArticles,
        publishedArticles: basicData.overview.totalArticles,
        avgReadTime: 3.5,
        change: 0
      }
    },
    funnelData: {
      visitors: profData.professional_visitors || basicData.overview.totalViews,
      signups: profData.professional_signups || 0,
      verificationStarted: verificationStats.started,
      verificationSubmitted: verificationStats.submitted,
      verified: verificationStats.verified,
      activeSubscribers: profData.active_subscribers || 0
    },
    contentPerformance,
    basicData
  }
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const days = parseInt(params.days || '7')
  const enhancedData = await getEnhancedAnalyticsDataOptimized(days)
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Track business KPIs, revenue metrics, and user engagement with live data</p>
      </div>
      
      <AnalyticsPageClient enhancedData={enhancedData} defaultDays={days} />
    </div>
  )
}
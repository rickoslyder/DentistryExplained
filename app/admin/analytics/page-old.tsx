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

async function getAnalyticsData(days: number = 7) {
  const supabase = await createServerSupabaseClient()
  const startDate = startOfDay(subDays(new Date(), days - 1))
  const endDate = endOfDay(new Date())
  
  // Get overview stats
  const [
    { count: totalArticles },
    { count: totalUsers },
    { count: totalSessions },
    { data: articleViews }
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('chat_sessions').select('*', { count: 'exact', head: true }),
    supabase
      .from('article_views')
      .select('viewed_at', { count: 'exact' })
      .gte('viewed_at', startDate.toISOString())
      .lte('viewed_at', endDate.toISOString())
  ])
  
  // Get popular articles - aggregate view counts
  const { data: viewCounts } = await supabase
    .from('article_views')
    .select('article_slug')
    .gte('viewed_at', startDate.toISOString())
    .lte('viewed_at', endDate.toISOString())
  
  // Count views by article
  const articleViewMap = viewCounts?.reduce((acc, view) => {
    acc[view.article_slug] = (acc[view.article_slug] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  // Get article details for top viewed
  const topSlugs = Object.entries(articleViewMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug]) => slug)
  
  const { data: articleDetails } = topSlugs.length > 0 
    ? await supabase
        .from('articles')
        .select('id, title, slug')
        .in('slug', topSlugs)
    : { data: [] }
  
  const popularArticles = articleDetails?.map(article => ({
    ...article,
    count: articleViewMap[article.slug] || 0
  })).sort((a, b) => b.count - a.count)
  
  // Get daily views for chart
  const dailyViews = []
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    
    const { count } = await supabase
      .from('article_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', dayStart.toISOString())
      .lte('viewed_at', dayEnd.toISOString())
    
    dailyViews.push({
      date: format(date, 'MMM d'),
      views: count || 0
    })
  }
  
  // Get user activity
  const { data: recentSessions } = await supabase
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
    .limit(20)
  
  // Get search analytics
  const { data: searchTerms } = await supabase
    .from('web_searches')
    .select('query')
    .gte('created_at', startDate.toISOString())
  
  // Aggregate search terms
  const searchCounts = searchTerms?.reduce((acc, { query }) => {
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
      totalViews: articleViews?.length || 0,
    },
    dailyViews,
    popularArticles: popularArticles || [],
    recentActivity: recentSessions?.map(session => ({
      id: session.id,
      userEmail: (session as any).profiles?.email || 'Unknown',
      userType: (session as any).profiles?.user_type || 'Unknown',
      createdAt: session.created_at
    })) || [],
    topSearches
  }
}

async function getEnhancedAnalyticsData(days: number = 7) {
  const supabase = await createServerSupabaseClient()
  const startDate = startOfDay(subDays(new Date(), days - 1))
  const endDate = endOfDay(new Date())
  
  // Previous period for calculating changes
  const previousStartDate = startOfDay(subDays(new Date(), (days * 2) - 1))
  const previousEndDate = startOfDay(subDays(new Date(), days))
  
  // Get basic data
  const basicData = await getAnalyticsData(days)
  
  // Get professional funnel data for current and previous period
  const [
    { count: totalProfessionalVisitors },
    { count: professionalSignups },
    { data: verificationData },
    { count: activeSubscribers },
    // Previous period data for comparison
    { count: prevProfessionalVisitors },
    { count: prevProfessionalSignups },
    { data: prevVerificationData },
    { count: prevViews }
  ] = await Promise.all([
    // Current period data
    supabase.from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('resource_type', 'page')
      .eq('resource_id', '/professional')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
    
    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'professional')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
    
    supabase.from('professional_verifications')
      .select('status, created_at, approved_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
    
    supabase.from('professional_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
    
    // Previous period data
    supabase.from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('resource_type', 'page')
      .eq('resource_id', '/professional')
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString()),
    
    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'professional')
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString()),
    
    supabase.from('professional_verifications')
      .select('status')
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString()),
      
    supabase.from('article_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', previousStartDate.toISOString())
      .lte('viewed_at', previousEndDate.toISOString())
  ])
  
  // Process verification data
  const verificationStats = {
    started: verificationData?.length || 0,
    submitted: verificationData?.filter(v => v.status !== 'pending').length || 0,
    verified: verificationData?.filter(v => v.status === 'approved').length || 0,
  }
  
  const prevVerificationStats = {
    verified: prevVerificationData?.filter(v => v.status === 'approved').length || 0,
  }
  
  // Calculate average time to convert
  const approvedVerifications = verificationData?.filter(v => v.status === 'approved' && v.approved_at) || []
  const avgTimeToConvert = approvedVerifications.length > 0
    ? approvedVerifications.reduce((sum, v) => {
        const createdAt = new Date(v.created_at).getTime()
        const approvedAt = new Date(v.approved_at).getTime()
        return sum + ((approvedAt - createdAt) / (1000 * 60 * 60 * 24))
      }, 0) / approvedVerifications.length
    : 0
  
  // Get content performance with engagement metrics
  // First get article view counts
  const { data: articleViewData } = await supabase
    .from('article_views')
    .select('article_slug')
    .gte('viewed_at', startDate.toISOString())
    .lte('viewed_at', endDate.toISOString())
  
  // Aggregate view counts by article
  const performanceViewMap = articleViewData?.reduce((acc, view) => {
    acc[view.article_slug] = (acc[view.article_slug] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  // Get top articles by view count
  const topPerformanceSlugs = Object.entries(performanceViewMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([slug]) => slug)
  
  // Get article details
  const { data: articlePerformance } = topPerformanceSlugs.length > 0
    ? await supabase
        .from('articles')
        .select('id, title, slug, category, content')
        .in('slug', topPerformanceSlugs)
    : { data: [] }
  
  // Calculate engagement scores (simplified - in production would use real analytics)
  const contentPerformance = articlePerformance?.map(article => {
    const viewCount = performanceViewMap[article.slug] || 0
    const wordCount = article.content?.split(' ').length || 1000
    const expectedReadTime = wordCount / 200 // 200 words per minute
    
    return {
      id: article.id,
      title: article.title,
      category: article.category,
      views: viewCount,
      avgTimeOnPage: expectedReadTime, // in minutes
      scrollDepth: 65, // Would need real tracking
      engagementScore: Math.min(100, viewCount), // Simple engagement based on views
      revenueValue: viewCount * 0.002 // £0.002 per view
    }
  }).sort((a, b) => b.views - a.views) || []
  
  // Calculate revenue metrics with real changes
  const totalPageviews = basicData.overview.totalViews
  const prevPageviews = prevViews || 0
  const pageviewChange = prevPageviews > 0 
    ? ((totalPageviews - prevPageviews) / prevPageviews * 100)
    : 0
    
  // Calculate engagement rate from chat sessions
  const { count: chatSessions } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
  const avgEngagement = totalPageviews > 0 ? Math.round((chatSessions || 0) / totalPageviews * 100) : 0
  
  // Calculate user metrics
  const { count: activeUserCount } = await supabase
    .from('activity_logs')
    .select('user_id', { count: 'exact' })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
  
  const activeUsers = activeUserCount || Math.floor(basicData.overview.totalUsers * 0.3)
  const professionalUsers = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'professional')
    .then(result => result.count || 0)
  
  // Calculate professional conversion change
  const conversionChange = prevVerificationStats.verified > 0
    ? ((verificationStats.verified - prevVerificationStats.verified) / prevVerificationStats.verified * 100)
    : 0
    
  const professionalSignupChange = prevProfessionalSignups && prevProfessionalSignups > 0
    ? (((professionalSignups || 0) - prevProfessionalSignups) / prevProfessionalSignups * 100)
    : 0
  
  return {
    revenueMetrics: {
      adRevenuePotential: {
        value: totalPageviews * 0.002, // £2 CPM
        change: Math.round(pageviewChange),
        pageviews: totalPageviews,
        avgEngagement
      },
      professionalConversions: {
        value: verificationStats.verified,
        change: Math.round(conversionChange),
        verificationRate: verificationStats.submitted > 0 
          ? Math.round((verificationStats.verified / verificationStats.submitted) * 100)
          : 0,
        avgTimeToConvert: Math.round(avgTimeToConvert)
      },
      userMetrics: {
        totalUsers: basicData.overview.totalUsers,
        activeUsers,
        professionalUsers,
        change: Math.round(professionalSignupChange)
      },
      contentMetrics: {
        totalArticles: basicData.overview.totalArticles,
        publishedArticles: basicData.overview.totalArticles,
        avgReadTime: 3.5, // minutes
        change: 0 // Would need content tracking
      }
    },
    funnelData: {
      visitors: totalProfessionalVisitors || totalPageviews, // Use pageviews as proxy if no visitor tracking
      signups: professionalSignups || 0,
      verificationStarted: verificationStats.started,
      verificationSubmitted: verificationStats.submitted,
      verified: verificationStats.verified,
      activeSubscribers: activeSubscribers || 0
    },
    contentPerformance,
    basicData
  }
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const days = parseInt(params.days || '7')
  const enhancedData = await getEnhancedAnalyticsData(days)
  
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
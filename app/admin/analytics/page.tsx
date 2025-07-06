import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'
import { EnhancedAnalyticsDashboard } from '@/components/admin/analytics-dashboard-enhanced'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export const dynamic = 'force-dynamic'

interface SearchParams {
  days?: string
}

interface PageProps {
  searchParams: SearchParams
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
  
  // Get popular articles
  const { data: popularArticles } = await supabase
    .from('article_views')
    .select(`
      article_id,
      count,
      articles!inner(id, title, slug)
    `)
    .gte('created_at', startDate.toISOString())
    .order('count', { ascending: false })
    .limit(10)
  
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
      profiles!inner(email, user_type)
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
    popularArticles: popularArticles?.map(item => ({
      id: item.article_id,
      title: item.articles.title,
      slug: item.articles.slug,
      views: item.count
    })) || [],
    recentActivity: recentSessions?.map(session => ({
      id: session.id,
      userEmail: session.profiles.email,
      userType: session.profiles.user_type,
      createdAt: session.created_at
    })) || [],
    topSearches
  }
}

async function getEnhancedAnalyticsData(days: number = 7) {
  const supabase = await createServerSupabaseClient()
  const startDate = startOfDay(subDays(new Date(), days - 1))
  const endDate = endOfDay(new Date())
  
  // Get basic data
  const basicData = await getAnalyticsData(days)
  
  // Get professional funnel data
  const [
    { count: totalProfessionalVisitors },
    { count: professionalSignups },
    { data: verificationData },
    { count: activeSubscribers }
  ] = await Promise.all([
    // Count users who viewed professional page
    supabase.from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('resource_type', 'page')
      .eq('resource_id', '/professional')
      .gte('created_at', startDate.toISOString()),
    
    // Count professional signups
    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'professional')
      .gte('created_at', startDate.toISOString()),
    
    // Get verification data
    supabase.from('professional_verifications')
      .select('verification_status')
      .gte('created_at', startDate.toISOString()),
    
    // Active subscribers (verified professionals)
    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'professional')
      .eq('professional_verified', true)
  ])
  
  // Process verification data
  const verificationStats = {
    started: verificationData?.length || 0,
    submitted: verificationData?.filter(v => v.verification_status !== 'draft').length || 0,
    verified: verificationData?.filter(v => v.verification_status === 'verified').length || 0,
  }
  
  // Get content performance with engagement metrics
  const { data: articlePerformance } = await supabase
    .from('article_views')
    .select(`
      article_id,
      count,
      articles!inner(id, title, slug, category, content)
    `)
    .gte('created_at', startDate.toISOString())
    .order('count', { ascending: false })
    .limit(20)
  
  // Calculate engagement scores (simplified - in production would use real analytics)
  const contentPerformance = articlePerformance?.map(item => {
    const wordCount = item.articles.content?.split(' ').length || 1000
    const expectedReadTime = wordCount / 200 // 200 words per minute
    
    return {
      id: item.article_id,
      title: item.articles.title,
      category: item.articles.category,
      views: item.count,
      avgTimeOnPage: expectedReadTime * 60, // Convert to seconds
      scrollDepth: 65 + Math.random() * 25, // Simulated 65-90%
      engagementScore: 70 + Math.random() * 20, // Simulated 70-90%
      revenueValue: item.count * 0.002 // £0.002 per view
    }
  }) || []
  
  // Calculate revenue metrics
  const totalPageviews = basicData.overview.totalViews
  const activeUsers = Math.floor(basicData.overview.totalUsers * 0.3) // 30% active
  const professionalUsers = professionalSignups || 0
  
  return {
    revenueMetrics: {
      adRevenuePotential: {
        value: totalPageviews * 0.002, // £2 CPM
        change: 15, // Placeholder
        pageviews: totalPageviews,
        avgEngagement: 75
      },
      professionalConversions: {
        value: verificationStats.verified,
        change: 25, // Placeholder
        verificationRate: verificationStats.submitted > 0 
          ? (verificationStats.verified / verificationStats.submitted) * 100 
          : 0,
        avgTimeToConvert: 3 // Days
      },
      userMetrics: {
        totalUsers: basicData.overview.totalUsers,
        activeUsers,
        professionalUsers,
        change: 10 // Placeholder
      },
      contentMetrics: {
        totalArticles: basicData.overview.totalArticles,
        publishedArticles: basicData.overview.totalArticles,
        avgReadTime: 180, // 3 minutes
        change: 5 // Placeholder
      }
    },
    funnelData: {
      visitors: totalProfessionalVisitors || 1000, // Use actual or placeholder
      signups: professionalSignups || 100,
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
  const days = parseInt(searchParams.days || '7')
  const enhancedData = await getEnhancedAnalyticsData(days)
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Track business KPIs, revenue metrics, and user engagement</p>
      </div>
      
      <EnhancedAnalyticsDashboard data={enhancedData} defaultDays={days} />
    </div>
  )
}
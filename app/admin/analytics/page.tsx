import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'
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

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const days = parseInt(searchParams.days || '7')
  const analyticsData = await getAnalyticsData(days)
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Monitor your platform's performance and user engagement</p>
      </div>
      
      <AnalyticsDashboard data={analyticsData} defaultDays={days} />
    </div>
  )
}
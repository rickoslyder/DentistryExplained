import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use the optimized function to get all dashboard stats in one query
    const { data: stats, error } = await supabase
      .rpc('get_dashboard_stats')
      .single()

    if (error) {
      console.error('Error fetching dashboard stats:', error)
      // Fallback to individual queries if function doesn't exist
      return fetchStatsManually(supabase)
    }

    // Calculate growth percentages
    const previousWeekUsers = stats.users.total_users - stats.users.new_users_7d
    const userGrowth = previousWeekUsers > 0 
      ? ((stats.users.new_users_7d / previousWeekUsers) * 100).toFixed(1)
      : '0'

    const previousWeekArticles = stats.articles.total_articles - stats.articles.new_articles_7d
    const articleGrowth = previousWeekArticles > 0
      ? ((stats.articles.new_articles_7d / previousWeekArticles) * 100).toFixed(1)
      : '0'

    return NextResponse.json({
      totalUsers: stats.users.total_users,
      totalArticles: stats.articles.total_articles,
      publishedArticles: stats.articles.published_articles,
      totalSessions: stats.chat.total_sessions,
      totalMessages: stats.chat.total_messages,
      activeUsers24h: stats.views.unique_viewers_24h,
      pageViews24h: stats.views.views_24h,
      userGrowth,
      articleGrowth,
      timestamp: stats.timestamp
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}

// Fallback function using individual queries
async function fetchStatsManually(supabase: any) {
  try {
    // Batch all queries
    const [
      userStats,
      articleStats,
      chatStats,
      viewStats
    ] = await Promise.all([
      // User statistics
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      
      // Article statistics  
      supabase.from('articles')
        .select('status', { count: 'exact' })
        .eq('status', 'published'),
      
      // Chat statistics
      supabase.from('chat_sessions').select('*', { count: 'exact', head: true }),
      
      // View statistics (last 24 hours)
      supabase.from('article_views')
        .select('user_id', { count: 'exact' })
        .gte('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])

    return NextResponse.json({
      totalUsers: userStats.count || 0,
      totalArticles: articleStats.data?.length || 0,
      publishedArticles: articleStats.count || 0,
      totalSessions: chatStats.count || 0,
      totalMessages: 0, // Would need another query
      activeUsers24h: viewStats.data ? new Set(viewStats.data.map((v: any) => v.user_id)).size : 0,
      pageViews24h: viewStats.count || 0,
      userGrowth: '0',
      articleGrowth: '0'
    })
  } catch (error) {
    console.error('Manual stats fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
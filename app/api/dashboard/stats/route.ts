import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { mapDatabaseError } from '@/lib/api-errors'
import { supabaseAdmin } from '@/lib/supabase'

const getDashboardStatsHandler = withAuth(async (request: NextRequest, context) => {
  const { userProfile } = context

  try {
    // Get reading stats using the database function
    const { data: readingStats, error: statsError } = await supabaseAdmin.rpc('get_reading_stats', {
      p_user_id: userProfile.id
    })

    if (statsError) {
      console.error('Failed to fetch reading stats:', statsError)
      return mapDatabaseError(statsError, 'fetch_reading_stats', context.requestId)
    }

    const stats = readingStats?.[0] || {
      total_articles_read: 0,
      total_reading_time_minutes: 0,
      articles_completed: 0,
      current_streak_days: 0
    }

    // Get bookmarks count
    const { count: bookmarksCount, error: bookmarksError } = await supabaseAdmin
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userProfile.id)

    if (bookmarksError) {
      console.error('Failed to fetch bookmarks count:', bookmarksError)
      return mapDatabaseError(bookmarksError, 'fetch_bookmarks_count', context.requestId)
    }

    // Calculate progress based on engagement
    const calculateProgress = (articlesRead: number, bookmarks: number, completed: number): number => {
      const readingProgress = Math.min(articlesRead * 3, 40) // Up to 40% from reading
      const bookmarkProgress = Math.min(bookmarks * 5, 20) // Up to 20% from bookmarking
      const completionProgress = Math.min(completed * 10, 30) // Up to 30% from completing
      const engagementBonus = articlesRead > 5 && bookmarks > 2 ? 10 : 0 // 10% bonus
      
      return Math.min(readingProgress + bookmarkProgress + completionProgress + engagementBonus, 100)
    }

    // Get recent reading history
    const { data: recentReading, error: recentError } = await supabaseAdmin
      .from('reading_history')
      .select('article_slug, article_title, article_category, last_read_at')
      .eq('user_id', userProfile.id)
      .order('last_read_at', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Failed to fetch recent reading:', recentError)
      return mapDatabaseError(recentError, 'fetch_recent_reading', context.requestId)
    }

    // Get unique recent articles
    const uniqueArticles = new Map()
    recentReading?.forEach(item => {
      if (!uniqueArticles.has(item.article_slug)) {
        uniqueArticles.set(item.article_slug, {
          slug: item.article_slug,
          title: item.article_title,
          category: item.article_category,
          lastReadAt: item.last_read_at
        })
      }
    })

    // Professional stats if applicable
    let professionalStats = null
    if (userProfile.userType === 'professional') {
      // Get verification status
      const { data: verification } = await supabaseAdmin
        .from('professional_verifications')
        .select('status')
        .eq('user_id', userProfile.id)
        .single()

      // Get practice listing if exists
      const { data: practice } = await supabaseAdmin
        .from('practice_listings')
        .select('id')
        .eq('claimed_by', userProfile.id)
        .single()

      // For now, we'll use placeholder values for downloads and practice views
      // These will be implemented when we add download tracking
      professionalStats = {
        verificationStatus: verification?.status || 'pending',
        patientsEducated: Math.floor(stats.total_articles_read * 1.5), // Estimate based on reading
        materialsDownloaded: 0, // Will be real when we implement download tracking
        practiceViews: practice ? Math.floor(Math.random() * 100) : 0 // Placeholder
      }
    }

    return NextResponse.json({
      stats: {
        articlesRead: stats.total_articles_read || 0,
        readingTimeMinutes: stats.total_reading_time_minutes || 0,
        bookmarksCount: bookmarksCount || 0,
        articlesCompleted: stats.articles_completed || 0,
        currentStreak: stats.current_streak_days || 0,
        progress: calculateProgress(
          stats.total_articles_read || 0,
          bookmarksCount || 0,
          stats.articles_completed || 0
        )
      },
      recentReading: Array.from(uniqueArticles.values()).slice(0, 5),
      professionalStats
    })
  } catch (error) {
    console.error('Unexpected error in dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
})

export const GET = getDashboardStatsHandler
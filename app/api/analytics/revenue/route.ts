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

    // Fetch real data from database
    const [
      articleViews,
      professionalVerifications,
      userStats,
      articleStats,
      chatSessions
    ] = await Promise.all([
      // Article views for ad revenue calculation
      supabase
        .from('article_views')
        .select('id')
        .gte('viewed_at', startDate.toISOString())
        .lte('viewed_at', endDate.toISOString()),

      // Professional verifications
      supabase
        .from('professional_verifications')
        .select('id, created_at, approved_at, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),

      // User statistics
      supabase
        .from('profiles')
        .select('id, user_type, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),

      // Article statistics
      supabase
        .from('articles')
        .select('id, status, created_at, updated_at'),

      // Chat engagement for revenue metrics
      supabase
        .from('chat_sessions')
        .select('id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    ])

    // Calculate metrics
    const pageviews = articleViews.data?.length || 0
    const avgEngagement = chatSessions.data ? (chatSessions.data.length / pageviews * 100) : 0
    
    // Ad revenue calculation: £2 CPM (cost per thousand impressions)
    const adRevenuePotential = (pageviews / 1000) * 2

    // Professional conversions
    const verifications = professionalVerifications.data || []
    const approved = verifications.filter(v => v.status === 'approved').length
    const started = verifications.length
    const verificationRate = started > 0 ? (approved / started * 100) : 0

    // Calculate average time to convert (in days)
    const approvedVerifications = verifications.filter(v => v.status === 'approved' && v.approved_at)
    const avgTimeToConvert = approvedVerifications.length > 0
      ? approvedVerifications.reduce((sum, v) => {
          const createdAt = new Date(v.created_at).getTime()
          const approvedAt = new Date(v.approved_at!).getTime()
          return sum + ((approvedAt - createdAt) / (1000 * 60 * 60 * 24))
        }, 0) / approvedVerifications.length
      : 0

    // User metrics
    const users = userStats.data || []
    const professionals = users.filter(u => u.user_type === 'professional')
    const totalUsers = users.length

    // Article metrics
    const articles = articleStats.data || []
    const publishedArticles = articles.filter(a => a.status === 'published').length

    // Calculate changes (comparing to previous period)
    const previousStartDate = startOfDay(subDays(new Date(), (days * 2) - 1))
    const previousEndDate = startOfDay(subDays(new Date(), days))

    const [previousViews] = await Promise.all([
      supabase
        .from('article_views')
        .select('id')
        .gte('viewed_at', previousStartDate.toISOString())
        .lte('viewed_at', previousEndDate.toISOString())
    ])

    const previousPageviews = previousViews.data?.length || 0
    const pageviewChange = previousPageviews > 0 
      ? ((pageviews - previousPageviews) / previousPageviews * 100)
      : 0

    return NextResponse.json({
      adRevenuePotential: {
        value: adRevenuePotential,
        change: pageviewChange,
        pageviews,
        avgEngagement: Math.round(avgEngagement)
      },
      professionalConversions: {
        value: approved,
        change: 0, // Would need historical data
        verificationRate: Math.round(verificationRate),
        avgTimeToConvert: Math.round(avgTimeToConvert)
      },
      userMetrics: {
        totalUsers,
        activeUsers: totalUsers, // Would need activity tracking
        professionalUsers: professionals.length,
        change: 0 // Would need historical data
      },
      contentMetrics: {
        totalArticles: articles.length,
        publishedArticles,
        avgReadTime: 3.5, // Would need to track this
        change: 0
      }
    })
  } catch (error) {
    console.error('Failed to fetch revenue metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue metrics' },
      { status: 500 }
    )
  }
}
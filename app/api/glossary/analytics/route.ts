import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { auth } from '@clerk/nextjs/server'
import { ApiErrors } from '@/lib/api-errors'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { userId } = await auth()
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    const isAdmin = profile?.role === 'admin'
    
    // Get time range from query params
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    const category = searchParams.get('category')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Get most viewed terms
    const { data: mostViewed, error: viewError } = await supabase
      .from('glossary_term_stats')
      .select('term, category, view_count, copy_count, youtube_count')
      .gt('view_count', 0)
      .order('view_count', { ascending: false })
      .limit(10)
    
    if (viewError) {
      return ApiErrors.databaseError(viewError)
    }
    
    // Get search trends (including not found searches)
    const { data: searches, error: searchError } = await supabase
      .from('glossary_interactions')
      .select('metadata, created_at')
      .eq('interaction_type', 'search')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (searchError) {
      return ApiErrors.databaseError(searchError)
    }
    
    // Process search data
    const searchTerms: Record<string, number> = {}
    const notFoundTerms: Record<string, number> = {}
    
    searches?.forEach(search => {
      const term = search.metadata?.searched_term || ''
      const found = search.metadata?.found !== false
      
      if (found) {
        searchTerms[term] = (searchTerms[term] || 0) + 1
      } else {
        notFoundTerms[term] = (notFoundTerms[term] || 0) + 1
      }
    })
    
    // Sort and get top searches
    const topSearches = Object.entries(searchTerms)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([term, count]) => ({ term, count }))
    
    const topNotFound = Object.entries(notFoundTerms)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([term, count]) => ({ term, count }))
    
    // Get category breakdown
    const { data: categoryStats, error: catError } = await supabase
      .from('glossary_term_stats')
      .select('category, sum(view_count)')
      .groupBy('category')
    
    if (catError) {
      console.error('Category stats error:', catError)
    }
    
    // Get user's personal stats if not admin
    let userStats = null
    if (!isAdmin && userId) {
      const { data: personalStats } = await supabase
        .from('glossary_interactions')
        .select('interaction_type, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
      
      const { data: quizStats } = await supabase
        .from('user_quiz_stats')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      userStats = {
        totalInteractions: personalStats?.length || 0,
        quizAccuracy: quizStats?.accuracy_percentage || 0,
        daysPracticed: quizStats?.days_practiced || 0
      }
    }
    
    return NextResponse.json({
      timeRange: { days, startDate: startDate.toISOString() },
      mostViewed,
      topSearches,
      topNotFound,
      categoryStats,
      userStats,
      isAdmin
    })
    
  } catch (error) {
    console.error('Analytics error:', error)
    return ApiErrors.internalError('glossary-analytics', error)
  }
}
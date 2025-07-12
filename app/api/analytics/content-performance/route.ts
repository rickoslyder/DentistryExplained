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
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const supabase = await createServerSupabaseClient()
    const startDate = startOfDay(subDays(new Date(), days - 1))
    const endDate = endOfDay(new Date())

    // Fetch article performance data
    const { data: articles } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        category,
        slug,
        created_at
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (!articles) {
      return NextResponse.json([])
    }

    // Get view counts and engagement metrics for each article
    const performanceData = await Promise.all(
      articles.map(async (article) => {
        // Get view count
        const { count: viewCount } = await supabase
          .from('article_views')
          .select('*', { count: 'exact', head: true })
          .eq('article_id', article.id)
          .gte('viewed_at', startDate.toISOString())
          .lte('viewed_at', endDate.toISOString())

        // Get bookmark count as engagement metric
        const { count: bookmarkCount } = await supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('article_id', article.id)

        // Get chat sessions that referenced this article
        const { count: chatReferences } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .ilike('content', `%${article.title}%`)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())

        // Calculate metrics
        const avgTimeOnPage = 3.5 // Would need real tracking
        const scrollDepth = 65 // Would need real tracking
        const engagementScore = Math.min(100, 
          (viewCount || 0) * 0.5 + 
          (bookmarkCount || 0) * 10 + 
          (chatReferences || 0) * 5
        )
        
        // Revenue value calculation (based on views * CPM)
        const revenueValue = ((viewCount || 0) / 1000) * 2 // £2 CPM

        return {
          id: article.id,
          title: article.title,
          category: article.category,
          views: viewCount || 0,
          avgTimeOnPage,
          scrollDepth,
          engagementScore: Math.round(engagementScore),
          revenueValue
        }
      })
    )

    // Sort by views and limit
    const sortedData = performanceData
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)

    return NextResponse.json(sortedData)
  } catch (error) {
    console.error('Failed to fetch content performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content performance' },
      { status: 500 }
    )
  }
}
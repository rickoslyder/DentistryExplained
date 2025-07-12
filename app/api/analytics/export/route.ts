import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')
    const format = searchParams.get('format') || 'csv'

    // Fetch analytics data
    const data = await getAnalyticsData(days)

    if (format === 'json') {
      // Return JSON format
      return NextResponse.json({
        metadata: {
          generatedAt: new Date().toISOString(),
          timeRange: `Last ${days} days`,
          recordCount: data.totalRecords
        },
        data
      })
    } else {
      // Generate CSV
      const csv = generateCSV(data, days)
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`
        }
      })
    }
  } catch (error) {
    console.error('Failed to export analytics:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    )
  }
}

async function getAnalyticsData(days: number) {
  const supabase = await createServerSupabaseClient()
  const startDate = startOfDay(subDays(new Date(), days - 1))
  const endDate = endOfDay(new Date())

  // Fetch various analytics data
  const [
    articleViews,
    chatSessions,
    searchData,
    userActivity,
    glossaryInteractions
  ] = await Promise.all([
    // Article views
    supabase
      .from('article_views')
      .select(`
        viewed_at,
        article_id,
        articles!inner(title, category)
      `)
      .gte('viewed_at', startDate.toISOString())
      .lte('viewed_at', endDate.toISOString()),

    // Chat sessions
    supabase
      .from('chat_sessions')
      .select('id, user_id, created_at, message_count')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),

    // Search data
    supabase
      .from('web_searches')
      .select('query, source, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),

    // User activity
    supabase
      .from('activity_logs')
      .select('action, resource_type, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),

    // Glossary interactions
    supabase
      .from('glossary_interactions')
      .select('term_id, interaction_type, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
  ])

  return {
    articleViews: articleViews.data || [],
    chatSessions: chatSessions.data || [],
    searches: searchData.data || [],
    userActivity: userActivity.data || [],
    glossaryInteractions: glossaryInteractions.data || [],
    totalRecords: 
      (articleViews.data?.length || 0) +
      (chatSessions.data?.length || 0) +
      (searchData.data?.length || 0) +
      (userActivity.data?.length || 0) +
      (glossaryInteractions.data?.length || 0)
  }
}

function generateCSV(data: any, days: number): string {
  const lines: string[] = []
  
  // Header
  lines.push(`Dentistry Explained Analytics Export`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(`Time Range: Last ${days} days`)
  lines.push('')

  // Article Views Section
  lines.push('ARTICLE VIEWS')
  lines.push('Date,Article Title,Category')
  data.articleViews.forEach((view: any) => {
    lines.push(`${view.viewed_at},${escapeCSV(view.articles.title)},${view.articles.category}`)
  })
  lines.push('')

  // Chat Sessions Section
  lines.push('CHAT SESSIONS')
  lines.push('Date,Session ID,Message Count')
  data.chatSessions.forEach((session: any) => {
    lines.push(`${session.created_at},${session.id},${session.message_count || 0}`)
  })
  lines.push('')

  // Searches Section
  lines.push('SEARCHES')
  lines.push('Date,Query,Source')
  data.searches.forEach((search: any) => {
    lines.push(`${search.created_at},${escapeCSV(search.query)},${search.source}`)
  })
  lines.push('')

  // User Activity Section
  lines.push('USER ACTIVITY')
  lines.push('Date,Action,Resource Type')
  data.userActivity.forEach((activity: any) => {
    lines.push(`${activity.created_at},${activity.action},${activity.resource_type}`)
  })
  lines.push('')

  // Summary Statistics
  lines.push('SUMMARY STATISTICS')
  lines.push(`Total Article Views,${data.articleViews.length}`)
  lines.push(`Total Chat Sessions,${data.chatSessions.length}`)
  lines.push(`Total Searches,${data.searches.length}`)
  lines.push(`Total User Actions,${data.userActivity.length}`)
  lines.push(`Total Glossary Interactions,${data.glossaryInteractions.length}`)

  return lines.join('\n')
}

function escapeCSV(value: string): string {
  if (!value) return ''
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
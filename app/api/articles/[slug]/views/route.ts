import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createRouteSupabaseClient, getCurrentUserProfile } from '@/lib/supabase-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { userId } = auth()
    const { slug } = params
    
    if (!slug) {
      return NextResponse.json({ error: 'Article slug is required' }, { status: 400 })
    }

    // Get the user's profile ID if they're logged in
    let userProfileId = null
    if (userId) {
      const userProfile = await getCurrentUserProfile()
      userProfileId = userProfile?.id || null
    }

    // Get user agent and IP for analytics
    const userAgent = request.headers.get('user-agent') || undefined
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || undefined

    // Get session ID from request body or generate one
    const body = await request.json().catch(() => ({}))
    const sessionId = body.sessionId || request.headers.get('x-session-id')

    // Create authenticated Supabase client
    const supabase = await createRouteSupabaseClient()

    // Track the view
    const { error } = await supabase
      .from('article_views')
      .insert([
        {
          article_slug: slug,
          user_id: userProfileId,
          session_id: sessionId || null,
          ip_address: ip,
          user_agent: userAgent,
        },
      ])

    if (error) {
      console.error('Error tracking article view:', error)
      // Don't return error to user - analytics failures shouldn't break the experience
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Article view tracking error:', error)
    return NextResponse.json({ success: false })
  }
}

// Get article view statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    if (!slug) {
      return NextResponse.json({ error: 'Article slug is required' }, { status: 400 })
    }

    // Create authenticated Supabase client
    const supabase = await createRouteSupabaseClient()

    // Get view statistics for the article
    const { data, error } = await supabase
      .from('article_views')
      .select('*')
      .eq('article_slug', slug)

    if (error) {
      throw error
    }

    // Calculate statistics
    const totalViews = data?.length || 0
    const uniqueVisitors = new Set(data?.map(v => v.ip_address).filter(Boolean)).size
    const loggedInViews = data?.filter(v => v.user_id).length || 0

    // Get recent views (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentViews = data?.filter(v => new Date(v.viewed_at) > sevenDaysAgo).length || 0

    return NextResponse.json({
      slug,
      totalViews,
      uniqueVisitors,
      loggedInViews,
      recentViews,
    })
  } catch (error) {
    console.error('Article view statistics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch view statistics' },
      { status: 500 }
    )
  }
}
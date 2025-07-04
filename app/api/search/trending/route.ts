import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeWindow = searchParams.get('window') || '7 days'
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const supabase = await createServerSupabaseClient()
    
    // Get trending searches using our PostgreSQL function
    const { data: trending, error } = await supabase
      .rpc('get_trending_searches', {
        time_window: timeWindow,
        limit_results: limit
      })
    
    if (error) {
      console.error('Trending searches error:', error)
      return NextResponse.json({ error: 'Failed to get trending searches' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      trending: trending || []
    })
    
  } catch (error) {
    console.error('Trending searches error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.length < 1) {
      return NextResponse.json({ suggestions: [] })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get search suggestions using our PostgreSQL function
    const { data: suggestions, error } = await supabase
      .rpc('get_search_suggestions', {
        partial_query: query,
        suggestion_limit: 8
      })
    
    if (error) {
      console.error('Suggestions error:', error)
      return NextResponse.json({ error: 'Failed to get suggestions' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      suggestions: suggestions || []
    })
    
  } catch (error) {
    console.error('Suggestions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
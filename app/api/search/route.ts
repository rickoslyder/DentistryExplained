import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], suggestions: [] })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Use our PostgreSQL full-text search function
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_content', {
        search_query: query,
        search_category: category && category !== 'all' ? category : null,
        result_limit: limit,
        result_offset: offset
      })
    
    if (searchError) {
      console.error('Search error:', searchError)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
    
    // Get search suggestions for autocomplete
    const { data: suggestions, error: suggestionsError } = await supabase
      .rpc('get_search_suggestions', {
        partial_query: query,
        suggestion_limit: 5
      })
    
    if (suggestionsError) {
      console.error('Suggestions error:', suggestionsError)
    }
    
    // Track the search query for analytics
    const { error: trackingError } = await supabase
      .from('search_queries')
      .insert({
        query: query,
        results_count: searchResults?.length || 0,
        session_id: request.headers.get('x-session-id') || null
      })
    
    if (trackingError) {
      console.error('Search tracking error:', trackingError)
    }
    
    // Transform results to match frontend expectations
    const transformedResults = searchResults?.map(result => ({
      id: result.id,
      title: result.title,
      description: result.excerpt,
      type: result.content_type,
      category: result.category,
      url: result.url_path,
      relevance: result.rank
    })) || []
    
    return NextResponse.json({ 
      results: transformedResults,
      suggestions: suggestions || [],
      totalResults: transformedResults.length,
      hasMore: transformedResults.length === limit
    })
    
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, clicked_result_id, clicked_result } = body
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Update the search query record with the clicked result
    const { error } = await supabase
      .from('search_queries')
      .update({
        clicked_result_id: clicked_result_id,
        clicked_result: clicked_result
      })
      .eq('query', query)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('Failed to update search query:', error)
      return NextResponse.json({ error: 'Failed to track click' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Search tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
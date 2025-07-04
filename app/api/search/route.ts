import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'relevance'
    
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Build the search query
    let searchQuery = supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        read_time,
        views,
        tags,
        published_at,
        category:categories!inner(name, slug)
      `)
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
    
    // Apply category filter
    if (category && category !== 'all') {
      searchQuery = searchQuery.eq('categories.slug', category)
    }
    
    // Apply sorting
    switch (sort) {
      case 'newest':
        searchQuery = searchQuery.order('published_at', { ascending: false })
        break
      case 'popular':
        searchQuery = searchQuery.order('views', { ascending: false })
        break
      case 'relevance':
      default:
        // For relevance, we'll sort by a combination of factors
        // In a real implementation, you might use full-text search with relevance scoring
        searchQuery = searchQuery.order('views', { ascending: false })
        break
    }
    
    // Limit results
    searchQuery = searchQuery.limit(20)
    
    const { data: results, error } = await searchQuery
    
    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
    
    // Add basic relevance scoring (in production, use proper full-text search)
    const scoredResults = results?.map(article => {
      let relevance = 0
      const lowerQuery = query.toLowerCase()
      
      // Title match (highest weight)
      if (article.title.toLowerCase().includes(lowerQuery)) {
        relevance += 10
      }
      
      // Excerpt match (medium weight)
      if (article.excerpt?.toLowerCase().includes(lowerQuery)) {
        relevance += 5
      }
      
      // Tag match (lower weight)
      if (article.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        relevance += 3
      }
      
      return { ...article, relevance }
    }) || []
    
    // Sort by relevance if that's the selected sort
    if (sort === 'relevance') {
      scoredResults.sort((a, b) => b.relevance - a.relevance)
    }
    
    return NextResponse.json({ results: scoredResults })
    
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
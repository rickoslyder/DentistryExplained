import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get URL parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const timeframe = searchParams.get('timeframe') || '7d' // 7d, 30d, all
    
    // Calculate date range
    let dateFilter = new Date()
    switch (timeframe) {
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7)
        break
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30)
        break
      case 'all':
        dateFilter = new Date('2000-01-01') // Far past date
        break
    }
    
    // Get trending terms based on interaction count
    const { data: trendingData, error: trendingError } = await supabase
      .from('glossary_interactions')
      .select('term, interaction_type')
      .gte('created_at', dateFilter.toISOString())
      .order('created_at', { ascending: false })
    
    if (trendingError) {
      console.error('Error fetching trending terms:', trendingError)
      return NextResponse.json({ error: 'Failed to fetch trending terms' }, { status: 500 })
    }
    
    // Count interactions by term
    const termCounts = new Map<string, { views: number, searches: number, total: number }>()
    
    trendingData?.forEach(interaction => {
      const current = termCounts.get(interaction.term) || { views: 0, searches: 0, total: 0 }
      
      if (interaction.interaction_type === 'view') {
        current.views++
      } else if (interaction.interaction_type === 'search') {
        current.searches++
      }
      current.total++
      
      termCounts.set(interaction.term, current)
    })
    
    // Sort by total interactions and get top terms
    const topTerms = Array.from(termCounts.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, limit)
      .map(([term, stats]) => term)
    
    // If we don't have enough trending terms, add some popular defaults
    const defaultTerms = ['Implant', 'Root Canal', 'Wisdom Teeth', 'Crown', 'Cavity', 
                         'Gum Disease', 'Veneer', 'Bruxism', 'Fluoride', 'Clear Aligners']
    
    while (topTerms.length < limit && topTerms.length < defaultTerms.length) {
      const defaultTerm = defaultTerms[topTerms.length]
      if (!topTerms.includes(defaultTerm)) {
        topTerms.push(defaultTerm)
      }
    }
    
    // Fetch full term details
    const { data: terms, error: termsError } = await supabase
      .from('glossary_terms')
      .select('*')
      .in('term', topTerms)
    
    if (termsError) {
      console.error('Error fetching term details:', termsError)
      return NextResponse.json({ error: 'Failed to fetch term details' }, { status: 500 })
    }
    
    // Sort terms by their trending order
    const sortedTerms = topTerms
      .map(termName => terms?.find(t => t.term === termName))
      .filter(Boolean)
    
    // Add interaction stats to each term
    const termsWithStats = sortedTerms.map(term => ({
      ...term,
      stats: termCounts.get(term.term) || { views: 0, searches: 0, total: 0 }
    }))
    
    return NextResponse.json({ 
      terms: termsWithStats,
      timeframe,
      totalInteractions: Array.from(termCounts.values()).reduce((sum, stats) => sum + stats.total, 0)
    })
    
  } catch (error) {
    console.error('Trending terms error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
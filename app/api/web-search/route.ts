import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { webSearch, searchDentalResearch, searchNHSInfo, searchDentalNews } from '@/lib/web-search'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

// Request schema
const searchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  searchType: z.enum(['general', 'medical', 'news', 'academic']).optional(),
  specializedSearch: z.enum(['research', 'nhs', 'news']).optional(),
  maxResults: z.number().min(1).max(50).optional(),
  requireAuth: z.boolean().optional().default(true)
})

export async function POST(request: NextRequest) {
  try {
    // Parse request
    const body = await request.json()
    const params = searchRequestSchema.parse(body)
    
    // Check authentication if required
    if (params.requireAuth) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      // Track search for analytics
      const supabase = await createServerSupabaseClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single()
      
      if (profile) {
        // Log search query (without results for privacy)
        await supabase
          .from('web_searches')
          .insert({
            user_id: profile.id,
            query: params.query,
            search_type: params.searchType || params.specializedSearch || 'general',
            created_at: new Date().toISOString()
          })
          .select()
          .single()
      }
    }
    
    // Perform search based on type
    let searchResults
    
    if (params.specializedSearch === 'research') {
      searchResults = await searchDentalResearch(params.query)
    } else if (params.specializedSearch === 'nhs') {
      searchResults = await searchNHSInfo(params.query)
    } else if (params.specializedSearch === 'news') {
      searchResults = await searchDentalNews(params.query)
    } else {
      searchResults = await webSearch(params.query, {
        searchType: params.searchType,
        maxResults: params.maxResults
      })
    }
    
    return NextResponse.json(searchResults)
    
  } catch (error) {
    console.error('Web search API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: error.errors 
      }, { status: 400 })
    }
    
    if (error instanceof Error && error.message.includes('API key not configured')) {
      return NextResponse.json({ 
        error: 'Search service not configured' 
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to perform search' 
    }, { status: 500 })
  }
}

// Rate limiting headers
export async function GET() {
  return NextResponse.json({
    message: 'Web search API',
    endpoints: {
      search: 'POST /api/web-search',
      types: ['general', 'medical', 'news', 'academic'],
      specialized: ['research', 'nhs', 'news']
    }
  })
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'

// Advanced search parameters schema
const advancedSearchSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    status: z.array(z.enum(['draft', 'published', 'archived'])).optional(),
    categories: z.array(z.string()).optional(),
    authors: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional()
    }).optional(),
    readingLevel: z.array(z.enum(['basic', 'intermediate', 'advanced'])).optional(),
    contentType: z.array(z.enum(['article', 'guide', 'news', 'research'])).optional(),
    hasImages: z.boolean().optional(),
    wordCountRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional()
    }).optional()
  }).optional(),
  sort: z.object({
    field: z.enum(['relevance', 'date', 'title', 'views', 'readTime']).default('relevance'),
    order: z.enum(['asc', 'desc']).default('desc')
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
  }).optional()
})

const advancedSearchHandler = compose(
  withRateLimit(60000, 100),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const body = await request.json()
    const params = advancedSearchSchema.parse(body)
    
    const supabase = context.supabase!
    const { query, filters = {}, sort = { field: 'relevance', order: 'desc' }, pagination = { page: 1, limit: 20 } } = params
    
    // Calculate offset
    const offset = (pagination.page - 1) * pagination.limit
    
    // Use the advanced search RPC function
    const { data: searchResults, error } = await supabase
      .rpc('search_articles_advanced', {
        search_query: query || null,
        filter_status: filters.status || null,
        filter_categories: filters.categories || null,
        filter_authors: filters.authors || null,
        filter_tags: filters.tags || null,
        filter_date_start: filters.dateRange?.start || null,
        filter_date_end: filters.dateRange?.end || null,
        filter_reading_level: filters.readingLevel || null,
        filter_content_type: filters.contentType || null,
        filter_has_images: filters.hasImages ?? null,
        filter_word_count_min: filters.wordCountRange?.min || null,
        filter_word_count_max: filters.wordCountRange?.max || null,
        sort_field: sort.field,
        sort_order: sort.order,
        result_limit: pagination.limit,
        result_offset: offset
      })
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'advanced_search', requestId)
    }
    
    // Get total count for pagination
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .match(filters.status ? { status: filters.status[0] } : {})
    
    // Enrich search results with related data
    const enrichedResults = await Promise.all((searchResults || []).map(async (article) => {
      // Get category details
      const { data: category } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('id', article.category_id)
        .single()
      
      // Get author details
      const { data: author } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', article.author_id)
        .single()
      
      return {
        ...article,
        category: category || { id: article.category_id, name: 'Unknown', slug: 'unknown' },
        author: author || { id: article.author_id, first_name: 'Unknown', last_name: 'Author', email: '' }
      }
    }))
    
    // Get aggregations for filters
    const aggregations = await getSearchAggregations(supabase, filters)
    
    // Log the search in activity logs
    await supabase
      .from('activity_logs')
      .insert({
        user_id: context.userId,
        action: 'advanced_search',
        resource_type: 'article',
        resource_id: null,
        details: {
          query,
          filters,
          results_count: searchResults?.length || 0,
          page: pagination.page
        }
      })
    
    return NextResponse.json({
      results: enrichedResults,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pagination.limit)
      },
      aggregations,
      query: {
        text: query,
        filters,
        sort
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.fromValidationError(error, requestId)
    }
    return ApiErrors.internal(error, 'advanced_search', requestId)
  }
})

// Get aggregations for filter options
async function getSearchAggregations(supabase: any, currentFilters: any) {
  try {
    // Get category counts
    const { data: categories } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        articles!inner(id)
      `)
      .eq('articles.status', 'published')
    
    // Get author counts
    const { data: authors } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        articles!articles_author_id_fkey!inner(id)
      `)
      .eq('articles.status', 'published')
    
    // Get status counts
    const { data: statusCounts } = await supabase
      .from('articles')
      .select('status')
      .select('status', { count: 'exact' })
    
    // Get reading level counts
    const { data: readingLevels } = await supabase
      .from('articles')
      .select('reading_level')
      .eq('status', 'published')
      .not('reading_level', 'is', null)
    
    // Process aggregations
    const categoryAggregations = categories?.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: cat.articles?.length || 0
    })) || []
    
    const authorAggregations = authors?.map(author => ({
      id: author.id,
      name: `${author.first_name} ${author.last_name}`,
      count: author.articles?.length || 0
    })) || []
    
    const readingLevelCounts = readingLevels?.reduce((acc: any, item: any) => {
      acc[item.reading_level] = (acc[item.reading_level] || 0) + 1
      return acc
    }, {})
    
    return {
      categories: categoryAggregations,
      authors: authorAggregations,
      readingLevels: readingLevelCounts || {},
      totalResults: statusCounts?.length || 0
    }
  } catch (error) {
    console.error('Failed to get search aggregations:', error)
    return {
      categories: [],
      authors: [],
      readingLevels: {},
      totalResults: 0
    }
  }
}

export const POST = advancedSearchHandler
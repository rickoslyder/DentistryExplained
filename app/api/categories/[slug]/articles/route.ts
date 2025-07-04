import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const requestId = getRequestId(request)
  
  try {
    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '12')
    
    const supabase = await createServerSupabaseClient()
    
    // Get category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.slug)
      .single()
    
    if (categoryError || !category) {
      return ApiErrors.notFound('Category', requestId)
    }
    
    // Get articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select(`
        id,
        slug,
        title,
        excerpt,
        read_time,
        views,
        is_featured,
        published_at,
        tags
      `)
      .eq('category_id', category.id)
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'fetch_articles', requestId)
    }
    
    return NextResponse.json({
      articles: articles || [],
      hasMore: articles?.length === limit
    })
  } catch (error) {
    return ApiErrors.internal(error, 'category_articles', requestId)
  }
}
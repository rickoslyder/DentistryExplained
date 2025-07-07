import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, withCSRF, withRateLimit, withAudit, withCORS, compose } from '@/lib/api-middleware'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { sanitizeArticleContent, sanitizePlainText } from '@/lib/sanitization-server'

// Article validation schema
const articleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  category_id: z.string().uuid('Invalid category'),
  status: z.enum(['draft', 'published', 'archived']),
  tags: z.array(z.string()).optional().default([]),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.array(z.string()).optional().default([]),
  is_featured: z.boolean().optional().default(false),
  allow_comments: z.boolean().optional().default(true),
})

// POST handler with CSRF protection
const createArticleHandler = compose(
  withAudit({ 
    action: 'create_article',
    entityType: 'articles',
    includeRequestBody: true,
    includeResponseData: true
  }),
  withRateLimit(60000, 30), // 30 requests per minute
  withCORS(),
  withCSRF,
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const user = context.userProfile!
    
    // Check if user is admin/editor
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['admin', 'editor'].includes(profile.role || '')) {
      return ApiErrors.forbidden('Admin or editor access required', requestId)
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = articleSchema.parse(body)
    
    // Sanitize all input data
    const sanitizedData = {
      ...validatedData,
      title: sanitizePlainText(validatedData.title),
      slug: sanitizePlainText(validatedData.slug),
      content: sanitizeArticleContent(validatedData.content),
      excerpt: validatedData.excerpt ? sanitizePlainText(validatedData.excerpt) : undefined,
      tags: validatedData.tags?.map(tag => sanitizePlainText(tag)) || [],
      meta_title: validatedData.meta_title ? sanitizePlainText(validatedData.meta_title) : undefined,
      meta_description: validatedData.meta_description ? sanitizePlainText(validatedData.meta_description) : undefined,
      meta_keywords: validatedData.meta_keywords?.map(kw => sanitizePlainText(kw)) || [],
    }
    
    // Calculate read time (rough estimate: 225 words per minute)
    const wordCount = sanitizedData.content.split(/\s+/g).length
    const readTime = Math.ceil(wordCount / 225)
    
    // Insert article
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        ...sanitizedData,
        author_id: profile.id,
        read_time: readTime,
        published_at: sanitizedData.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single()
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'create_article', requestId)
    }
    
    // Create initial revision
    const { error: revisionError } = await supabase.rpc('save_article_revision', {
      p_article_id: article.id,
      p_author_id: profile.id,
      p_change_summary: 'Initial version'
    })
    
    if (revisionError) {
      console.error('Failed to save initial revision:', revisionError)
    }
    
    return NextResponse.json(article, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error, 'create_article', requestId)
    }
    return ApiErrors.internal(error, 'create_article', requestId)
  }
})

// GET handler (no CSRF needed for GET requests)
const getArticlesHandler = compose(
  withAudit({ 
    action: 'list_articles',
    entityType: 'articles'
  }),
  withRateLimit(60000, 100),
  withCORS(),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const user = context.userProfile!
    
    // Check if user has access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['admin', 'editor'].includes(profile.role || '')) {
      return ApiErrors.forbidden('Admin or editor access required', requestId)
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build query
    let query = supabase
      .from('articles')
      .select(`
        *,
        category:categories(id, name, slug),
        author:profiles(id, name, display_name)
      `, { count: 'exact' })
    
    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (category) {
      query = query.eq('category_id', category)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }
    
    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data: articles, error, count } = await query
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'get_articles', requestId)
    }
    
    return NextResponse.json({
      articles: articles || [],
      total: count || 0,
      limit,
      offset
    })
    
  } catch (error) {
    return ApiErrors.internal(error, 'get_articles', requestId)
  }
})

export const POST = createArticleHandler
export const GET = getArticlesHandler
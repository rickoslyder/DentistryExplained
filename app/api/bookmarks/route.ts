import { NextRequest, NextResponse } from 'next/server'
import { ApiErrors, validateRequestBody, validateQueryParams, paginationSchema, mapDatabaseError } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'

// Schema for creating bookmark
const createBookmarkSchema = z.object({
  articleSlug: z.string().min(1).max(255),
  articleTitle: z.string().min(1).max(500),
  articleCategory: z.string().optional(),
})

const createBookmarkHandler = compose(
  withRateLimit(60000, 50), // 50 bookmarks per minute
  withAuth
)(async (request: NextRequest, context) => {
  const body = await request.json()
  
  // Validate request body
  const { data: params, error: validationError } = validateRequestBody(
    body,
    createBookmarkSchema,
    context.requestId
  )
  
  if (validationError) {
    return validationError
  }
  
  const { articleSlug, articleTitle, articleCategory } = params
  const { userProfile, supabase } = context

  // Check if bookmark already exists
  const { data: existing, error: checkError } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userProfile.id)
    .eq('article_slug', articleSlug)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    return mapDatabaseError(checkError, 'check_bookmark', context.requestId)
  }

  if (existing) {
    return ApiErrors.duplicate('Bookmark', 'article')
  }

  // Create bookmark
  const { data: bookmark, error } = await supabase
    .from('bookmarks')
    .insert([
      {
        user_id: userProfile.id,
        article_slug: articleSlug,
        article_title: articleTitle,
        article_category: articleCategory,
      },
    ])
    .select()
    .single()

  if (error) {
    return mapDatabaseError(error, 'create_bookmark', context.requestId)
  }

  return NextResponse.json({ 
    success: true,
    bookmark,
    message: 'Bookmark created successfully'
  })
})

export const POST = createBookmarkHandler

// Schema for fetching bookmarks
const getBookmarksSchema = z.object({
  category: z.string().optional(),
  ...paginationSchema.shape,
})

const getBookmarksHandler = withAuth(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url)
  
  // Validate query parameters
  const { data: params, error: validationError } = validateQueryParams(
    searchParams,
    getBookmarksSchema,
    context.requestId
  )
  
  if (validationError) {
    return validationError
  }
  
  const { category, limit, offset } = params
  const { userProfile, supabase } = context

  let query = supabase
    .from('bookmarks')
    .select('*, count:id.count()', { count: 'exact', head: false })
    .eq('user_id', userProfile.id)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('article_category', category)
  }

  const { data: bookmarks, error, count } = await query
    .range(offset, offset + limit - 1)

  if (error) {
    return mapDatabaseError(error, 'fetch_bookmarks', context.requestId)
  }

  return NextResponse.json({ 
    bookmarks: bookmarks || [],
    total: count || 0,
    limit,
    offset,
    hasMore: (count || 0) > offset + limit
  })
})

export const GET = getBookmarksHandler

// Schema for deleting bookmark
const deleteBookmarkSchema = z.object({
  articleSlug: z.string().min(1),
})

const deleteBookmarkHandler = compose(
  withRateLimit(60000, 50), // 50 deletions per minute
  withAuth
)(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url)
  
  // Validate query parameters
  const { data: params, error: validationError } = validateQueryParams(
    searchParams,
    deleteBookmarkSchema
  )
  
  if (validationError) {
    return validationError
  }
  
  const { articleSlug } = params
  const { userProfile, supabase } = context

  // Check if bookmark exists first
  const { data: existing, error: checkError } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userProfile.id)
    .eq('article_slug', articleSlug)
    .single()

  if (checkError) {
    if (checkError.code === 'PGRST116') {
      return ApiErrors.notFound('Bookmark')
    }
    return mapDatabaseError(checkError, 'check_bookmark_exists', context.requestId)
  }

  // Delete bookmark
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userProfile.id)
    .eq('article_slug', articleSlug)

  if (error) {
    return mapDatabaseError(error, 'delete_bookmark', context.requestId)
  }

  return NextResponse.json({ 
    success: true,
    message: 'Bookmark deleted successfully'
  })
})

export const DELETE = deleteBookmarkHandler
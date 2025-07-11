import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'

// Schema for updating comment
const updateCommentSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']).optional(),
  content: z.string().optional()
})

// GET /api/admin/comments - List comments with filtering
const getCommentsHandler = compose(
  withRateLimit(60000, 100),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const user = context.userProfile!
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const articleId = searchParams.get('article_id')
    const userId = searchParams.get('user_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let query = supabase
      .from('comments')
      .select(`
        *,
        articles (title, slug),
        profiles (first_name, last_name, email, avatar_url),
        comment_reports (id, reason, status),
        _count:comment_reactions(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (articleId) {
      query = query.eq('article_id', articleId)
    }
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    if (search) {
      query = query.ilike('content', `%${search}%`)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'get_comments', requestId)
    }
    
    return NextResponse.json({
      comments: data,
      total: count,
      limit,
      offset
    })
  } catch (error) {
    return ApiErrors.internal(error, 'get_comments', requestId)
  }
})

// PATCH /api/admin/comments/[id] - Update comment
const updateCommentHandler = compose(
  withRateLimit(60000, 100),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const user = context.userProfile!
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)
    
    // Extract comment ID from URL
    const url = new URL(request.url)
    const commentId = url.pathname.split('/').pop()
    
    if (!commentId) {
      return ApiErrors.validation(
        { commentId: ['Comment ID is required'] },
        'update_comment',
        requestId
      )
    }
    
    const { data, error } = await supabase
      .from('comments')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single()
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'update_comment', requestId)
    }
    
    // Log the action
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'moderate',
        resource_type: 'comment',
        resource_id: commentId,
        details: {
          changes: validatedData
        }
      })
    
    return NextResponse.json({ comment: data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error, 'update_comment', requestId)
    }
    return ApiErrors.internal(error, 'update_comment', requestId)
  }
})

// DELETE /api/admin/comments/[id] - Delete comment
const deleteCommentHandler = compose(
  withRateLimit(60000, 100),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const user = context.userProfile!
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    // Extract comment ID from URL
    const url = new URL(request.url)
    const commentId = url.pathname.split('/').pop()
    
    if (!commentId) {
      return ApiErrors.validation(
        { commentId: ['Comment ID is required'] },
        'delete_comment',
        requestId
      )
    }
    
    // Get comment details before deletion
    const { data: comment } = await supabase
      .from('comments')
      .select('content, article_id')
      .eq('id', commentId)
      .single()
    
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'delete_comment', requestId)
    }
    
    // Log the action
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'delete',
        resource_type: 'comment',
        resource_id: commentId,
        details: {
          content_preview: comment?.content?.substring(0, 100),
          article_id: comment?.article_id
        }
      })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, 'delete_comment', requestId)
  }
})

export const GET = getCommentsHandler
export const PATCH = updateCommentHandler
export const DELETE = deleteCommentHandler

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}
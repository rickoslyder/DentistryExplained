import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'

// Schema for updating report
const updateReportSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']),
  commentAction: z.enum(['approved', 'rejected', 'flagged']).optional()
})

// GET /api/admin/comments/reports - List comment reports
const getReportsHandler = compose(
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let query = supabase
      .from('comment_reports')
      .select(`
        *,
        comments (
          id,
          content,
          status,
          user_id,
          profiles (first_name, last_name, email)
        ),
        reporter:profiles!comment_reports_reporter_id_fkey (
          first_name,
          last_name,
          email,
          avatar_url
        ),
        reviewer:profiles!comment_reports_reviewed_by_fkey (
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'get_reports', requestId)
    }
    
    return NextResponse.json({
      reports: data,
      total: count,
      limit,
      offset
    })
  } catch (error) {
    return ApiErrors.internal(error, 'get_reports', requestId)
  }
})

// PATCH /api/admin/comments/reports/[id] - Update report
const updateReportHandler = compose(
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
    const validatedData = updateReportSchema.parse(body)
    
    // Extract report ID from URL
    const url = new URL(request.url)
    const reportId = url.pathname.split('/').pop()
    
    if (!reportId) {
      return ApiErrors.validation(
        { reportId: ['Report ID is required'] },
        'update_report',
        requestId
      )
    }
    
    // Get the report to find the comment ID
    const { data: report } = await supabase
      .from('comment_reports')
      .select('comment_id')
      .eq('id', reportId)
      .single()
    
    if (!report) {
      return ApiErrors.notFound('Report not found', requestId)
    }
    
    // Update the report
    const { error: reportError } = await supabase
      .from('comment_reports')
      .update({
        status: validatedData.status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
    
    if (reportError) {
      return ApiErrors.fromDatabaseError(reportError, 'update_report', requestId)
    }
    
    // If a comment action is specified, update the comment
    if (validatedData.commentAction) {
      const { error: commentError } = await supabase
        .from('comments')
        .update({
          status: validatedData.commentAction,
          updated_at: new Date().toISOString()
        })
        .eq('id', report.comment_id)
      
      if (commentError) {
        return ApiErrors.fromDatabaseError(commentError, 'update_comment_status', requestId)
      }
    }
    
    // Log the action
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'review_report',
        resource_type: 'comment_report',
        resource_id: reportId,
        details: {
          status: validatedData.status,
          comment_action: validatedData.commentAction
        }
      })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error, 'update_report', requestId)
    }
    return ApiErrors.internal(error, 'update_report', requestId)
  }
})

export const GET = getReportsHandler
export const PATCH = updateReportHandler

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}
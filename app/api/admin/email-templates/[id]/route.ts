import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'

// Schema for updating email templates
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  template_type: z.enum([
    'welcome',
    'email_verification',
    'password_reset',
    'professional_approved',
    'professional_rejected',
    'article_published',
    'appointment_reminder',
    'newsletter',
    'custom'
  ]).optional(),
  subject: z.string().min(1).max(500).optional(),
  body_html: z.string().min(1).optional(),
  body_text: z.string().optional(),
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean()
  })).optional(),
  is_active: z.boolean().optional(),
  change_notes: z.string().optional()
})

// GET - Get single email template with version history
const getTemplateHandler = compose(
  withRateLimit(60000, 100),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  const params = await context.params!
  const { id } = params
  
  try {
    const supabase = context.supabase!
    
    // userProfile is guaranteed to be present when using withAuth
    if (context.userProfile?.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (templateError || !template) {
      return ApiErrors.notFound('Template not found', 'get_template', requestId)
    }
    
    // Get version history
    const { data: versions, error: versionsError } = await supabase
      .from('email_template_versions')
      .select('*')
      .eq('template_id', id)
      .order('version_number', { ascending: false })
    
    if (versionsError) {
      return ApiErrors.fromDatabaseError(versionsError, 'get_template_versions', requestId)
    }
    
    return NextResponse.json({ 
      template,
      versions: versions || []
    })
  } catch (error) {
    return ApiErrors.internal(error, 'get_template', requestId)
  }
})

// PUT - Update email template
const updateTemplateHandler = compose(
  withRateLimit(60000, 20),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  const params = await context.params!
  const { id } = params
  
  try {
    const supabase = context.supabase!
    
    // userProfile is guaranteed to be present when using withAuth
    if (context.userProfile?.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    const body = await request.json()
    const validatedData = updateTemplateSchema.parse(body)
    
    // Remove change_notes from update data (used for version history)
    const { change_notes, ...updateData } = validatedData
    
    const { data, error } = await supabase
      .from('email_templates')
      .update({
        ...updateData,
        updated_by: context.userProfile.id
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'update_template', requestId)
    }
    
    if (!data) {
      return ApiErrors.notFound('Template not found', 'update_template', requestId)
    }
    
    // If change_notes provided, update the latest version
    if (change_notes) {
      await supabase
        .from('email_template_versions')
        .update({ change_notes })
        .eq('template_id', id)
        .order('version_number', { ascending: false })
        .limit(1)
    }
    
    return NextResponse.json({ template: data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error, 'update_template', requestId)
    }
    return ApiErrors.internal(error, 'update_template', requestId)
  }
})

// DELETE - Delete email template
const deleteTemplateHandler = compose(
  withRateLimit(60000, 10),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  const params = await context.params!
  const { id } = params
  
  try {
    const supabase = context.supabase!
    
    // userProfile is guaranteed to be present when using withAuth
    if (context.userProfile?.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id)
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'delete_template', requestId)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, 'delete_template', requestId)
  }
})

export const GET = getTemplateHandler
export const PUT = updateTemplateHandler
export const DELETE = deleteTemplateHandler

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}

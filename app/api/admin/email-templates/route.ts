import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'

// Schema for creating/updating email templates
const emailTemplateSchema = z.object({
  name: z.string().min(1).max(255),
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
  ]),
  subject: z.string().min(1).max(500),
  body_html: z.string().min(1),
  body_text: z.string().optional(),
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean()
  })).optional(),
  is_active: z.boolean().optional()
})

// GET - List all email templates
const getTemplatesHandler = withAuth(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const userProfile = context.userProfile!
    
    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', context.user!.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const active = searchParams.get('active')
    
    let query = supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (type) {
      query = query.eq('template_type', type)
    }
    
    if (active !== null) {
      query = query.eq('is_active', active === 'true')
    }
    
    const { data, error } = await query
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'get_templates', requestId)
    }
    
    return NextResponse.json({ templates: data })
  } catch (error) {
    return ApiErrors.internal(error, 'get_templates', requestId)
  }
}, { requireRole: 'admin' })

// POST - Create new email template
const createTemplateHandler = withAuth(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const userProfile = context.userProfile!
    
    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', context.user!.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    const body = await request.json()
    const validatedData = emailTemplateSchema.parse(body)
    
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        ...validatedData,
        created_by: profile.id,
        updated_by: profile.id
      })
      .select()
      .single()
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'create_template', requestId)
    }
    
    return NextResponse.json({ template: data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error, 'create_template', requestId)
    }
    return ApiErrors.internal(error, 'create_template', requestId)
  }
}, { requireRole: 'admin' })

export const GET = getTemplatesHandler
export const POST = createTemplateHandler

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}
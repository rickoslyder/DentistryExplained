import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'
import { renderEmailTemplate } from '@/lib/email/template-renderer'
import { currentUser } from '@clerk/nextjs/server'

// Schema for preview data
const previewSchema = z.object({
  variables: z.record(z.string(), z.any()).optional()
})

// POST - Preview email template with variables
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request)
  const { id } = await params
  
  try {
    // Check authentication
    const user = await currentUser()
    if (!user) {
      return ApiErrors.unauthorized('Authentication required', requestId)
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    const body = await request.json()
    const { variables = {} } = previewSchema.parse(body)
    
    // Get template
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !template) {
      return ApiErrors.notFound('Template not found', 'preview_template', requestId)
    }
    
    // Add default variables for preview
    const previewVariables = {
      userName: 'John Doe',
      userEmail: 'john.doe@example.com',
      professionalName: 'Dr. Sarah Smith',
      gdcNumber: '123456',
      articleTitle: 'Understanding Tooth Decay',
      articleExcerpt: 'Learn about the causes and prevention of tooth decay...',
      articleUrl: 'https://dentistry-explained.com/articles/tooth-decay',
      articleCategory: 'Dental Problems',
      ...variables
    }
    
    // Render template with variables
    const rendered = renderEmailTemplate(template, previewVariables)
    
    return NextResponse.json({ 
      preview: {
        subject: rendered.subject,
        body_html: rendered.body_html,
        body_text: rendered.body_text,
        variables_used: Object.keys(previewVariables)
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error, 'preview_template', requestId)
    }
    return ApiErrors.internal(error, 'preview_template', requestId)
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}

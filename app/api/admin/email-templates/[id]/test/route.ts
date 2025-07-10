import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'
import { sendEmail } from '@/lib/email/send-email'
import { renderEmailTemplate } from '@/lib/email/template-renderer'

// Schema for test email
const testEmailSchema = z.object({
  to: z.string().email(),
  variables: z.record(z.string(), z.any()).optional()
})

// POST - Send test email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request)
  const { id } = await params
  
  // Apply middleware
  return compose(
    withRateLimit(60000, 10), // Limit test emails to prevent abuse
    withAuth
  )(async (request: NextRequest, context) => {
    try {
    const supabase = context.supabase!
    const user = context.user!
    
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
    const { to, variables = {} } = testEmailSchema.parse(body)
    
    // Get template
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !template) {
      return ApiErrors.notFound('Template not found', 'send_test_email', requestId)
    }
    
    // Add test variables
    const testVariables = {
      userName: 'Test User',
      userEmail: to,
      professionalName: 'Dr. Test Professional',
      gdcNumber: 'TEST123',
      articleTitle: 'Test Article Title',
      articleExcerpt: 'This is a test article excerpt for email template testing...',
      articleUrl: 'https://dentistry-explained.com/test',
      articleCategory: 'Test Category',
      ...variables
    }
    
    // Render template
    const rendered = renderEmailTemplate(template, testVariables)
    
    // Send test email
    const result = await sendEmail({
      to,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.body_html,
      text: rendered.body_text
    })
    
    if (!result.success) {
      return ApiErrors.internal(
        new Error(result.error || 'Failed to send test email'),
        'send_test_email',
        requestId
      )
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Test email sent to ${to}`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error, 'send_test_email', requestId)
    }
    return ApiErrors.internal(error, 'send_test_email', requestId)
  }
  })(request, {})
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

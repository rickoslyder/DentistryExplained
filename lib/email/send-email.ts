import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email using Resend
 * Falls back gracefully if Resend is not configured
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  if (!resend) {
    console.warn('Resend API key not configured. Email not sent:', {
      to: options.to,
      subject: options.subject
    })
    return {
      success: false,
      error: 'Email service not configured'
    }
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: options.from || 'Dentistry Explained <noreply@dentistry-explained.com>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo
    })
    
    if (error) {
      console.error('Failed to send email:', error)
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: true,
      messageId: data?.id
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send an email using a template from the database
 */
export async function sendTemplatedEmail(
  templateId: string,
  to: string | string[],
  variables: Record<string, any> = {},
  options: Partial<SendEmailOptions> = {}
): Promise<SendEmailResult> {
  try {
    // Import here to avoid circular dependency
    const { createServerSupabaseClient } = await import('@/lib/supabase-auth')
    const { renderEmailTemplate, validateVariables } = await import('./template-renderer')
    
    const supabase = await createServerSupabaseClient()
    
    // Get template from database
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()
    
    if (error || !template) {
      return {
        success: false,
        error: 'Template not found or inactive'
      }
    }
    
    // Validate required variables
    const validation = validateVariables(template, variables)
    if (!validation.valid) {
      return {
        success: false,
        error: `Missing required variables: ${validation.missing.join(', ')}`
      }
    }
    
    // Render template
    const rendered = renderEmailTemplate(template, variables)
    
    // Send email
    return await sendEmail({
      to,
      subject: rendered.subject,
      html: rendered.body_html,
      text: rendered.body_text,
      ...options
    })
  } catch (error) {
    console.error('Error sending templated email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
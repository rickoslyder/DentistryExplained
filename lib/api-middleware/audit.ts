import { NextRequest, NextResponse } from 'next/server'
import { getRequestId } from '@/lib/api-errors'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { auth } from '@clerk/nextjs/server'

interface AuditOptions {
  action: string
  entityType?: string
  entityId?: string
  includeRequestBody?: boolean
  includeResponseData?: boolean
}

/**
 * Audit logging middleware
 * Logs all API actions for compliance and security
 */
export function withAudit(options: AuditOptions) {
  return <T extends (...args: any[]) => any>(handler: T): T => {
    return (async (...args: Parameters<T>) => {
      const request = args[0] as NextRequest
      const requestId = getRequestId(request)
      const startTime = Date.now()
      
      // Get user info
      const { userId: clerkId } = await auth()
      const supabase = await createServerSupabaseClient()
      
      let userId: string | null = null
      if (clerkId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_id', clerkId)
          .single()
        userId = profile?.id || null
      }
      
      // Prepare audit data
      const auditData: any = {
        user_id: userId,
        action: options.action,
        entity_type: options.entityType,
        entity_id: options.entityId,
        request_id: requestId,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        details: {
          method: request.method,
          url: request.url,
          timestamp: new Date().toISOString(),
        }
      }
      
      // Include request body if specified
      if (options.includeRequestBody && request.method !== 'GET') {
        try {
          const body = await request.clone().json()
          // Remove sensitive data
          const sanitizedBody = { ...body }
          delete sanitizedBody.password
          delete sanitizedBody.token
          delete sanitizedBody.secret
          auditData.details.request_body = sanitizedBody
        } catch {}
      }
      
      let response: NextResponse
      let error: any = null
      
      try {
        // Execute the handler
        response = await handler(...args)
        
        // Log response status
        auditData.details.response_status = response.status
        auditData.details.duration_ms = Date.now() - startTime
        
        // Include response data if specified and successful
        if (options.includeResponseData && response.status < 400) {
          try {
            const responseData = await response.clone().json()
            // Store entity ID if it's in the response
            if (responseData.id && !options.entityId) {
              auditData.entity_id = responseData.id
            }
            // Store limited response data
            auditData.details.response_summary = {
              id: responseData.id,
              type: responseData.type || responseData.__typename,
              count: responseData.count || responseData.length,
            }
          } catch {}
        }
        
        return response
      } catch (err) {
        error = err
        auditData.details.error = err instanceof Error ? err.message : 'Unknown error'
        auditData.details.duration_ms = Date.now() - startTime
        throw err
      } finally {
        // Always log the audit entry
        try {
          // Set context for triggers
          if (userId) {
            await supabase.rpc('set_config', {
              setting: 'app.current_user_id',
              value: userId
            })
          }
          if (requestId) {
            await supabase.rpc('set_config', {
              setting: 'app.current_request_id', 
              value: requestId
            })
          }
          
          await supabase
            .from('activity_logs')
            .insert(auditData)
        } catch (auditError) {
          console.error('Failed to write audit log:', auditError)
        }
      }
    }) as T
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-auth'
import { currentUser } from '@clerk/nextjs/server'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { z } from 'zod'

// Schema for audit log validation
const auditLogSchema = z.object({
  session_id: z.string(),
  event_type: z.enum(['page_view', 'symptom_check', 'service_search', 'emergency_contact', 'guidance_viewed']),
  event_data: z.record(z.any()),
  timestamp: z.string(),
  user_agent: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = auditLogSchema.safeParse(body)
    
    if (!validation.success) {
      return ApiErrors.invalidInput('Invalid audit log data', validation.error.errors, requestId)
    }
    
    const data = validation.data
    
    // Get current user if authenticated (optional for emergency logs)
    const user = await currentUser()
    
    // Get IP address from request
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    
    // Create audit log entry
    const auditLog = {
      ...data,
      user_id: user?.id || null,
      ip_address: ip,
      created_at: new Date().toISOString(),
    }
    
    // Store in database if enabled
    if (process.env.ENABLE_EMERGENCY_AUDIT === 'true') {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('emergency_audit_logs')
        .insert(auditLog)
      
      if (error) {
        console.error('Failed to store audit log:', error)
        // Don't return error - audit logging should not fail emergency services
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Audit log recorded',
      requestId 
    })
    
  } catch (error) {
    console.error('Emergency audit error:', error)
    // Always return success for audit endpoints to not interrupt emergency services
    return NextResponse.json({ 
      success: true,
      message: 'Audit log processed',
      requestId 
    })
  }
}

// GET endpoint to retrieve audit logs (admin only)
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)
  
  try {
    const user = await currentUser()
    
    // Check if user is admin (you'll need to implement this check based on your admin logic)
    const isAdmin = user?.publicMetadata?.role === 'admin'
    
    if (!isAdmin) {
      return ApiErrors.forbidden('Admin access required', requestId)
    }
    
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')
    const userId = searchParams.get('user_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    const supabase = createClient()
    
    let query = supabase
      .from('emergency_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    const { data, error } = await query
    
    if (error) {
      return ApiErrors.internal(error, 'Failed to fetch audit logs', requestId)
    }
    
    return NextResponse.json({
      success: true,
      data,
      requestId,
    })
    
  } catch (error) {
    return ApiErrors.internal(error, 'Failed to retrieve audit logs', requestId)
  }
}
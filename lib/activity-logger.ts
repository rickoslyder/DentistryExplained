import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { headers } from 'next/headers'

export type ActivityAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout' 
  | 'role_change' 
  | 'bulk_delete' 
  | 'upload' 
  | 'export' 
  | 'import'
  | 'verify'
  | 'approve'
  | 'reject'

export type ResourceType = 
  | 'article' 
  | 'category' 
  | 'user' 
  | 'media' 
  | 'settings' 
  | 'verification'
  | 'glossary_term'
  | 'chat_session'

interface LogActivityParams {
  userId: string
  action: ActivityAction
  resourceType: ResourceType
  resourceId?: string
  resourceName?: string
  metadata?: Record<string, any>
}

/**
 * Log an activity to the audit trail
 * This is non-blocking and will not throw errors to avoid disrupting the main flow
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()
    const headersList = headers()
    
    // Get IP address (handle various proxy headers)
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIp || headersList.get('x-client-ip') || null
    
    // Get user agent
    const userAgent = headersList.get('user-agent') || null
    
    // Insert activity log
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: params.userId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        resource_name: params.resourceName,
        metadata: params.metadata || {},
        ip_address: ip,
        user_agent: userAgent,
      })
    
    if (error) {
      console.error('[Activity Logger] Failed to log activity:', error)
    }
  } catch (error) {
    // Silently fail to avoid disrupting the main operation
    console.error('[Activity Logger] Unexpected error:', error)
  }
}

/**
 * Batch log multiple activities
 * Useful for bulk operations
 */
export async function logBatchActivity(
  activities: LogActivityParams[]
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()
    const headersList = headers()
    
    // Get common request data
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIp || headersList.get('x-client-ip') || null
    const userAgent = headersList.get('user-agent') || null
    
    // Prepare batch insert
    const logs = activities.map(activity => ({
      user_id: activity.userId,
      action: activity.action,
      resource_type: activity.resourceType,
      resource_id: activity.resourceId,
      resource_name: activity.resourceName,
      metadata: activity.metadata || {},
      ip_address: ip,
      user_agent: userAgent,
    }))
    
    const { error } = await supabase
      .from('activity_logs')
      .insert(logs)
    
    if (error) {
      console.error('[Activity Logger] Failed to log batch activities:', error)
    }
  } catch (error) {
    console.error('[Activity Logger] Unexpected error in batch logging:', error)
  }
}

/**
 * Helper to format resource names for logging
 */
export function formatResourceName(
  resourceType: ResourceType,
  resource: any
): string {
  switch (resourceType) {
    case 'article':
      return resource.title || 'Untitled Article'
    case 'category':
      return resource.name || 'Unnamed Category'
    case 'user':
      return resource.email || resource.full_name || 'Unknown User'
    case 'media':
      return resource.name || resource.fileName || 'Unknown File'
    case 'glossary_term':
      return resource.term || 'Unknown Term'
    case 'verification':
      return `Verification for ${resource.gdc_number || 'Unknown'}`
    default:
      return resource.name || resource.title || `${resourceType} #${resource.id}`
  }
}

/**
 * Create activity metadata for common scenarios
 */
export const ActivityMetadata = {
  articleUpdate: (changes: { before?: any; after?: any }) => ({
    changes: {
      status: changes.before?.status !== changes.after?.status 
        ? { from: changes.before?.status, to: changes.after?.status }
        : undefined,
      featured: changes.before?.is_featured !== changes.after?.is_featured
        ? { from: changes.before?.is_featured, to: changes.after?.is_featured }
        : undefined,
    }
  }),
  
  roleChange: (from: string, to: string) => ({
    from_role: from,
    to_role: to,
  }),
  
  bulkDelete: (count: number, resourceType: string) => ({
    count,
    resource_type: resourceType,
  }),
  
  fileUpload: (fileName: string, fileSize: number, mimeType: string) => ({
    file_name: fileName,
    file_size: fileSize,
    mime_type: mimeType,
  }),
  
  settingsUpdate: (section: string, changes: Record<string, any>) => ({
    section,
    changes,
  }),
}
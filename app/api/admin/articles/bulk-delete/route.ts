import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { logActivity, ActivityMetadata } from '@/lib/activity-logger'

// Schema for bulk delete
const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one ID is required"),
})

// POST /api/admin/articles/bulk-delete - Delete multiple articles
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    
    // Check admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || !['admin', 'editor'].includes(profile.role || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { ids } = bulkDeleteSchema.parse(body)

    // Get article titles before deletion for logging
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title')
      .in('id', ids)

    // Delete articles
    const { error } = await supabase
      .from('articles')
      .delete()
      .in('id', ids)
    
    if (error) throw error

    // Log the bulk deletion
    await logActivity({
      userId: profile.id,
      action: 'bulk_delete',
      resourceType: 'article',
      resourceId: ids.join(','),
      resourceName: `${ids.length} articles`,
      metadata: ActivityMetadata.bulkDelete(ids.length, 'article') 
    })

    return NextResponse.json({ 
      success: true, 
      message: `${ids.length} articles deleted successfully` 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
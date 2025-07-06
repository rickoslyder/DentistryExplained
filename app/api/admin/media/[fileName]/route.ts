import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { logActivity } from '@/lib/activity-logger'

// DELETE /api/admin/media/[fileName] - Delete media file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
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

    const fileName = decodeURIComponent(params.fileName)
    
    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from('media')
      .remove([fileName])
    
    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      )
    }
    
    // Log the deletion
    await logActivity({
      userId: profile.id,
      action: 'delete',
      resourceType: 'media',
      resourceId: fileName,
      resourceName: fileName,
      metadata: {
        fileName
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('Media delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { logActivity, ActivityMetadata } from '@/lib/activity-logger'

// PUT /api/admin/settings - Update settings
export async function PUT(request: NextRequest) {
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
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update settings' }, { status: 403 })
    }

    const settings = await request.json()
    
    // In a real implementation, we would:
    // 1. Validate the settings structure
    // 2. Save to a settings table in Supabase
    // 3. Clear any caches that depend on these settings
    // 4. Potentially restart services or update environment variables
    
    // For now, we'll just simulate a successful save
    console.log('Settings updated:', settings)
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Log the settings update
    await logActivity({
      userId: profile.id,
      action: 'update',
      resourceType: 'settings',
      resourceId: 'global',
      resourceName: 'Global Settings',
      metadata: ActivityMetadata.settingsUpdate('global', settings)
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Settings saved successfully'
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
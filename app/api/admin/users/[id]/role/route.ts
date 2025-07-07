import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { logActivity, formatResourceName, ActivityMetadata } from '@/lib/activity-logger'

// Schema for role updates
const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'editor']),
})

// PUT /api/admin/users/[id]/role - Update user role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can change user roles' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { role } = updateRoleSchema.parse(body)

    // Get current user info
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('clerk_id, role')
      .eq('id', params.id)
      .single()
    
    // Prevent self-demotion
    if (targetUser?.clerk_id === userId && role !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot demote yourself' },
        { status: 400 }
      )
    }

    const originalRole = targetUser?.role || 'user'

    // Update user role
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error

    // Log the role change
    await logActivity({
      userId: profile.id,
      action: 'role_change',
      resourceType: 'user',
      resourceId: params.id,
      resourceName: formatResourceName('user', updatedUser),
      metadata: ActivityMetadata.roleChange(originalRole, role)
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Update role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}

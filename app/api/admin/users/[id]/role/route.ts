import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'

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
      .select('role')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can change user roles' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { role } = updateRoleSchema.parse(body)

    // Prevent self-demotion
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('clerk_id')
      .eq('id', params.id)
      .single()
    
    if (targetUser?.clerk_id === userId && role !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot demote yourself' },
        { status: 400 }
      )
    }

    // Update user role
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error

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
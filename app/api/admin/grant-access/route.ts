import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function POST(req: NextRequest) {
  try {
    // Check if the current user is an admin
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    
    // Verify current user is admin
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', userId)
      .single()

    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get the target user email from request
    const { email, role = 'admin' } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user in Supabase by email
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('clerk_id, user_type')
      .eq('email', email)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update Clerk publicMetadata
    try {
      await clerkClient.users.updateUserMetadata(targetProfile.clerk_id, {
        publicMetadata: {
          userType: 'professional', // Admin must be professional
          role: role
        }
      })
    } catch (clerkError) {
      console.error('Error updating Clerk metadata:', clerkError)
      return NextResponse.json({ error: 'Failed to update Clerk metadata' }, { status: 500 })
    }

    // Update Supabase profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: role,
        user_type: 'professional',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)

    if (updateError) {
      console.error('Error updating Supabase profile:', updateError)
      // Try to rollback Clerk changes
      await clerkClient.users.updateUserMetadata(targetProfile.clerk_id, {
        publicMetadata: {
          userType: targetProfile.user_type,
          role: 'user'
        }
      })
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully granted ${role} access to ${email}` 
    })
  } catch (error) {
    console.error('Grant access error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
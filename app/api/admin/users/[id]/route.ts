import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'

// Schema for updating user profile
const updateUserSchema = z.object({
  user_type: z.enum(['patient', 'professional']).optional(),
  role: z.enum(['user', 'admin']).optional(),
  practice_name: z.string().optional(),
  practice_address: z.string().optional(),
  practice_phone: z.string().optional(),
  practice_website: z.string().optional(),
  practice_email: z.string().optional(),
  verification_status: z.enum(['pending', 'verified', 'rejected']).optional(),
  gdc_number: z.string().optional(),
})

// Check if user is admin
async function checkAdminAccess() {
  const { userId } = await auth()
  if (!userId) return false
  
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_id', userId)
    .single()
  
  return profile?.role === 'admin'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const supabase = await createServerSupabaseClient()

    // Update user profile
    const profileUpdates: any = {}
    if (validatedData.user_type !== undefined) profileUpdates.user_type = validatedData.user_type
    if (validatedData.role !== undefined) profileUpdates.role = validatedData.role

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', params.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    }

    // If updating professional details or verification
    if (validatedData.user_type === 'professional' || validatedData.verification_status || validatedData.gdc_number) {
      // Check if verification record exists
      const { data: existingVerification } = await supabase
        .from('professional_verifications')
        .select('id')
        .eq('user_id', params.id)
        .single()

      const verificationData: any = {}
      if (validatedData.practice_name !== undefined) verificationData.practice_name = validatedData.practice_name
      if (validatedData.practice_address !== undefined) verificationData.practice_address = validatedData.practice_address
      if (validatedData.practice_phone !== undefined) verificationData.practice_phone = validatedData.practice_phone
      if (validatedData.practice_website !== undefined) verificationData.practice_website = validatedData.practice_website
      if (validatedData.practice_email !== undefined) verificationData.practice_email = validatedData.practice_email
      if (validatedData.gdc_number !== undefined) verificationData.gdc_number = validatedData.gdc_number
      if (validatedData.verification_status !== undefined) {
        verificationData.verification_status = validatedData.verification_status
        if (validatedData.verification_status === 'verified') {
          verificationData.verified_at = new Date().toISOString()
          verificationData.verified_by = (await auth()).userId
        }
      }

      if (Object.keys(verificationData).length > 0) {
        if (existingVerification) {
          // Update existing verification
          const { error: verificationError } = await supabase
            .from('professional_verifications')
            .update(verificationData)
            .eq('user_id', params.id)

          if (verificationError) {
            console.error('Verification update error:', verificationError)
            return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 })
          }
        } else {
          // Create new verification record
          const { error: verificationError } = await supabase
            .from('professional_verifications')
            .insert({
              user_id: params.id,
              ...verificationData,
              full_name: validatedData.practice_name || 'Professional User',
            })

          if (verificationError) {
            console.error('Verification creation error:', verificationError)
            return NextResponse.json({ error: 'Failed to create verification' }, { status: 500 })
          }
        }
      }
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action_type: 'update_user',
      target_id: params.id,
      details: validatedData,
    }).catch(err => console.error('Failed to log admin action:', err))

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      updates: validatedData 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
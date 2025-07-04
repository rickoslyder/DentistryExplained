import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from '@/lib/email/verification-emails'

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().optional(),
  expiry_date: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { verificationId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = reviewSchema.parse(body)
    const verificationId = params.verificationId

    // Get current verification with user profile
    const { data: verification, error: verificationError } = await supabase
      .from('professional_verifications')
      .select(`
        *,
        user_profiles!professional_verifications_user_id_fkey(
          email,
          name
        )
      `)
      .eq('id', verificationId)
      .single()

    if (!verification || verificationError) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    if (verification.verification_status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending verifications can be reviewed' 
      }, { status: 400 })
    }

    // Update verification
    const updateData: any = {
      verified_by: user.id,
      verification_date: new Date().toISOString(),
    }

    if (validatedData.action === 'approve') {
      updateData.verification_status = 'verified'
      if (validatedData.expiry_date) {
        updateData.expiry_date = validatedData.expiry_date
      }
    } else {
      updateData.verification_status = 'rejected'
      updateData.rejection_reason = validatedData.rejection_reason || 'Verification rejected by admin'
    }

    const { data: updatedVerification, error: updateError } = await supabase
      .from('professional_verifications')
      .update(updateData)
      .eq('id', verificationId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 })
    }

    // Update user profile if approved
    if (validatedData.action === 'approve') {
      await supabase
        .from('user_profiles')
        .update({ is_professional: true })
        .eq('id', verification.user_id)
    }

    // Log activity
    await supabase.rpc('log_verification_activity', {
      p_verification_id: verificationId,
      p_action: validatedData.action === 'approve' ? 'approved' : 'rejected',
      p_details: {
        reviewed_by: user.id,
        rejection_reason: validatedData.rejection_reason,
        expiry_date: validatedData.expiry_date,
      }
    })

    // Send email notification
    if (verification.user_profiles?.email) {
      if (validatedData.action === 'approve') {
        await sendVerificationApprovedEmail({
          to: verification.user_profiles.email,
          name: verification.user_profiles.name || verification.full_name,
          gdcNumber: verification.gdc_number,
          expiryDate: validatedData.expiry_date
        })
      } else {
        await sendVerificationRejectedEmail({
          to: verification.user_profiles.email,
          name: verification.user_profiles.name || verification.full_name,
          gdcNumber: verification.gdc_number,
          rejectionReason: validatedData.rejection_reason || 'Please check your submission details and try again.'
        })
      }
    }
    
    return NextResponse.json({ 
      verification: updatedVerification,
      message: `Verification ${validatedData.action === 'approve' ? 'approved' : 'rejected'} successfully`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
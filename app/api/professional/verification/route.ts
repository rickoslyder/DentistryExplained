import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { validateGDCNumber } from '@/types/professional'

const verificationSchema = z.object({
  gdc_number: z.string().min(6).max(7),
  full_name: z.string().min(2).max(255),
  practice_name: z.string().optional(),
  practice_address: z.string().optional(),
  additional_notes: z.string().optional(),
  professional_title: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    
    // Get user's verification
    const { data: verification, error: verificationError } = await supabase
      .from('professional_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verificationError && verificationError.code !== 'PGRST116') {
      console.error('Error fetching verification:', verificationError)
      return NextResponse.json({ error: 'Failed to fetch verification' }, { status: 500 })
    }

    // Get associated documents if verification exists
    let documents = []
    if (verification) {
      const { data: docs, error: docsError } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('verification_id', verification.id)
        .order('uploaded_at', { ascending: false })

      if (docsError) {
        console.error('Error fetching documents:', docsError)
      } else {
        documents = docs || []
      }
    }

    return NextResponse.json({ 
      verification: verification || null,
      documents 
    })
  } catch (error) {
    console.error('Verification GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = verificationSchema.parse(body)

    // Validate GDC number format
    const gdcValidation = validateGDCNumber(validatedData.gdc_number)
    if (!gdcValidation.isValid) {
      return NextResponse.json({ error: gdcValidation.error }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Check if user already has a pending or verified verification
    const { data: existing, error: existingError } = await supabase
      .from('professional_verifications')
      .select('*')
      .eq('user_id', user.id)
      .in('verification_status', ['pending', 'verified'])
      .single()

    if (existing && !existingError) {
      return NextResponse.json({ 
        error: 'You already have an active verification request' 
      }, { status: 400 })
    }

    // Create new verification
    const { data: verification, error: createError } = await supabase
      .from('professional_verifications')
      .insert({
        user_id: user.id,
        gdc_number: gdcValidation.formatted,
        full_name: validatedData.full_name,
        practice_name: validatedData.practice_name,
        practice_address: validatedData.practice_address,
        additional_notes: validatedData.additional_notes,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating verification:', createError)
      return NextResponse.json({ error: 'Failed to create verification' }, { status: 500 })
    }

    // Log activity
    await supabase.rpc('log_verification_activity', {
      p_verification_id: verification.id,
      p_action: 'submitted',
      p_details: { gdc_number: gdcValidation.formatted }
    })

    // Update user profile with professional info
    if (validatedData.professional_title) {
      await supabase
        .from('user_profiles')
        .update({ professional_title: validatedData.professional_title })
        .eq('id', user.id)
    }

    return NextResponse.json({ verification })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Verification POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = verificationSchema.parse(body)

    // Validate GDC number format
    const gdcValidation = validateGDCNumber(validatedData.gdc_number)
    if (!gdcValidation.isValid) {
      return NextResponse.json({ error: gdcValidation.error }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Get user's pending verification
    const { data: existing, error: existingError } = await supabase
      .from('professional_verifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('verification_status', 'pending')
      .single()

    if (!existing || existingError) {
      return NextResponse.json({ 
        error: 'No pending verification found' 
      }, { status: 404 })
    }

    // Update verification
    const { data: verification, error: updateError } = await supabase
      .from('professional_verifications')
      .update({
        gdc_number: gdcValidation.formatted,
        full_name: validatedData.full_name,
        practice_name: validatedData.practice_name,
        practice_address: validatedData.practice_address,
        additional_notes: validatedData.additional_notes,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating verification:', updateError)
      return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 })
    }

    // Log activity
    await supabase.rpc('log_verification_activity', {
      p_verification_id: verification.id,
      p_action: 'updated',
      p_details: { gdc_number: gdcValidation.formatted }
    })

    return NextResponse.json({ verification })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Verification PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
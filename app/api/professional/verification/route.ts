import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { validateGDCNumber } from '@/types/professional'
import { ApiErrors, validateRequestBody, mapDatabaseError } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'

const verificationSchema = z.object({
  gdc_number: z.string().min(6).max(7),
  full_name: z.string().min(2).max(255),
  practice_name: z.string().optional(),
  practice_address: z.string().optional(),
  additional_notes: z.string().optional(),
  professional_title: z.string().optional(),
})

const getVerificationHandler = withAuth(async (request: NextRequest, context) => {
  const { userId, supabase } = context
  
  // Get user's verification
  const { data: verification, error: verificationError } = await supabase
    .from('professional_verifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (verificationError && verificationError.code !== 'PGRST116') {
    return mapDatabaseError(verificationError)
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
      console.error('[Verification] Error fetching documents:', docsError)
      // Don't fail the request if documents can't be fetched
    } else {
      documents = docs || []
    }
  }

  return NextResponse.json({ 
    verification: verification || null,
    documents,
    requestId: context.requestId
  })
})

export const GET = getVerificationHandler

const createVerificationHandler = compose(
  withRateLimit(60000, 5), // 5 verifications per minute
  withAuth
)(async (request: NextRequest, context) => {
  const body = await request.json()
  
  // Validate request body
  const { data: validatedData, error: validationError } = validateRequestBody(
    body,
    verificationSchema
  )
  
  if (validationError) {
    return validationError
  }
  
  const { userId, supabase } = context

  // Validate GDC number format
  const gdcValidation = validateGDCNumber(validatedData.gdc_number)
  if (!gdcValidation.isValid) {
    return ApiErrors.invalidInput(gdcValidation.error || 'Invalid GDC number format', {
      field: 'gdc_number',
      value: validatedData.gdc_number
    })
  }

  // Check if user already has a pending or verified verification
  const { data: existing, error: existingError } = await supabase
    .from('professional_verifications')
    .select('*')
    .eq('user_id', userId)
    .in('verification_status', ['pending', 'verified'])
    .single()

  if (existing && !existingError) {
    return ApiErrors.duplicate('Verification request', 'status')
  }

  // Create new verification
  const { data: verification, error: createError } = await supabase
    .from('professional_verifications')
    .insert({
      user_id: userId,
      gdc_number: gdcValidation.formatted,
      full_name: validatedData.full_name,
      practice_name: validatedData.practice_name,
      practice_address: validatedData.practice_address,
      additional_notes: validatedData.additional_notes,
    })
    .select()
    .single()

  if (createError) {
    return mapDatabaseError(createError)
  }

  // Log activity (non-blocking)
  supabase.rpc('log_verification_activity', {
    p_verification_id: verification.id,
    p_action: 'submitted',
    p_details: { gdc_number: gdcValidation.formatted }
  })
    .then(({ error }) => {
      if (error) {
        console.error('[Verification] Failed to log activity:', error)
      }
    })

  // Update user profile with professional info (non-blocking)
  if (validatedData.professional_title) {
    supabase
      .from('user_profiles')
      .update({ professional_title: validatedData.professional_title })
      .eq('id', userId)
      .then(({ error }) => {
        if (error) {
          console.error('[Verification] Failed to update profile:', error)
        }
      })
  }

  return NextResponse.json({ 
    verification,
    message: 'Verification request submitted successfully',
    requestId: context.requestId
  })
})

export const POST = createVerificationHandler

const updateVerificationHandler = compose(
  withRateLimit(60000, 10), // 10 updates per minute
  withAuth
)(async (request: NextRequest, context) => {
  const body = await request.json()
  
  // Validate request body
  const { data: validatedData, error: validationError } = validateRequestBody(
    body,
    verificationSchema
  )
  
  if (validationError) {
    return validationError
  }
  
  const { userId, supabase } = context

  // Validate GDC number format
  const gdcValidation = validateGDCNumber(validatedData.gdc_number)
  if (!gdcValidation.isValid) {
    return ApiErrors.invalidInput(gdcValidation.error || 'Invalid GDC number format', {
      field: 'gdc_number',
      value: validatedData.gdc_number
    })
  }

  // Get user's pending verification
  const { data: existing, error: existingError } = await supabase
    .from('professional_verifications')
    .select('*')
    .eq('user_id', userId)
    .eq('verification_status', 'pending')
    .single()

  if (existingError) {
    if (existingError.code === 'PGRST116') {
      return ApiErrors.notFound('Pending verification')
    }
    return mapDatabaseError(existingError)
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
    return mapDatabaseError(updateError)
  }

  // Log activity (non-blocking)
  supabase.rpc('log_verification_activity', {
    p_verification_id: verification.id,
    p_action: 'updated',
    p_details: { gdc_number: gdcValidation.formatted }
  })
    .then(({ error }) => {
      if (error) {
        console.error('[Verification] Failed to log activity:', error)
      }
    })

  return NextResponse.json({ 
    verification,
    message: 'Verification updated successfully',
    requestId: context.requestId
  })
})

export const PUT = updateVerificationHandler
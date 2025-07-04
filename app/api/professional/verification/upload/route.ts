import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { randomUUID } from 'crypto'
import { ApiErrors, mapDatabaseError } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { z } from 'zod'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

// Document types schema
const documentTypeSchema = z.enum([
  'gdc_certificate',
  'id_verification',
  'practice_proof',
  'other'
])

const uploadHandler = compose(
  withRateLimit(60000, 10), // 10 uploads per minute
  withAuth
)(async (request: NextRequest, context) => {
  const { userId, supabase } = context

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (error) {
    return ApiErrors.invalidInput('Invalid form data')
  }
  
  const file = formData.get('file') as File
  const documentTypeRaw = formData.get('document_type') as string || 'gdc_certificate'
  
  if (!file) {
    return ApiErrors.missingField('file')
  }
  
  // Validate document type
  const documentTypeResult = documentTypeSchema.safeParse(documentTypeRaw)
  if (!documentTypeResult.success) {
    return ApiErrors.invalidInput('Invalid document type', {
      field: 'document_type',
      allowed: ['gdc_certificate', 'id_verification', 'practice_proof', 'other']
    })
  }
  const documentType = documentTypeResult.data

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return ApiErrors.fileTooLarge('10MB')
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return ApiErrors.invalidFile(`Unsupported file type: ${file.type}. Allowed: PDF, JPEG, PNG`)
  }

  // Validate file extension
  const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
    return ApiErrors.invalidFile(`Invalid file extension: ${fileExt}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)
  }

  // Get user's pending verification
  const { data: verification, error: verificationError } = await supabase
    .from('professional_verifications')
    .select('*')
    .eq('user_id', userId)
    .eq('verification_status', 'pending')
    .single()

  if (verificationError) {
    if (verificationError.code === 'PGRST116') {
      return ApiErrors.notFound('Pending verification. Please submit verification details first')
    }
    return mapDatabaseError(verificationError)
  }

  // Generate unique filename
  const fileId = randomUUID()
  const fileName = `${userId}/${verification.id}/${fileId}${fileExt}`
  
  // Upload to Supabase Storage
  let buffer: Uint8Array
  try {
    const arrayBuffer = await file.arrayBuffer()
    buffer = new Uint8Array(arrayBuffer)
  } catch (error) {
    return ApiErrors.internal(error, 'file processing')
  }
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('verification-documents')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    console.error('[Upload] Storage error:', uploadError)
    return ApiErrors.internal(uploadError, 'file upload')
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('verification-documents')
    .getPublicUrl(fileName)

  // Create document record
  const { data: document, error: docError } = await supabase
    .from('verification_documents')
    .insert({
      verification_id: verification.id,
      document_type: documentType,
      file_name: file.name,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single()

  if (docError) {
    console.error('[Upload] Document record error:', docError)
    
    // Clean up uploaded file
    const { error: cleanupError } = await supabase.storage
      .from('verification-documents')
      .remove([fileName])
    
    if (cleanupError) {
      console.error('[Upload] Failed to cleanup file:', cleanupError)
    }
    
    return mapDatabaseError(docError)
  }

  // Log activity (non-blocking)
  supabase.rpc('log_verification_activity', {
    p_verification_id: verification.id,
    p_action: 'document_uploaded',
    p_details: { 
      document_type: documentType,
      file_name: file.name,
      file_size: file.size 
    }
  })
    .then(({ error }) => {
      if (error) {
        console.error('[Upload] Failed to log activity:', error)
      }
    })

  return NextResponse.json({ 
    document,
    message: 'Document uploaded successfully',
    requestId: context.requestId
  })
})

export const POST = uploadHandler
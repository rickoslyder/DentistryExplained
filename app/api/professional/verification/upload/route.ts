import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('document_type') as string || 'gdc_certificate'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file extension
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 })
    }

    const supabase = createClient()

    // Get user's pending verification
    const { data: verification, error: verificationError } = await supabase
      .from('professional_verifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('verification_status', 'pending')
      .single()

    if (!verification || verificationError) {
      return NextResponse.json({ 
        error: 'No pending verification found. Please submit verification details first.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileId = randomUUID()
    const fileName = `${user.id}/${verification.id}/${fileId}${fileExt}`
    
    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
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
      console.error('Document record error:', docError)
      
      // Clean up uploaded file
      await supabase.storage
        .from('verification-documents')
        .remove([fileName])
      
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    // Log activity
    await supabase.rpc('log_verification_activity', {
      p_verification_id: verification.id,
      p_action: 'document_uploaded',
      p_details: { 
        document_type: documentType,
        file_name: file.name,
        file_size: file.size 
      }
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
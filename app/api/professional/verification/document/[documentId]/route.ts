import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documentId = params.documentId
    const supabase = await createServerSupabaseClient()

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('verification_documents')
      .select(`
        *,
        professional_verifications!inner(
          user_id,
          verification_status
        )
      `)
      .eq('id', documentId)
      .single()

    if (!document || docError) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check ownership and status
    if (document.professional_verifications.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (document.professional_verifications.verification_status !== 'pending') {
      return NextResponse.json({ 
        error: 'Cannot delete documents for non-pending verifications' 
      }, { status: 400 })
    }

    // Extract file path from URL
    const urlParts = document.file_url.split('/')
    const bucketPath = urlParts.slice(-3).join('/')

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('verification-documents')
      .remove([bucketPath])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Delete database record
    const { error: deleteError } = await supabase
      .from('verification_documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) {
      console.error('Database deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    // Log activity
    await supabase.rpc('log_verification_activity', {
      p_verification_id: document.verification_id,
      p_action: 'document_deleted',
      p_details: { 
        document_type: document.document_type,
        file_name: document.file_name
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
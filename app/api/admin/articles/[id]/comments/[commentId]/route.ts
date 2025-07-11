import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const authResult = await auth()
    if (!authResult || authResult.sessionClaims?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', authResult.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Update comment
    const updateData: any = {}
    
    if (body.content !== undefined) {
      updateData.content = body.content
    }
    
    if (body.resolved !== undefined) {
      updateData.resolved = body.resolved
      if (body.resolved) {
        updateData.resolved_by = profile.id
        updateData.resolved_at = new Date().toISOString()
      } else {
        updateData.resolved_by = null
        updateData.resolved_at = null
      }
    }

    const { data: comment, error } = await supabase
      .from('article_comments')
      .update(updateData)
      .eq('id', params.commentId)
      .eq('article_id', params.id)
      .select(`
        *,
        author:profiles!article_comments_author_id_fkey(
          id,
          name,
          email,
          image_url
        ),
        resolved_by_user:profiles!article_comments_resolved_by_fkey(
          id,
          name,
          email,
          image_url
        )
      `)
      .single()

    if (error) {
      console.error('Error updating comment:', error)
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error in comment PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const authResult = await auth()
    if (!authResult || authResult.sessionClaims?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Delete comment (cascade will handle replies)
    const { error } = await supabase
      .from('article_comments')
      .delete()
      .eq('id', params.commentId)
      .eq('article_id', params.id)

    if (error) {
      console.error('Error deleting comment:', error)
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in comment DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
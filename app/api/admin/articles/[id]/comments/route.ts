import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await auth()
    if (!authResult || authResult.sessionClaims?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const revisionId = searchParams.get('revision_id')
    const lineNumber = searchParams.get('line_number')
    const summary = searchParams.get('summary') === 'true'

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', authResult.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('article_comments')
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
      .eq('article_id', params.id)

    if (revisionId) {
      query = query.eq('revision_id', revisionId)
    }

    if (lineNumber) {
      query = query.eq('line_number', parseInt(lineNumber))
    }

    if (summary) {
      query = query.select(`
        id,
        article_id,
        author_id,
        content,
        line_number,
        resolved,
        created_at,
        author:profiles!article_comments_author_id_fkey(
          name,
          image_url
        )
      `)
    }

    query = query.order('created_at', { ascending: false })

    const { data: comments, error } = await query

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    return NextResponse.json(comments || [])
  } catch (error) {
    console.error('Error in comments GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Create comment
    const { data: comment, error } = await supabase
      .from('article_comments')
      .insert({
        article_id: params.id,
        author_id: profile.id,
        content: body.content,
        revision_id: body.revision_id || null,
        line_number: body.line_number || null,
        selection_start: body.selection_start || null,
        selection_end: body.selection_end || null,
        parent_comment_id: body.parent_comment_id || null
      })
      .select(`
        *,
        author:profiles!article_comments_author_id_fkey(
          id,
          name,
          email,
          image_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error in comments POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
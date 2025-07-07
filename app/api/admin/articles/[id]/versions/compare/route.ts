import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

// GET /api/admin/articles/[id]/versions/compare - Compare two versions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    
    // Check admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || !['admin', 'editor'].includes(profile.role || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get version IDs from query params
    const { searchParams } = new URL(request.url)
    const fromId = searchParams.get('from')
    const toId = searchParams.get('to')
    
    if (!fromId || !toId) {
      return NextResponse.json(
        { error: 'Both "from" and "to" version IDs are required' },
        { status: 400 }
      )
    }

    // Get both versions
    const [fromResult, toResult] = await Promise.all([
      supabase
        .from('article_revisions')
        .select(`
          *,
          author:profiles!article_revisions_author_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('id', fromId)
        .eq('article_id', params.id)
        .single(),
      supabase
        .from('article_revisions')
        .select(`
          *,
          author:profiles!article_revisions_author_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('id', toId)
        .eq('article_id', params.id)
        .single()
    ])
    
    if (fromResult.error || !fromResult.data) {
      return NextResponse.json({ error: 'From version not found' }, { status: 404 })
    }
    
    if (toResult.error || !toResult.data) {
      return NextResponse.json({ error: 'To version not found' }, { status: 404 })
    }

    // Compare fields and create diff
    const fromVersion = fromResult.data
    const toVersion = toResult.data
    
    const changes = {
      title: fromVersion.title !== toVersion.title ? {
        from: fromVersion.title,
        to: toVersion.title
      } : null,
      content: fromVersion.content !== toVersion.content ? {
        from: fromVersion.content,
        to: toVersion.content
      } : null,
      excerpt: fromVersion.excerpt !== toVersion.excerpt ? {
        from: fromVersion.excerpt,
        to: toVersion.excerpt
      } : null,
      status: fromVersion.status !== toVersion.status ? {
        from: fromVersion.status,
        to: toVersion.status
      } : null,
      category_id: fromVersion.category_id !== toVersion.category_id ? {
        from: fromVersion.category_id,
        to: toVersion.category_id
      } : null,
      tags: JSON.stringify(fromVersion.tags) !== JSON.stringify(toVersion.tags) ? {
        from: fromVersion.tags,
        to: toVersion.tags
      } : null,
      is_featured: fromVersion.is_featured !== toVersion.is_featured ? {
        from: fromVersion.is_featured,
        to: toVersion.is_featured
      } : null,
      allow_comments: fromVersion.allow_comments !== toVersion.allow_comments ? {
        from: fromVersion.allow_comments,
        to: toVersion.allow_comments
      } : null,
      meta_title: fromVersion.meta_title !== toVersion.meta_title ? {
        from: fromVersion.meta_title,
        to: toVersion.meta_title
      } : null,
      meta_description: fromVersion.meta_description !== toVersion.meta_description ? {
        from: fromVersion.meta_description,
        to: toVersion.meta_description
      } : null,
      meta_keywords: JSON.stringify(fromVersion.meta_keywords) !== JSON.stringify(toVersion.meta_keywords) ? {
        from: fromVersion.meta_keywords,
        to: toVersion.meta_keywords
      } : null
    }

    // Filter out null changes
    const filteredChanges = Object.entries(changes)
      .filter(([_, value]) => value !== null)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    return NextResponse.json({
      from: {
        id: fromVersion.id,
        revision_number: fromVersion.revision_number,
        created_at: fromVersion.created_at,
        author: fromVersion.author,
        change_summary: fromVersion.change_summary
      },
      to: {
        id: toVersion.id,
        revision_number: toVersion.revision_number,
        created_at: toVersion.created_at,
        author: toVersion.author,
        change_summary: toVersion.change_summary
      },
      changes: filteredChanges,
      hasChanges: Object.keys(filteredChanges).length > 0
    })
  } catch (error) {
    console.error('Compare versions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}

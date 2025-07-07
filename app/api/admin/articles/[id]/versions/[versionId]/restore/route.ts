import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { logActivity } from '@/lib/activity-logger'
import { serverAnalytics } from '@/lib/analytics-server'

// POST /api/admin/articles/[id]/versions/[versionId]/restore - Restore a version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
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
      .select('role, id')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || !['admin', 'editor'].includes(profile.role || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the version to restore
    const { data: version, error: versionError } = await supabase
      .from('article_revisions')
      .select('*')
      .eq('id', params.versionId)
      .eq('article_id', params.id)
      .single()
    
    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Save current state as a new revision before restoring
    const { error: saveError } = await supabase.rpc('save_article_revision', {
      p_article_id: params.id,
      p_author_id: profile.id,
      p_change_summary: `Before restoring to revision #${version.revision_number}`
    })
    
    if (saveError) {
      console.error('Failed to save current state:', saveError)
    }

    // Restore the version
    const { data: restoredArticle, error: restoreError } = await supabase
      .from('articles')
      .update({
        title: version.title,
        content: version.content,
        excerpt: version.excerpt,
        category_id: version.category_id,
        tags: version.tags,
        meta_title: version.meta_title,
        meta_description: version.meta_description,
        meta_keywords: version.meta_keywords,
        status: version.status,
        is_featured: version.is_featured,
        allow_comments: version.allow_comments,
        featured_image: version.featured_image,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (restoreError) {
      console.error('Restore error:', restoreError)
      return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 })
    }

    // Create a new revision for the restore action
    const { error: newRevisionError } = await supabase.rpc('save_article_revision', {
      p_article_id: params.id,
      p_author_id: profile.id,
      p_change_summary: `Restored from revision #${version.revision_number}`
    })
    
    if (newRevisionError) {
      console.error('Failed to save restore revision:', newRevisionError)
    }

    // Log the restore activity
    await logActivity({
      userId: profile.id,
      action: 'update',
      resourceType: 'article',
      resourceId: params.id,
      resourceName: restoredArticle.title,
      metadata: {
        action: 'restore_version',
        restored_from_revision: version.revision_number,
        version_id: params.versionId
      }
    })

    // Track server-side analytics (non-blocking)
    serverAnalytics.trackContentVersion(
      'restored',
      params.id,
      params.versionId,
      profile.id
    ).catch(err => console.error('[Analytics] Failed to track version restore:', err))

    return NextResponse.json({ 
      success: true,
      article: restoredArticle,
      message: `Successfully restored to revision #${version.revision_number}`
    })
  } catch (error) {
    console.error('Restore version error:', error)
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}

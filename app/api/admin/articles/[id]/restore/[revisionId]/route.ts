import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ApiErrors } from '@/lib/api-errors'
import { createRouteSupabaseClient } from '@/lib/supabase-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; revisionId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return ApiErrors.unauthorized()
    }

    const supabase = await createRouteSupabaseClient()
    
    // Check if user has admin access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_id', userId)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required')
    }

    // Get the revision to restore
    const { data: revision, error: revisionError } = await supabase
      .from('article_revisions')
      .select('*')
      .eq('id', params.revisionId)
      .eq('article_id', params.id)
      .single()

    if (revisionError || !revision) {
      return ApiErrors.notFound('Revision not found')
    }

    // Get current article data to create a backup revision
    const { data: currentArticle, error: currentError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (currentError || !currentArticle) {
      return ApiErrors.notFound('Article not found')
    }

    // Start a transaction by creating a backup of current state
    // First, get the latest revision number
    const { data: latestRevision } = await supabase
      .from('article_revisions')
      .select('revision_number')
      .eq('article_id', params.id)
      .order('revision_number', { ascending: false })
      .limit(1)
      .single()

    const nextRevisionNumber = (latestRevision?.revision_number || 0) + 1

    // Create a backup revision of the current state
    const { error: backupError } = await supabase
      .from('article_revisions')
      .insert({
        article_id: params.id,
        title: currentArticle.title,
        content: currentArticle.content,
        excerpt: currentArticle.excerpt,
        revision_number: nextRevisionNumber,
        author_id: profile.id,
        change_summary: `Backup before restoring revision #${revision.revision_number}`
      })

    if (backupError) {
      console.error('Error creating backup revision:', backupError)
      throw new Error('Failed to create backup revision')
    }

    // Update the article with the revision data
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt,
        updated_at: new Date().toISOString(),
        updated_by: profile.id
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error restoring revision:', updateError)
      throw new Error('Failed to restore revision')
    }

    // Create a new revision marking the restore
    const { error: restoreRevisionError } = await supabase
      .from('article_revisions')
      .insert({
        article_id: params.id,
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt,
        revision_number: nextRevisionNumber + 1,
        author_id: profile.id,
        change_summary: `Restored from revision #${revision.revision_number}`
      })

    if (restoreRevisionError) {
      console.error('Error creating restore revision:', restoreRevisionError)
    }

    return NextResponse.json({
      success: true,
      message: `Article restored to revision #${revision.revision_number}`
    })

  } catch (error) {
    return ApiErrors.internal(error, 'article-restore')
  }
}
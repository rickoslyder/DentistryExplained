import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ApiErrors } from '@/lib/api-errors'
import { createRouteSupabaseClient } from '@/lib/supabase-auth'

export async function GET(
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
      .select('role')
      .eq('clerk_id', userId)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required')
    }

    // Get the specific revision
    const { data: revision, error } = await supabase
      .from('article_revisions')
      .select(`
        *,
        profiles!article_revisions_author_id_fkey (
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('id', params.revisionId)
      .eq('article_id', params.id)
      .single()

    if (error || !revision) {
      return ApiErrors.notFound('Revision not found')
    }

    // Get the current article for comparison
    const { data: currentArticle } = await supabase
      .from('articles')
      .select('title, content, excerpt, updated_at')
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      success: true,
      revision,
      currentArticle
    })

  } catch (error) {
    return ApiErrors.internal(error, 'article-revision-detail')
  }
}
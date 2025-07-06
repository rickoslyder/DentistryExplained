import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

// GET /api/admin/articles/[id]/versions - Get all versions of an article
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

    // Get all versions for the article
    const { data: versions, error } = await supabase
      .from('article_revisions')
      .select(`
        id,
        revision_number,
        title,
        excerpt,
        status,
        change_summary,
        created_at,
        author:profiles!article_revisions_author_id_fkey (
          id,
          full_name,
          email,
          image_url
        )
      `)
      .eq('article_id', params.id)
      .order('revision_number', { ascending: false })
    
    if (error) {
      console.error('Error fetching versions:', error)
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    // Get current article data for comparison
    const { data: currentArticle } = await supabase
      .from('articles')
      .select('title, updated_at')
      .eq('id', params.id)
      .single()

    return NextResponse.json({ 
      versions: versions || [],
      currentVersion: currentArticle
    })
  } catch (error) {
    console.error('Get versions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
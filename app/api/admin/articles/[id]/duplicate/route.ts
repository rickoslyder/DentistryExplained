import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

// POST /api/admin/articles/[id]/duplicate - Duplicate article
export async function POST(
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
      .select('role, id')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || !['admin', 'editor'].includes(profile.role || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get original article
    const { data: originalArticle, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !originalArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Create duplicate with modified title and slug
    const timestamp = Date.now()
    const duplicateData = {
      ...originalArticle,
      id: undefined, // Let database generate new ID
      title: `${originalArticle.title} (Copy)`,
      slug: `${originalArticle.slug}-copy-${timestamp}`,
      status: 'draft', // Always set duplicates as draft
      author_id: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: null,
      views: 0,
    }

    // Insert duplicate
    const { data: duplicatedArticle, error: insertError } = await supabase
      .from('articles')
      .insert(duplicateData)
      .select()
      .single()
    
    if (insertError) {
      console.error('Duplicate error:', insertError)
      throw insertError
    }

    return NextResponse.json({ article: duplicatedArticle })
  } catch (error) {
    console.error('Duplicate article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
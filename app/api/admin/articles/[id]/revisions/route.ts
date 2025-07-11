import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ApiErrors } from '@/lib/api-errors'
import { createRouteSupabaseClient } from '@/lib/supabase-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get all revisions for the article
    const { data: revisions, error } = await supabase
      .from('article_revisions')
      .select(`
        id,
        title,
        excerpt,
        revision_number,
        created_at,
        change_summary,
        author_id,
        profiles!article_revisions_author_id_fkey (
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('article_id', params.id)
      .order('revision_number', { ascending: false })

    if (error) {
      console.error('Error fetching revisions:', error)
      throw new Error('Failed to fetch article revisions')
    }

    return NextResponse.json({
      success: true,
      revisions: revisions || []
    })

  } catch (error) {
    return ApiErrors.internal(error, 'article-revisions')
  }
}
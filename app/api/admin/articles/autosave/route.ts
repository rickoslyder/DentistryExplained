import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'

const autosaveSchema = z.object({
  articleId: z.string().uuid().optional().nullable(),
  title: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  featured_image: z.string().optional().nullable(),
  reading_time: z.number().optional(),
  difficulty_level: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = autosaveSchema.parse(body)

    // Check if this is an update to existing article or new draft
    if (validatedData.articleId) {
      // Get latest draft version
      const { data: latestDraft } = await supabase
        .from('article_drafts')
        .select('draft_version')
        .eq('article_id', validatedData.articleId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const nextVersion = latestDraft ? latestDraft.draft_version + 1 : 1

      // Create new draft version
      const { data: draft, error: draftError } = await supabase
        .from('article_drafts')
        .insert({
          article_id: validatedData.articleId,
          user_id: user.id,
          draft_version: nextVersion,
          is_auto_save: true,
          ...validatedData,
        })
        .select()
        .single()

      if (draftError) {
        console.error('Error creating draft:', draftError)
        return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
      }

      // Clean up old drafts (keep last 10)
      await supabase.rpc('cleanup_old_drafts', {
        p_article_id: validatedData.articleId,
        p_user_id: user.id,
      })

      return NextResponse.json({ 
        success: true, 
        draftId: draft.id,
        message: 'Draft saved automatically' 
      })
    } else {
      // Create standalone draft (no article yet)
      const { data: draft, error: draftError } = await supabase
        .from('article_drafts')
        .insert({
          user_id: user.id,
          draft_version: 1,
          is_auto_save: true,
          ...validatedData,
        })
        .select()
        .single()

      if (draftError) {
        console.error('Error creating draft:', draftError)
        return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        draftId: draft.id,
        message: 'New draft created' 
      })
    }
  } catch (error) {
    console.error('Autosave error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to autosave' },
      { status: 500 }
    )
  }
}

// Get latest draft
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const articleId = searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
    }

    // Get latest draft
    const { data: draft } = await supabase
      .rpc('get_latest_draft', {
        p_article_id: articleId,
        p_user_id: user.id,
      })

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Get draft error:', error)
    return NextResponse.json(
      { error: 'Failed to get draft' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { logActivity, formatResourceName, ActivityMetadata } from '@/lib/activity-logger'
import { sanitizeArticleContent, sanitizePlainText } from '@/lib/sanitization'

// Schema for article updates
const updateArticleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  category_id: z.string().uuid("Invalid category"),
  status: z.enum(['draft', 'published', 'archived']),
  tags: z.array(z.string()).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.array(z.string()).optional(),
  is_featured: z.boolean(),
  allow_comments: z.boolean(),
})

// GET /api/admin/articles/[id] - Get single article
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
      .select('role, id')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || !['admin', 'editor'].includes(profile.role || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get article
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Get article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/articles/[id] - Update article
export async function PUT(
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateArticleSchema.parse(body)
    
    // Sanitize all input data
    const sanitizedData = {
      ...validatedData,
      title: sanitizePlainText(validatedData.title),
      slug: sanitizePlainText(validatedData.slug),
      content: sanitizeArticleContent(validatedData.content),
      excerpt: validatedData.excerpt ? sanitizePlainText(validatedData.excerpt) : undefined,
      tags: validatedData.tags?.map(tag => sanitizePlainText(tag)) || [],
      meta_title: validatedData.meta_title ? sanitizePlainText(validatedData.meta_title) : undefined,
      meta_description: validatedData.meta_description ? sanitizePlainText(validatedData.meta_description) : undefined,
      meta_keywords: validatedData.meta_keywords?.map(kw => sanitizePlainText(kw)) || [],
    }

    // Check if slug is unique (excluding current article)
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', sanitizedData.slug)
      .neq('id', params.id)
      .single()
    
    if (existingArticle) {
      return NextResponse.json(
        { error: 'An article with this slug already exists' },
        { status: 400 }
      )
    }

    // Get original article for comparison
    const { data: originalArticle } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single()

    // Save current version to revisions before updating
    if (originalArticle) {
      const { error: revisionError } = await supabase.rpc('save_article_revision', {
        p_article_id: params.id,
        p_author_id: profile.id,
        p_change_summary: body.changeNotes || null
      })
      
      if (revisionError) {
        console.error('Failed to save revision:', revisionError)
        // Continue with update even if revision fails
      }
    }

    // Update article
    const { data: article, error } = await supabase
      .from('articles')
      .update({
        ...sanitizedData,
        updated_at: new Date().toISOString(),
        published_at: sanitizedData.status === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      console.error('Update error:', error)
      throw error
    }

    // Log the update activity
    await logActivity({
      userId: profile.id,
      action: 'update',
      resourceType: 'article',
      resourceId: article.id,
      resourceName: formatResourceName('article', article),
      metadata: ActivityMetadata.articleUpdate({
        before: originalArticle,
        after: article
      })
    })

    return NextResponse.json({ article })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Update article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/articles/[id] - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    
    // Check admin access (only admins can delete)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete articles' }, { status: 403 })
    }

    // Get article details before deletion for logging
    const { data: article } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single()

    // Delete article
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      console.error('Delete error:', error)
      throw error
    }

    // Log the deletion
    if (article) {
      await logActivity({
        userId: profile.id,
        action: 'delete',
        resourceType: 'article',
        resourceId: params.id,
        resourceName: formatResourceName('article', article),
        metadata: {
          title: article.title,
          status: article.status
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
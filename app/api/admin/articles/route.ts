import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'

// Article validation schema
const articleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  category_id: z.string().uuid('Invalid category'),
  status: z.enum(['draft', 'published', 'archived']),
  tags: z.array(z.string()).optional().default([]),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.array(z.string()).optional().default([]),
  is_featured: z.boolean().optional().default(false),
  allow_comments: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Check if user is admin/editor
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, user_type, role')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || profile.user_type !== 'professional' || !['admin', 'editor'].includes(profile.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = articleSchema.parse(body)
    
    // Calculate read time (rough estimate: 225 words per minute)
    const wordCount = validatedData.content.split(/\s+/g).length
    const readTime = Math.ceil(wordCount / 225)
    
    // Insert article
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        ...validatedData,
        author_id: profile.id,
        read_time: readTime,
        published_at: validatedData.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating article:', error)
      return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
    }
    
    // Create initial revision using the function
    const { error: revisionError } = await supabase.rpc('save_article_revision', {
      p_article_id: article.id,
      p_author_id: profile.id,
      p_change_summary: 'Initial version'
    })
    
    if (revisionError) {
      console.error('Failed to save initial revision:', revisionError)
    }
    
    return NextResponse.json(article, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    
    console.error('Error in POST /api/admin/articles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Check if user has access
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, role')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || profile.user_type !== 'professional') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build query
    let query = supabase
      .from('articles')
      .select(`
        *,
        category:categories(name),
        author:profiles!articles_author_id_fkey(full_name)
      `)
    
    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category_id', category)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }
    
    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data: articles, error } = await query
    
    if (error) {
      console.error('Error fetching articles:', error)
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
    }
    
    return NextResponse.json(articles)
    
  } catch (error) {
    console.error('Error in GET /api/admin/articles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
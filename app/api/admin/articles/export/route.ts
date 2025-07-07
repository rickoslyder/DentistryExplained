import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { parse } from 'json2csv'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const categoryId = searchParams.get('categoryId')
    
    // Build query
    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        status,
        tags,
        meta_title,
        meta_description,
        meta_keywords,
        is_featured,
        allow_comments,
        views,
        created_at,
        updated_at,
        published_at,
        scheduled_at,
        category:categories(id, name, slug),
        author:profiles!articles_author_id_fkey(id, email, first_name, last_name)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    const { data: articles, error } = await query
    
    if (error) {
      console.error('Error fetching articles for export:', error)
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      )
    }
    
    // Transform data for export
    const exportData = articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || '',
      status: article.status,
      category_id: article.category?.id || '',
      category_name: article.category?.name || '',
      category_slug: article.category?.slug || '',
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
      meta_title: article.meta_title || '',
      meta_description: article.meta_description || '',
      meta_keywords: Array.isArray(article.meta_keywords) ? article.meta_keywords.join(', ') : '',
      is_featured: article.is_featured,
      allow_comments: article.allow_comments,
      views: article.views || 0,
      author_id: article.author?.id || '',
      author_email: article.author?.email || '',
      author_name: article.author?.first_name && article.author?.last_name 
        ? `${article.author.first_name} ${article.author.last_name}`
        : '',
      created_at: article.created_at,
      updated_at: article.updated_at,
      published_at: article.published_at || '',
      scheduled_at: article.scheduled_at || ''
    }))
    
    // Return data based on format
    if (format === 'csv') {
      try {
        const csv = parse(exportData, {
          fields: [
            'id', 'title', 'slug', 'excerpt', 'status',
            'category_id', 'category_name', 'category_slug',
            'tags', 'meta_title', 'meta_description', 'meta_keywords',
            'is_featured', 'allow_comments', 'views',
            'author_id', 'author_email', 'author_name',
            'created_at', 'updated_at', 'published_at', 'scheduled_at',
            'content' // Content last as it can be long
          ]
        })
        
        const filename = `articles-export-${new Date().toISOString().split('T')[0]}.csv`
        
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}"`
          }
        })
      } catch (csvError) {
        console.error('CSV conversion error:', csvError)
        return NextResponse.json(
          { error: 'Failed to convert to CSV' },
          { status: 500 }
        )
      }
    } else {
      // JSON format
      const filename = `articles-export-${new Date().toISOString().split('T')[0]}.json`
      
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }
  } catch (error) {
    console.error('Error in articles export:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
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

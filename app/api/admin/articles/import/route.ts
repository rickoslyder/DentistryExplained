import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { parse as csvParse } from 'csv-parse/sync'

// Schema for article import validation
const articleImportSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  category_id: z.string().uuid().optional().nullable(),
  tags: z.union([
    z.array(z.string()),
    z.string().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(Boolean) : [])
  ]).optional().default([]),
  meta_title: z.string().max(60).optional().nullable(),
  meta_description: z.string().max(160).optional().nullable(),
  meta_keywords: z.union([
    z.array(z.string()),
    z.string().transform(val => val ? val.split(',').map(kw => kw.trim()).filter(Boolean) : [])
  ]).optional().default([]),
  is_featured: z.union([
    z.boolean(),
    z.string().transform(val => val === 'true' || val === '1')
  ]).default(false),
  allow_comments: z.union([
    z.boolean(),
    z.string().transform(val => val === 'true' || val === '1')
  ]).default(true),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const format = formData.get('format') as string || 'json'
    const duplicateAction = formData.get('duplicateAction') as string || 'skip'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    const fileContent = await file.text()
    let articles: any[] = []
    
    // Parse file based on format
    try {
      if (format === 'csv') {
        articles = csvParse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        })
      } else {
        articles = JSON.parse(fileContent)
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid file format. Please check your file.' },
        { status: 400 }
      )
    }
    
    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { error: 'No articles found in the file' },
        { status: 400 }
      )
    }
    
    // Get existing slugs to check for duplicates
    const { data: existingSlugs } = await supabase
      .from('articles')
      .select('slug')
    
    const existingSlugSet = new Set(existingSlugs?.map(a => a.slug) || [])
    
    // Get valid category IDs
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
    
    const validCategoryIds = new Set(categories?.map(c => c.id) || [])
    
    // Process and validate articles
    const results = {
      success: [] as any[],
      errors: [] as any[],
      skipped: [] as any[]
    }
    
    for (const [index, article] of articles.entries()) {
      try {
        // Validate article data
        const validatedArticle = articleImportSchema.parse(article)
        
        // Check for duplicate slug
        if (existingSlugSet.has(validatedArticle.slug)) {
          if (duplicateAction === 'skip') {
            results.skipped.push({
              index,
              title: validatedArticle.title,
              slug: validatedArticle.slug,
              reason: 'Duplicate slug'
            })
            continue
          } else if (duplicateAction === 'rename') {
            // Generate new slug
            let newSlug = validatedArticle.slug
            let counter = 1
            while (existingSlugSet.has(newSlug)) {
              newSlug = `${validatedArticle.slug}-${counter}`
              counter++
            }
            validatedArticle.slug = newSlug
          }
          // If duplicateAction === 'update', we'll update the existing article
        }
        
        // Validate category ID if provided
        if (validatedArticle.category_id && !validCategoryIds.has(validatedArticle.category_id)) {
          results.errors.push({
            index,
            title: validatedArticle.title,
            error: 'Invalid category ID'
          })
          continue
        }
        
        // Prepare article data
        const articleData = {
          ...validatedArticle,
          author_id: profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          published_at: validatedArticle.status === 'published' ? new Date().toISOString() : null
        }
        
        let result
        
        if (duplicateAction === 'update' && existingSlugSet.has(validatedArticle.slug)) {
          // Update existing article
          const { data, error } = await supabase
            .from('articles')
            .update(articleData)
            .eq('slug', validatedArticle.slug)
            .select()
            .single()
          
          if (error) throw error
          result = data
        } else {
          // Insert new article
          const { data, error } = await supabase
            .from('articles')
            .insert(articleData)
            .select()
            .single()
          
          if (error) throw error
          result = data
          existingSlugSet.add(validatedArticle.slug)
        }
        
        results.success.push({
          index,
          id: result.id,
          title: result.title,
          slug: result.slug,
          action: duplicateAction === 'update' && existingSlugSet.has(validatedArticle.slug) ? 'updated' : 'created'
        })
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          results.errors.push({
            index,
            title: article.title || 'Unknown',
            error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          })
        } else {
          results.errors.push({
            index,
            title: article.title || 'Unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }
    
    // Log the import activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: profile.id,
        action: 'import',
        resource_type: 'articles',
        resource_id: 'bulk',
        resource_name: `Imported ${results.success.length} articles`,
        metadata: {
          total_processed: articles.length,
          success_count: results.success.length,
          error_count: results.errors.length,
          skipped_count: results.skipped.length,
          format,
          duplicate_action: duplicateAction
        }
      })
    
    return NextResponse.json({
      message: `Import completed. ${results.success.length} articles imported successfully.`,
      results
    })
    
  } catch (error) {
    console.error('Error in articles import:', error)
    return NextResponse.json(
      { error: 'Import failed. Please check your file and try again.' },
      { status: 500 }
    )
  }
}
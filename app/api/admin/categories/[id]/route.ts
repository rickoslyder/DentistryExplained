import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { logActivity, formatResourceName, ActivityMetadata } from '@/lib/activity-logger'

// Schema for category updates
const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().optional(),
})

// PUT /api/admin/categories/[id] - Update category
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
    const validatedData = updateCategorySchema.parse(body)

    // Check if slug is unique (excluding current category)
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', validatedData.slug)
      .neq('id', params.id)
      .single()
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      )
    }

    // Get original category for comparison
    const { data: originalCategory } = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .single()

    // Update category
    const { data: category, error } = await supabase
      .from('categories')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error

    // Log the update
    await logActivity({
      userId: profile.id,
      action: 'update',
      resourceType: 'category',
      resourceId: category.id,
      resourceName: formatResourceName('category', category),
      metadata: {
        changes: {
          name: originalCategory?.name !== category.name 
            ? { from: originalCategory?.name, to: category.name }
            : undefined,
          slug: originalCategory?.slug !== category.slug
            ? { from: originalCategory?.slug, to: category.slug }
            : undefined,
        }
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/categories/[id] - Delete category
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
      return NextResponse.json({ error: 'Only admins can delete categories' }, { status: 403 })
    }

    // Check if category has articles
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', params.id)
    
    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with articles. Please reassign articles first.' },
        { status: 400 }
      )
    }

    // Get category details before deletion
    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .single()

    // Delete category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', params.id)
    
    if (error) throw error

    // Log the deletion
    if (category) {
      await logActivity({
        userId: profile.id,
        action: 'delete',
        resourceType: 'category',
        resourceId: params.id,
        resourceName: formatResourceName('category', category),
        metadata: {
          name: category.name,
          slug: category.slug
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
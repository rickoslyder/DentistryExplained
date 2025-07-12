import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { ApiErrors } from '@/lib/api-errors'
import { cacheInvalidator } from '@/lib/cache'

const updateTermSchema = z.object({
  term: z.string().min(1).optional(),
  definition: z.string().min(1).optional(),
  pronunciation: z.string().optional(),
  also_known_as: z.array(z.string()).optional(),
  related_terms: z.array(z.string()).optional(),
  category: z.string().optional(),
  difficulty: z.enum(['basic', 'advanced']).optional(),
  example: z.string().optional()
})

// GET - Get single term
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const { data, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) {
      return ApiErrors.databaseError(error)
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Term not found' }, { status: 404 })
    }
    
    return NextResponse.json({ term: data })
    
  } catch (error) {
    return ApiErrors.internalError('admin-glossary-get', error)
  }
}

// PATCH - Update term
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const body = await request.json()
    const validation = updateTermSchema.safeParse(body)
    
    if (!validation.success) {
      return ApiErrors.validationError(validation.error)
    }
    
    const { data, error } = await supabase
      .from('glossary_terms')
      .update(validation.data)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      return ApiErrors.databaseError(error)
    }
    
    // Invalidate glossary cache
    await cacheInvalidator.invalidateByTags(['glossary'])
    
    return NextResponse.json({ term: data })
    
  } catch (error) {
    return ApiErrors.internalError('admin-glossary-update', error)
  }
}

// DELETE - Delete term
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const { error } = await supabase
      .from('glossary_terms')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      return ApiErrors.databaseError(error)
    }
    
    // Invalidate glossary cache
    await cacheInvalidator.invalidateByTags(['glossary'])
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    return ApiErrors.internalError('admin-glossary-delete', error)
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}

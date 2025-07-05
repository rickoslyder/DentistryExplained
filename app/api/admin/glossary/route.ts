import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { ApiErrors } from '@/lib/api-errors'

const glossaryTermSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
  pronunciation: z.string().optional(),
  also_known_as: z.array(z.string()).optional(),
  related_terms: z.array(z.string()).optional(),
  category: z.string().optional(),
  difficulty: z.enum(['basic', 'advanced']).optional(),
  example: z.string().optional()
})

// GET - List all terms with optional filtering
export async function GET(request: NextRequest) {
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
    
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    
    let query = supabase
      .from('glossary_terms')
      .select('*')
      .order('term')
    
    if (search) {
      query = query.or(`term.ilike.%${search}%,definition.ilike.%${search}%`)
    }
    
    if (category) {
      query = query.eq('category', category)
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }
    
    const { data, error } = await query
    
    if (error) {
      return ApiErrors.databaseError(error)
    }
    
    return NextResponse.json({ terms: data || [] })
    
  } catch (error) {
    return ApiErrors.internalError('admin-glossary-list', error)
  }
}

// POST - Create new term
export async function POST(request: NextRequest) {
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
    const validation = glossaryTermSchema.safeParse(body)
    
    if (!validation.success) {
      return ApiErrors.validationError(validation.error)
    }
    
    const { data, error } = await supabase
      .from('glossary_terms')
      .insert(validation.data)
      .select()
      .single()
    
    if (error) {
      return ApiErrors.databaseError(error)
    }
    
    return NextResponse.json({ term: data })
    
  } catch (error) {
    return ApiErrors.internalError('admin-glossary-create', error)
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'

const updateSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(['anatomy', 'conditions', 'procedures', 'materials', 'orthodontics', 'pediatric', 'costs', 'prosthetics', 'specialties']).optional(),
  difficulty: z.enum(['basic', 'advanced']).optional(),
  pronunciation: z.string().optional(),
  also_known_as: z.array(z.string()).optional(),
  related_terms: z.array(z.string()).optional(),
  example: z.string().optional()
})

const requestSchema = z.object({
  updates: z.array(updateSchema)
})

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate user is admin
    const supabase = await createServerSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', userId)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse and validate request
    const body = await request.json()
    const { updates } = requestSchema.parse(body)

    // Apply updates
    const results = []
    const errors = []

    for (const update of updates) {
      const { id, ...fields } = update
      
      const { data, error } = await supabase
        .from('glossary_terms')
        .update({
          ...fields,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        errors.push({ id, error: error.message })
      } else {
        results.push(data)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        updated: results.length,
        errors
      }, { status: 207 }) // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      data: results
    })

  } catch (error) {
    console.error('Metadata update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to update metadata',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
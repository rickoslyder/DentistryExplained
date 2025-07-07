import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth } from '@/lib/api-middleware'
import { z } from 'zod'

// Widget configuration schema
const widgetConfigSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  minW: z.number().optional(),
  minH: z.number().optional(),
  maxW: z.number().optional(),
  maxH: z.number().optional(),
  static: z.boolean().optional(),
  isDraggable: z.boolean().optional(),
  isResizable: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
})

// Layout update schema
const layoutUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  widgets: z.array(widgetConfigSchema).optional(),
  settings: z.record(z.any()).optional(),
  is_default: z.boolean().optional(),
})

// GET handler to fetch user's dashboard layout
const getHandler = withAuth(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const userProfile = context.userProfile!
    
    console.log('[Dashboard Layout API] Fetching for profile:', userProfile.id)
    
    // Get user's dashboard layout - use direct query instead of RPC
    const { data, error } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('user_id', userProfile.id)
      .eq('is_default', true)
      .single()
    
    console.log('[Dashboard Layout API] Query result:', { data, error })
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Dashboard Layout API] Database error:', error)
      return ApiErrors.fromDatabaseError(error, 'get_dashboard_layout', requestId)
    }
    
    // If no layout exists, return null (frontend will use default)
    return NextResponse.json({ layout: data || null })
  } catch (error) {
    return ApiErrors.internal(error, 'get_dashboard_layout', requestId)
  }
}, { requireRole: 'admin' })

// PUT handler to update dashboard layout
const putHandler = withAuth(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const body = await request.json()
    const validatedData = layoutUpdateSchema.parse(body)
    
    const supabase = context.supabase!
    const userProfile = context.userProfile!
    
    // Check if user has any layouts
    const { data: existingLayouts } = await supabase
      .from('dashboard_layouts')
      .select('id')
      .eq('user_id', userProfile.id)
      .limit(1)
    
    let result
    
    if (!existingLayouts || existingLayouts.length === 0) {
      // Create new layout
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .insert({
          user_id: userProfile.id,
          name: validatedData.name || 'My Dashboard',
          description: validatedData.description,
          widgets: validatedData.widgets || [],
          settings: validatedData.settings || {},
          is_default: true,
        })
        .select()
        .single()
      
      if (error) {
        return ApiErrors.fromDatabaseError(error, 'create_dashboard_layout', requestId)
      }
      
      result = data
    } else {
      // Update existing default layout
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .update({
          name: validatedData.name,
          description: validatedData.description,
          widgets: validatedData.widgets,
          settings: validatedData.settings,
          is_default: validatedData.is_default,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userProfile.id)
        .eq('is_default', true)
        .select()
        .single()
      
      if (error) {
        return ApiErrors.fromDatabaseError(error, 'update_dashboard_layout', requestId)
      }
      
      result = data
    }
    
    // Log the update
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userProfile.id,
        action: 'update_dashboard_layout',
        resource_type: 'dashboard_layout',
        resource_id: result.id,
        details: {
          widgets_count: validatedData.widgets?.length || 0,
        },
      })
    
    return NextResponse.json({ 
      layout: result,
      message: 'Dashboard layout updated successfully' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.fromValidationError(error, requestId)
    }
    return ApiErrors.internal(error, 'update_dashboard_layout', requestId)
  }
}, { requireRole: 'admin' })

// POST handler to create new layout
const postHandler = withAuth(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const body = await request.json()
    const validatedData = layoutUpdateSchema.parse(body)
    
    const supabase = context.supabase!
    const userProfile = context.userProfile!
    
    // Create new layout
    const { data, error } = await supabase
      .from('dashboard_layouts')
      .insert({
        user_id: userProfile.id,
        name: validatedData.name || 'New Dashboard',
        description: validatedData.description,
        widgets: validatedData.widgets || [],
        settings: validatedData.settings || {},
        is_default: validatedData.is_default || false,
      })
      .select()
      .single()
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'create_dashboard_layout', requestId)
    }
    
    // Log the creation
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userProfile.id,
        action: 'create_dashboard_layout',
        resource_type: 'dashboard_layout',
        resource_id: data.id,
        details: {
          name: data.name,
        },
      })
    
    return NextResponse.json({ 
      layout: data,
      message: 'Dashboard layout created successfully' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.fromValidationError(error, requestId)
    }
    return ApiErrors.internal(error, 'create_dashboard_layout', requestId)
  }
}, { requireRole: 'admin' })

export const GET = getHandler
export const PUT = putHandler
export const POST = postHandler

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}
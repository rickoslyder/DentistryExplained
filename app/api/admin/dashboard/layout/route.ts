import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
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
const getHandler = compose(
  withRateLimit(60000, 100),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const userId = context.userId!
    
    // Get user's dashboard layout
    const { data, error } = await supabase
      .rpc('get_user_dashboard_layout', { p_user_id: userId })
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'get_dashboard_layout', requestId)
    }
    
    return NextResponse.json({ layout: data })
  } catch (error) {
    return ApiErrors.internal(error, 'get_dashboard_layout', requestId)
  }
})

// PUT handler to update dashboard layout
const putHandler = compose(
  withRateLimit(60000, 50),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const body = await request.json()
    const validatedData = layoutUpdateSchema.parse(body)
    
    const supabase = context.supabase!
    const userId = context.userId!
    
    // Check if user has any layouts
    const { data: existingLayouts } = await supabase
      .from('dashboard_layouts')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
    let result
    
    if (!existingLayouts || existingLayouts.length === 0) {
      // Create new layout
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .insert({
          user_id: userId,
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
        .eq('user_id', userId)
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
        user_id: userId,
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
})

// POST handler to create new layout
const postHandler = compose(
  withRateLimit(60000, 20),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const body = await request.json()
    const validatedData = layoutUpdateSchema.parse(body)
    
    const supabase = context.supabase!
    const userId = context.userId!
    
    // Create new layout
    const { data, error } = await supabase
      .from('dashboard_layouts')
      .insert({
        user_id: userId,
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
        user_id: userId,
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
})

export const GET = getHandler
export const PUT = putHandler
export const POST = postHandler
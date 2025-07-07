import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { logActivity, ActivityMetadata } from '@/lib/activity-logger'
import { z } from 'zod'

// Schema for updating settings
const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.record(z.any())
})

// GET /api/admin/settings - Get settings
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
    
    // Get category from query params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    // Fetch settings
    let query = supabase
      .from('settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true })
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data: settings, error } = await query
    
    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }
    
    // Group settings by category
    const groupedSettings = settings.reduce((acc: any, setting: any) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
    }, {})
    
    return NextResponse.json(
      { settings: groupedSettings },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// PUT /api/admin/settings - Update a single setting
export async function PUT(request: NextRequest) {
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
    
    // Parse and validate request body
    const body = await request.json()
    const validation = updateSettingSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const { key, value } = validation.data
    
    // Update setting using the database function
    const { data, error } = await supabase
      .rpc('update_setting', {
        p_key: key,
        p_value: value
      })
    
    if (error) {
      console.error('Error updating setting:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update setting' },
        { status: 500 }
      )
    }
    
    // Fetch the updated setting
    const { data: updatedSetting } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .single()
    
    // Log the settings update
    await logActivity({
      userId: profile.id,
      action: 'update',
      resourceType: 'settings',
      resourceId: key,
      resourceName: key,
      metadata: ActivityMetadata.settingsUpdate(key, value)
    })
    
    return NextResponse.json({ 
      success: true,
      setting: updatedSetting 
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// POST /api/admin/settings - Batch update multiple settings
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
    
    const body = await request.json()
    const { settings } = body
    
    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings must be an array' },
        { status: 400 }
      )
    }
    
    const results = []
    const errors = []
    
    // Update each setting
    for (const setting of settings) {
      const validation = updateSettingSchema.safeParse(setting)
      
      if (!validation.success) {
        errors.push({
          key: setting.key,
          error: 'Invalid data',
          details: validation.error.errors
        })
        continue
      }
      
      const { data, error } = await supabase
        .rpc('update_setting', {
          p_key: validation.data.key,
          p_value: validation.data.value
        })
      
      if (error) {
        errors.push({
          key: validation.data.key,
          error: error.message
        })
      } else {
        results.push({
          key: validation.data.key,
          success: true
        })
      }
    }
    
    // Log batch update
    await logActivity({
      userId: profile.id,
      action: 'update',
      resourceType: 'settings',
      resourceId: 'batch',
      resourceName: 'Batch Settings Update',
      metadata: {
        updated_count: results.length,
        error_count: errors.length,
        keys: settings.map(s => s.key)
      }
    })
    
    return NextResponse.json({
      results,
      errors,
      success: errors.length === 0
    })
  } catch (error) {
    console.error('Error in POST /api/admin/settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}
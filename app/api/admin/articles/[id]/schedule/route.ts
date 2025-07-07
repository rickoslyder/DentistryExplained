import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get active schedule for the article
    const { data: schedule, error } = await supabase
      .from('scheduled_articles')
      .select('*')
      .eq('article_id', params.id)
      .in('status', ['pending', 'processing'])
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching schedule:', error)
      throw error
    }
    
    return NextResponse.json({ schedule: schedule || null })
  } catch (error) {
    console.error('Error in GET /api/admin/articles/[id]/schedule:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { scheduled_at } = body
    
    if (!scheduled_at) {
      return new NextResponse('scheduled_at is required', { status: 400 })
    }
    
    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduled_at)
    if (scheduledDate <= new Date()) {
      return new NextResponse('Scheduled time must be in the future', { status: 400 })
    }
    
    // Check if article exists and is in draft status
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, status')
      .eq('id', params.id)
      .single()
    
    if (articleError || !article) {
      return new NextResponse('Article not found', { status: 404 })
    }
    
    if (article.status !== 'draft') {
      return new NextResponse('Only draft articles can be scheduled', { status: 400 })
    }
    
    // Cancel any existing schedule
    await supabase
      .from('scheduled_articles')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('article_id', params.id)
      .in('status', ['pending', 'processing'])
    
    // Create new schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('scheduled_articles')
      .insert({
        article_id: params.id,
        scheduled_at,
        created_by: profile.id,
        status: 'pending'
      })
      .select()
      .single()
    
    if (scheduleError) {
      console.error('Error creating schedule:', scheduleError)
      throw scheduleError
    }
    
    // Update article with schedule info
    await supabase
      .from('articles')
      .update({
        scheduled_status: 'pending',
        scheduled_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: profile.id,
        action: 'schedule',
        resource_type: 'article',
        resource_id: params.id,
        resource_name: article.title,
        metadata: {
          scheduled_at,
          schedule_id: schedule.id
        }
      })
    
    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Error in POST /api/admin/articles/[id]/schedule:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get article details
    const { data: article } = await supabase
      .from('articles')
      .select('title')
      .eq('id', params.id)
      .single()
    
    // Cancel active schedules
    const { error } = await supabase
      .from('scheduled_articles')
      .update({ 
        status: 'cancelled', 
        updated_at: new Date().toISOString() 
      })
      .eq('article_id', params.id)
      .in('status', ['pending', 'processing'])
    
    if (error) {
      console.error('Error cancelling schedule:', error)
      throw error
    }
    
    // Update article
    await supabase
      .from('articles')
      .update({
        scheduled_status: null,
        scheduled_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: profile.id,
        action: 'cancel_schedule',
        resource_type: 'article',
        resource_id: params.id,
        resource_name: article?.title || 'Unknown Article',
        metadata: {}
      })
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/admin/articles/[id]/schedule:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}

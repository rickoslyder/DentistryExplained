import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createRouteSupabaseClient, getCurrentUserProfile } from '@/lib/supabase-auth'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's profile to get their database ID
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { articleSlug, articleTitle, articleCategory } = await request.json()

    if (!articleSlug) {
      return NextResponse.json({ error: 'Article slug is required' }, { status: 400 })
    }

    // Create authenticated Supabase client
    const supabase = await createRouteSupabaseClient()

    // Check if bookmark already exists
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userProfile.id)
      .eq('article_slug', articleSlug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Article already bookmarked' }, { status: 409 })
    }

    // Create bookmark
    const { error } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: userProfile.id,
          article_slug: articleSlug,
          article_title: articleTitle,
          article_category: articleCategory,
        },
      ])

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bookmark creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's profile to get their database ID
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Create authenticated Supabase client
    const supabase = await createRouteSupabaseClient()

    let query = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('article_category', category)
    }

    const { data: bookmarks, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({ bookmarks })
  } catch (error) {
    console.error('Bookmarks fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's profile to get their database ID
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const articleSlug = searchParams.get('articleSlug')

    if (!articleSlug) {
      return NextResponse.json({ error: 'Article slug is required' }, { status: 400 })
    }

    // Create authenticated Supabase client
    const supabase = await createRouteSupabaseClient()

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userProfile.id)
      .eq('article_slug', articleSlug)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bookmark deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Fetch all glossary terms
    const { data: terms, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .order('term', { ascending: true })
    
    if (error) {
      console.error('Error fetching glossary terms:', error)
      return NextResponse.json({ error: 'Failed to fetch glossary terms' }, { status: 500 })
    }
    
    return NextResponse.json({ terms: terms || [] })
    
  } catch (error) {
    console.error('Glossary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
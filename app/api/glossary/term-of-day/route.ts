import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get today's date as a seed for consistent daily term
    const today = new Date().toISOString().split('T')[0]
    
    // First get count of terms
    const { count, error: countError } = await supabase
      .from('glossary_terms')
      .select('*', { count: 'exact', head: true })
    
    if (countError || !count) {
      console.error('Error getting term count:', countError)
      return NextResponse.json({ error: 'Failed to get term count' }, { status: 500 })
    }
    
    // Use date as seed to get consistent index for the day
    const dateHash = today.split('-').reduce((acc, val) => acc + parseInt(val), 0)
    const termIndex = dateHash % count
    
    // Fetch the term at that index
    const { data: terms, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .order('term', { ascending: true })
      .range(termIndex, termIndex)
      .single()
    
    if (error) {
      console.error('Error fetching term of the day:', error)
      return NextResponse.json({ error: 'Failed to fetch term of the day' }, { status: 500 })
    }
    
    return NextResponse.json({ term: terms, date: today })
    
  } catch (error) {
    console.error('Term of the day error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
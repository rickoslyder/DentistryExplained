import { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { GlossaryPageClient } from '@/components/admin/glossary-page-client'

export const metadata: Metadata = {
  title: 'Glossary Management | Admin',
  description: 'Manage glossary terms and view analytics',
}

async function getGlossaryStats() {
  const supabase = await createServerSupabaseClient()
  
  // Get term stats
  const { data: termStats } = await supabase
    .from('glossary_term_stats')
    .select('*')
    .order('total_views', { ascending: false })
    .limit(10)

  // Get all terms with full metadata
  const { data: allTerms } = await supabase
    .from('glossary_terms')
    .select('id, term, definition, category, difficulty, pronunciation, also_known_as, related_terms, example, created_at')
    .order('created_at', { ascending: false })

  // Get total counts
  const { count: totalTerms } = await supabase
    .from('glossary_terms')
    .select('*', { count: 'exact', head: true })

  // Get interaction totals
  const { data: interactionStats } = await supabase
    .from('glossary_interactions')
    .select('interaction_type')
  
  const interactionCounts = interactionStats?.reduce((acc, item) => {
    acc[item.interaction_type] = (acc[item.interaction_type] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Count terms with missing metadata
  const termsWithMissingMetadata = allTerms?.filter(term => 
    !term.category || 
    !term.difficulty || 
    !term.pronunciation || 
    !term.also_known_as || 
    !term.related_terms || 
    !term.example
  ).length || 0

  return {
    termStats: termStats || [],
    allTerms: allTerms || [],
    totalTerms: totalTerms || 0,
    totalViews: interactionCounts.view || 0,
    totalCopies: interactionCounts.copy || 0,
    totalYouTube: interactionCounts.youtube || 0,
    termsWithMissingMetadata,
  }
}

export default async function AdminGlossaryPage() {
  const stats = await getGlossaryStats()

  return <GlossaryPageClient stats={stats} />
}
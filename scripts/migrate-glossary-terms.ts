import { createClient } from '@supabase/supabase-js'
import { enhancedGlossaryTerms } from '../data/glossary-enhanced'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateGlossaryTerms() {
  console.log('Starting glossary terms migration...')
  
  // First, delete existing terms to avoid duplicates
  const { error: deleteError } = await supabase
    .from('glossary_terms')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
  if (deleteError) {
    console.error('Error deleting existing terms:', deleteError)
    return
  }
  
  console.log('Deleted existing terms')
  
  // Prepare terms for insertion
  const termsToInsert = enhancedGlossaryTerms.map(term => ({
    term: term.term,
    definition: term.definition,
    pronunciation: term.pronunciation || null,
    also_known_as: term.also_known_as || [],
    related_terms: term.related_terms || [],
    category: term.category || 'general',
    difficulty: term.difficulty || null,
    example: term.example || null
  }))
  
  // Insert in batches of 50 to avoid timeout
  const batchSize = 50
  let successCount = 0
  
  for (let i = 0; i < termsToInsert.length; i += batchSize) {
    const batch = termsToInsert.slice(i, i + batchSize)
    
    const { data, error } = await supabase
      .from('glossary_terms')
      .insert(batch)
      .select()
      
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
    } else {
      successCount += data.length
      console.log(`Inserted batch ${i / batchSize + 1} (${data.length} terms)`)
    }
  }
  
  console.log(`Migration complete! Inserted ${successCount} out of ${termsToInsert.length} terms`)
}

// Run the migration
migrateGlossaryTerms()
  .then(() => {
    console.log('Migration finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
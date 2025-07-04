const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('No profiles table found (expected for fresh database)')
      console.log('Error:', error.message)
    } else {
      console.log('✓ Supabase connection successful')
      console.log('Data:', data)
    }
    
    // Test creating a simple table
    console.log('\nTesting table creation...')
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY, name text);'
    })
    
    if (createError) {
      console.log('Cannot create table via RPC (expected limitation)')
      console.log('Error:', createError.message)
    } else {
      console.log('✓ Table creation successful')
    }
    
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

testSupabase()
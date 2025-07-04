import { supabaseAdmin } from './supabase'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * Execute the database schema migration
 */
export async function setupDatabase() {
  try {
    // Read the SQL schema file
    const schemaPath = path.join(process.cwd(), 'lib', 'database-schema.sql')
    const schema = readFileSync(schemaPath, 'utf8')

    // Execute the schema
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: schema
    })

    if (error) {
      console.error('Database setup error:', error)
      throw error
    }

    console.log('Database schema created successfully')
    return { success: true }
  } catch (error) {
    console.error('Failed to setup database:', error)
    throw error
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database connection test failed:', error)
      return false
    }

    console.log('Database connection successful')
    return true
  } catch (error) {
    console.error('Database connection test error:', error)
    return false
  }
}
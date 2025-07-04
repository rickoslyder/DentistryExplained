const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Parse DATABASE_URL to get connection details
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

// Create direct postgres connection
const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
})

async function setupDatabase() {
  try {
    console.log('Connecting to database...')
    await client.connect()
    
    console.log('Setting up database schema...')
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'lib', 'database-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('Executing database schema...')
    
    // Execute the entire schema as one transaction
    await client.query('BEGIN')
    
    try {
      await client.query(schema)
      await client.query('COMMIT')
      console.log('✓ Database schema created successfully')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
    
    // Test the connection by checking if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'profiles'
    `)
    
    if (result.rows.length > 0) {
      console.log('✓ Database connection and schema test successful')
    } else {
      console.log('⚠ Database schema may not have been created properly')
    }
    
  } catch (error) {
    console.error('Database setup failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

setupDatabase()
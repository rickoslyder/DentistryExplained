#!/usr/bin/env node

// This script validates environment variables at build/start time
import { validateEnv, checkServiceConnections } from './env-validation'

console.log('🔍 Checking environment variables...\n')

try {
  validateEnv()
  const services = checkServiceConnections()
  
  console.log('✅ Environment validation passed!\n')
  console.log('📊 Service Status:')
  console.log(`   Clerk Auth: ${services.clerk ? '✅' : '❌'}`)
  console.log(`   Supabase: ${services.supabase ? '✅' : '❌'}`)
  console.log(`   Database: ${services.database ? '✅' : '❌'}`)
  console.log(`   AI (LiteLLM): ${services.ai ? '✅' : '❌'}`)
  console.log(`   Rate Limiting: ${services.rateLimiting ? '✅ (optional)' : '⚠️  Not configured (optional)'}`)
  console.log('')
  
  if (!services.allRequired) {
    console.error('❌ Some required services are not configured properly.')
    process.exit(1)
  }
  
  console.log('🚀 All required services are configured. Ready to start!\n')
} catch (error) {
  process.exit(1)
}
import { z } from 'zod'

// Define the environment variable schema
const envSchema = z.object({
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().optional(), // Optional for MVP
  
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // Database URLs
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(), // Optional for connection pooling
  
  // AI Integration (LiteLLM)
  LITELLM_PROXY_URL: z.string().url('LITELLM_PROXY_URL must be a valid URL'),
  LITELLM_API_KEY: z.string().min(1, 'LITELLM_API_KEY is required'),
  LITELLM_MODEL: z.string().default('o4-mini'),
  
  // Upstash Redis (for rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

// Type for validated environment variables
export type ValidatedEnv = z.infer<typeof envSchema>

// Validate environment variables
export function validateEnv(): ValidatedEnv {
  try {
    const env = envSchema.parse(process.env)
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n')
      
      console.error('❌ Environment validation failed:\n')
      console.error(missingVars)
      console.error('\n📋 Please check your .env.local file and ensure all required variables are set.')
      console.error('   You can use .env.example as a reference.\n')
      
      // In development, provide more helpful error messages
      if (process.env.NODE_ENV === 'development') {
        console.error('💡 Quick fix suggestions:')
        console.error('   1. Copy .env.example to .env.local')
        console.error('   2. Fill in the required values')
        console.error('   3. Restart your development server\n')
      }
      
      throw new Error('Environment validation failed')
    }
    throw error
  }
}

// Cached validated environment
let cachedEnv: ValidatedEnv | null = null

// Get validated environment variables
export function getEnv(): ValidatedEnv {
  if (!cachedEnv) {
    cachedEnv = validateEnv()
  }
  return cachedEnv
}

// Helper to check if all required services are configured
export function checkServiceConnections() {
  const env = getEnv()
  const checks = {
    clerk: !!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!env.CLERK_SECRET_KEY,
    supabase: !!env.NEXT_PUBLIC_SUPABASE_URL && !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    database: !!env.DATABASE_URL,
    ai: !!env.LITELLM_PROXY_URL && !!env.LITELLM_API_KEY,
    rateLimiting: !!env.UPSTASH_REDIS_REST_URL && !!env.UPSTASH_REDIS_REST_TOKEN
  }
  
  return {
    ...checks,
    allRequired: checks.clerk && checks.supabase && checks.database && checks.ai,
    allConfigured: Object.values(checks).every(Boolean)
  }
}
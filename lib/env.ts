import { z } from 'zod'

const envSchema = z.object({
  // Clerk - Required
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "Clerk publishable key is required"),
  CLERK_SECRET_KEY: z.string().min(1, "Clerk secret key is required"),
  CLERK_WEBHOOK_SECRET: z.string().min(1, "Clerk webhook secret is required"),
  
  // Supabase - Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),
  
  // Database - Required
  DATABASE_URL: z.string().url("Invalid database URL"),
  DIRECT_URL: z.string().url("Invalid direct database URL"),
  
  // AI Service - Optional
  LITELLM_PROXY_URL: z.string().url().optional(),
  LITELLM_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  
  // Email Service - Optional
  RESEND_API_KEY: z.string().optional(),
  
  // Analytics - Optional
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Optional Features
  NEXT_PUBLIC_ENABLE_AI_CHAT: z.string().transform(val => val === 'true').optional().default('false'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').optional().default('false'),
})

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      error.errors.forEach((err) => {
        console.error(`   ${err.path.join('.')}: ${err.message}`)
      })
      throw new Error('Invalid environment variables')
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Type-safe environment variable access
export type Env = z.infer<typeof envSchema>
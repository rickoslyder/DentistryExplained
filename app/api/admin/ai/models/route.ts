import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    // Check if user is admin
    const supabase = await createServerSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    // Fetch models from LiteLLM proxy
    const response = await fetch(`${process.env.LITELLM_PROXY_URL}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Transform the response to include additional metadata
    const models = data.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      provider: model.id.split('/')[0] || 'unknown',
      created: model.created,
      // Add friendly display names
      displayName: getModelDisplayName(model.id),
      // Add model capabilities based on known models
      capabilities: getModelCapabilities(model.id),
    }))
    
    return NextResponse.json({
      models,
      total: models.length,
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch models' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function getModelDisplayName(modelId: string): string {
  const displayNames: Record<string, string> = {
    'o4-mini': 'O4 Mini (Reasoning)',
    'gpt-4o': 'GPT-4 Omni',
    'gpt-4o-mini': 'GPT-4 Omni Mini',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gemini-pro': 'Gemini Pro',
    'gemini-pro-vision': 'Gemini Pro Vision',
  }
  
  return displayNames[modelId] || modelId
}

function getModelCapabilities(modelId: string): {
  contextWindow: number
  supportsVision: boolean
  supportsFunctions: boolean
  maxOutputTokens: number
} {
  const capabilities: Record<string, any> = {
    'o4-mini': {
      contextWindow: 200000,
      supportsVision: true,
      supportsFunctions: true,
      maxOutputTokens: 100000,
    },
    'gpt-4o': {
      contextWindow: 128000,
      supportsVision: true,
      supportsFunctions: true,
      maxOutputTokens: 16384,
    },
    'gpt-4o-mini': {
      contextWindow: 128000,
      supportsVision: true,
      supportsFunctions: true,
      maxOutputTokens: 16384,
    },
    'gpt-4-turbo': {
      contextWindow: 128000,
      supportsVision: true,
      supportsFunctions: true,
      maxOutputTokens: 4096,
    },
    'gpt-4': {
      contextWindow: 8192,
      supportsVision: false,
      supportsFunctions: true,
      maxOutputTokens: 4096,
    },
    'gpt-3.5-turbo': {
      contextWindow: 16385,
      supportsVision: false,
      supportsFunctions: true,
      maxOutputTokens: 4096,
    },
    'claude-3-opus': {
      contextWindow: 200000,
      supportsVision: true,
      supportsFunctions: false,
      maxOutputTokens: 4096,
    },
    'claude-3-sonnet': {
      contextWindow: 200000,
      supportsVision: true,
      supportsFunctions: false,
      maxOutputTokens: 4096,
    },
    'claude-3-haiku': {
      contextWindow: 200000,
      supportsVision: true,
      supportsFunctions: false,
      maxOutputTokens: 4096,
    },
    'gemini-pro': {
      contextWindow: 32760,
      supportsVision: false,
      supportsFunctions: true,
      maxOutputTokens: 8192,
    },
    'gemini-pro-vision': {
      contextWindow: 32760,
      supportsVision: true,
      supportsFunctions: false,
      maxOutputTokens: 8192,
    },
  }
  
  return capabilities[modelId] || {
    contextWindow: 4096,
    supportsVision: false,
    supportsFunctions: false,
    maxOutputTokens: 2048,
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}

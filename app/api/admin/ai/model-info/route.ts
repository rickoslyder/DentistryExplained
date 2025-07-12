import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
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
    
    const searchParams = request.nextUrl.searchParams
    const modelId = searchParams.get('model')
    
    if (!modelId) {
      return new NextResponse('Model ID is required', { status: 400 })
    }
    
    // Try to fetch model info from LiteLLM proxy
    let modelInfo = null
    try {
      const response = await fetch(`${process.env.LITELLM_PROXY_URL}/model/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        // Find the specific model in the response
        if (data.data && Array.isArray(data.data)) {
          const modelData = data.data.find((m: any) => 
            m.model_name === modelId || 
            m.litellm_params?.model === modelId ||
            m.model_info?.id === modelId
          )
          if (modelData) {
            modelInfo = modelData
          }
        }
      }
    } catch (error) {
      console.log('Could not fetch model info from LiteLLM:', error)
    }
    
    // If we couldn't get model info, provide basic defaults
    if (!modelInfo) {
      modelInfo = {
        model_name: modelId,
        litellm_params: {
          model: modelId,
        },
        model_info: {
          id: modelId,
          mode: 'chat',
          supports_function_calling: modelId.includes('gpt') || modelId.includes('claude'),
          supports_parallel_function_calling: modelId.includes('gpt-4'),
          supports_vision: modelId.includes('vision') || modelId.includes('gpt-4o'),
        }
      }
    }
    
    // Try to check supported OpenAI params
    let supportedParams = {}
    try {
      const paramsResponse = await fetch(`${process.env.LITELLM_PROXY_URL}/utils/supported_openai_params`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: modelId }),
      })
      
      if (paramsResponse.ok) {
        supportedParams = await paramsResponse.json()
      }
    } catch (error) {
      console.log('Could not fetch supported params:', error)
      // Provide reasonable defaults
      supportedParams = {
        temperature: true,
        top_p: true,
        max_tokens: true,
        stream: true,
        frequency_penalty: modelId.includes('gpt'),
        presence_penalty: modelId.includes('gpt'),
        n: true,
        stop: true,
      }
    }
    
    return NextResponse.json({
      modelInfo,
      supportedParams,
      // Add usage recommendations
      recommendations: getModelRecommendations(modelId),
      // Add model capabilities based on ID
      capabilities: {
        streaming: true,
        functionCalling: modelId.includes('gpt') || modelId.includes('claude'),
        vision: modelId.includes('vision') || modelId.includes('gpt-4o'),
        reasoning: modelId.includes('o1') || modelId.includes('o4'),
        contextWindow: getContextWindow(modelId),
      }
    })
  } catch (error) {
    console.error('Error fetching model info:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch model info' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function getModelRecommendations(modelId: string): {
  temperature: number
  topP: number
  maxTokens: number
  systemPrompt: string
} {
  const basePrompt = `You are a helpful dental assistant providing evidence-based information about oral health. You are part of Dentistry Explained, the UK's premier dental education platform.

Key guidelines:
- Provide accurate, evidence-based information
- Use clear, accessible language appropriate for patients
- Always recommend consulting a dental professional for specific concerns
- Be empathetic and supportive
- Cite sources when providing medical information
- Avoid diagnosing conditions - focus on education`

  const recommendations: Record<string, any> = {
    'o4-mini': {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 4000,
      systemPrompt: basePrompt + '\n\nUse your reasoning capabilities to provide thorough, well-structured responses.',
    },
    'gpt-4o': {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2000,
      systemPrompt: basePrompt,
    },
    'gpt-4o-mini': {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2000,
      systemPrompt: basePrompt,
    },
    'gpt-4-turbo': {
      temperature: 0.6,
      topP: 0.9,
      maxTokens: 2000,
      systemPrompt: basePrompt,
    },
    'gpt-3.5-turbo': {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1500,
      systemPrompt: basePrompt + '\n\nBe concise but informative in your responses.',
    },
    'claude-3-opus': {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2000,
      systemPrompt: basePrompt + '\n\nProvide detailed, nuanced responses when appropriate.',
    },
    'claude-3-sonnet': {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2000,
      systemPrompt: basePrompt,
    },
    'claude-3-haiku': {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1500,
      systemPrompt: basePrompt + '\n\nBe concise and direct in your responses.',
    },
  }
  
  return recommendations[modelId] || {
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 1500,
    systemPrompt: basePrompt,
  }
}

function getContextWindow(modelId: string): number {
  const contextWindows: Record<string, number> = {
    'o4-mini': 100000,
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
    'gpt-4-turbo': 128000,
    'gpt-4': 8192,
    'gpt-3.5-turbo': 16385,
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'gemini-pro': 32768,
  }
  
  return contextWindows[modelId] || 4096
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

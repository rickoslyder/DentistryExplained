import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function POST(request: NextRequest) {
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
    
    const body = await request.json()
    const { model, temperature, maxTokens, systemPrompt, testMessage } = body
    
    if (!model || !testMessage) {
      return new NextResponse('Model and test message are required', { status: 400 })
    }
    
    // Test the model with a simple chat completion
    const startTime = Date.now()
    
    const response = await fetch(`${process.env.LITELLM_PROXY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt || 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: testMessage,
          },
        ],
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 500,
        stream: false,
      }),
    })
    
    const responseTime = Date.now() - startTime
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('LiteLLM test error:', errorText)
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: `Model test failed: ${response.statusText}`,
          details: errorText,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      response: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      responseTime,
      // Include token costs if available
      costs: calculateTokenCosts(model, data.usage),
    })
  } catch (error) {
    console.error('Error testing model:', error)
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to test model',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function calculateTokenCosts(model: string, usage: any): {
  inputCost: number
  outputCost: number
  totalCost: number
  currency: string
} {
  // Token costs per 1M tokens (approximate)
  const costs: Record<string, { input: number; output: number }> = {
    'o4-mini': { input: 3, output: 12 },
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4-turbo': { input: 10, output: 30 },
    'gpt-4': { input: 30, output: 60 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'claude-3-opus': { input: 15, output: 75 },
    'claude-3-sonnet': { input: 3, output: 15 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
    'gemini-pro': { input: 0.5, output: 1.5 },
  }
  
  const modelCosts = costs[model] || { input: 1, output: 2 }
  
  const inputCost = (usage.prompt_tokens / 1000000) * modelCosts.input
  const outputCost = (usage.completion_tokens / 1000000) * modelCosts.output
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'USD',
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}

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
    const { text, model } = body
    
    if (!text) {
      return new NextResponse('Text is required', { status: 400 })
    }
    
    // Create a proper request format for LiteLLM
    const requestBody = {
      messages: [{ role: 'user', content: text }],
      model: model || 'gpt-3.5-turbo'
    }
    
    // Try LiteLLM's token counter utility
    let tokenCount = 0
    let counted = false
    
    try {
      const response = await fetch(`${process.env.LITELLM_PROXY_URL}/utils/token_counter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      if (response.ok) {
        const data = await response.json()
        tokenCount = data.input_tokens || data.token_count || data.count || 0
        counted = true
      }
    } catch (error) {
      console.log('Could not count tokens with LiteLLM:', error)
    }
    
    // Fallback: Use rough estimation if LiteLLM fails
    if (!counted) {
      // Rough estimation: ~4 characters per token for English text
      tokenCount = Math.ceil(text.length / 4)
    }
    
    // Calculate approximate costs
    const costs = calculateTokenCosts(model || 'gpt-3.5-turbo', { 
      prompt_tokens: tokenCount,
      completion_tokens: 0,
    })
    
    return NextResponse.json({
      tokenCount,
      model: model || 'gpt-3.5-turbo',
      approximateCost: costs.inputCost,
      // Add character count for reference
      characterCount: text.length,
      // Rough estimate of tokens to characters ratio
      ratio: text.length > 0 ? tokenCount / text.length : 0,
      // Indicate if this was an estimation
      estimated: !counted,
    })
  } catch (error) {
    console.error('Error counting tokens:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to count tokens' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function calculateTokenCosts(model: string, usage: any): {
  inputCost: number
} {
  // Token costs per 1M tokens (approximate)
  const costs: Record<string, number> = {
    'o4-mini': 3,
    'gpt-4o': 2.5,
    'gpt-4o-mini': 0.15,
    'gpt-4-turbo': 10,
    'gpt-4': 30,
    'gpt-3.5-turbo': 0.5,
    'claude-3-opus': 15,
    'claude-3-sonnet': 3,
    'claude-3-haiku': 0.25,
    'gemini-pro': 0.5,
  }
  
  const modelCost = costs[model] || 1
  const inputCost = (usage.prompt_tokens / 1000000) * modelCost
  
  return { inputCost }
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

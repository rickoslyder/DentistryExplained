import { ChatMessage } from "@/types/database"
import { liteLLMConfig, isLiteLLMConfigured, getModelConfig } from "@/lib/config/litellm"
import { dentalKnowledgeBase, detectEmergency, categorizeQuery } from "@/lib/ai/dental-knowledge"

interface LiteLLMResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    delta?: {
      content?: string
    }
  }>
}

interface StreamResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      content?: string
    }
    finish_reason: string | null
  }>
}

interface DentalContext {
  title?: string
  category?: string
  content?: string
  url?: string
}

export async function generateAIResponse(
  message: string,
  chatHistory: ChatMessage[] = [],
  pageContext?: DentalContext,
  stream: boolean = false
): Promise<string | ReadableStream> {
  // Check if LiteLLM is configured
  if (!isLiteLLMConfigured()) {
    return generateFallbackResponse(message, pageContext)
  }

  try {
    // Detect if this is an emergency
    const isEmergency = detectEmergency(message)
    const queryCategory = categorizeQuery(message)
    
    // Build conversation history
    const messages = [
      { role: "system", content: dentalKnowledgeBase.systemPrompt },
    ]

    // Add contextual prompts based on query type
    if (isEmergency) {
      messages.push({
        role: "system",
        content: dentalKnowledgeBase.contextualPrompts.emergency
      })
    } else if (queryCategory && dentalKnowledgeBase.contextualPrompts[queryCategory]) {
      messages.push({
        role: "system",
        content: dentalKnowledgeBase.contextualPrompts[queryCategory]
      })
    }

    // Add page context if available
    if (pageContext?.title) {
      messages.push({
        role: "system",
        content: `The user is currently reading: "${pageContext.title}" in the "${pageContext.category}" category. URL: ${pageContext.url}. Consider this context when answering.`
      })
    }

    // Add chat history (limit to last 10 messages for context window)
    const recentHistory = chatHistory.slice(-10)
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })
    })

    // Add current message
    messages.push({ role: "user", content: message })

    // Get model configuration
    const modelConfig = getModelConfig()
    
    // Make API request
    const response = await fetchWithRetry(
      `${liteLLMConfig.proxyUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${liteLLMConfig.apiKey}`,
        },
        body: JSON.stringify({
          ...modelConfig,
          messages,
          stream,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`LiteLLM API error: ${response.status} ${response.statusText}`)
    }

    // Handle streaming response
    if (stream && response.body) {
      return createStreamFromResponse(response.body)
    }

    // Handle regular response
    const data: LiteLLMResponse = await response.json()
    return data.choices[0]?.message?.content || generateFallbackResponse(message, pageContext)
  } catch (error) {
    console.error('LiteLLM API error:', error)
    
    // Log to monitoring service if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `LiteLLM API Error: ${error.message}`,
        fatal: false,
      })
    }
    
    return generateFallbackResponse(message, pageContext)
  }
}

// Helper function for retrying failed requests
async function fetchWithRetry(url: string, options: RequestInit, retries = liteLLMConfig.maxRetries): Promise<Response> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), liteLLMConfig.requestTimeout)
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, liteLLMConfig.retryDelay))
      return fetchWithRetry(url, options, retries - 1)
    }
    
    return response
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, liteLLMConfig.retryDelay))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

// Create a ReadableStream from SSE response
function createStreamFromResponse(body: ReadableStream): ReadableStream {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  
  return new ReadableStream({
    async start(controller) {
      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          controller.close()
          break
        }
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              controller.close()
              return
            }
            
            try {
              const parsed: StreamResponse = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              
              if (content) {
                controller.enqueue(new TextEncoder().encode(content))
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    },
  })
}

function generateFallbackResponse(message: string, pageContext?: DentalContext): string {
  const lowerMessage = message.toLowerCase()
  
  // Check for emergency first
  if (detectEmergency(message)) {
    return dentalKnowledgeBase.emergencyGuidance.urgentResponse
  }
  
  // Check common topics
  const queryCategory = categorizeQuery(message)
  if (queryCategory && dentalKnowledgeBase.commonTopics[queryCategory]) {
    return dentalKnowledgeBase.commonTopics[queryCategory].response
  }
  
  // Check for specific patterns
  if (lowerMessage.includes('child') || lowerMessage.includes('kid') || lowerMessage.includes('baby')) {
    const ageGroup = Object.entries(dentalKnowledgeBase.ageSpecificGuidance)
      .find(([age]) => lowerMessage.includes(age))
    
    if (ageGroup) {
      return `For ${ageGroup[0]}: ${ageGroup[1]} Always consult your dentist for personalized advice.`
    }
    
    return `Children's dental health is crucial. Start dental visits by age 1, brush twice daily with age-appropriate fluoride toothpaste, and limit sugary snacks. The 2025 supervised toothbrushing programme is available in many schools. Would you like specific advice for a particular age group?`
  }
  
  // Prevention questions
  if (lowerMessage.includes('prevent') || lowerMessage.includes('avoid')) {
    const tips = dentalKnowledgeBase.preventionTips.slice(0, 5).join('\n• ')
    return `Here are key prevention tips:\n• ${tips}\n\nRegular dental check-ups help catch problems early. Book your next appointment today!`
  }
  
  // Context-aware response
  if (pageContext?.title) {
    return `I see you're reading about "${pageContext.title}". While I can provide general information about ${pageContext.category?.toLowerCase() || 'dental health'}, for specific concerns related to this topic, it's best to consult with a dental professional who can evaluate your individual situation. Is there something specific about ${pageContext.title} you'd like to understand better?`
  }
  
  // Generic response with helpful prompts
  return `I'm here to help with your dental health questions! I can provide information about:
• Common dental problems (cavities, gum disease)
• Treatment options and what to expect
• Prevention and oral hygiene tips
• NHS dental charges (2025 rates)
• Children's dental health
• Dental emergencies

What would you like to know more about?`
}
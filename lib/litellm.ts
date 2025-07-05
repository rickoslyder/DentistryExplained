import { ChatMessage } from "@/types/database"
import { liteLLMConfig, isLiteLLMConfigured, getModelConfig } from "@/lib/config/litellm"
import { dentalKnowledgeBase, detectEmergency, categorizeQuery, generateSystemPrompt } from "@/lib/ai/dental-knowledge"
import { webSearch, searchDentalResearch, searchNHSInfo, searchDentalNews, type SearchResult } from "@/lib/web-search"

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

export interface UserContext {
  user_type: 'patient' | 'professional'
  preferences?: {
    responseStyle: 'concise' | 'detailed'
    complexityLevel: 'basic' | 'advanced'
    includeCosts: boolean
    autoSuggestFollowUp: boolean
  }
  glossaryContext?: {
    term: string
    definition: string
    pronunciation?: string | null
    alsoKnownAs?: string[] | null
    relatedTerms?: string[] | null
    category?: string | null
    difficulty?: string | null
    example?: string | null
  }
  webSearchEnabled?: boolean
  webSearchType?: 'smart' | 'news' | 'research' | 'nhs'
}

// Helper function to determine if a query needs web search
function shouldPerformWebSearch(message: string, webSearchEnabled?: boolean): boolean {
  if (!webSearchEnabled) return false
  
  const lowerMessage = message.toLowerCase()
  const webSearchTriggers = [
    'price', 'cost', 'how much',
    'latest', 'recent', 'news', 'update',
    'near me', 'nearby', 'local',
    'nhs', 'band', 'charges',
    'research', 'study', 'evidence',
    'current', '2025', '2024',
    'compare', 'versus', 'vs',
    'dentist in', 'dental practice'
  ]
  
  return webSearchTriggers.some(trigger => lowerMessage.includes(trigger))
}

// Helper function to perform contextual web search
async function performContextualWebSearch(
  query: string, 
  searchType: 'smart' | 'news' | 'research' | 'nhs' = 'smart',
  sessionInfo?: { userId?: string; sessionId?: string }
): Promise<{ results: SearchResult[], isCached?: boolean }> {
  try {
    const searchOptions = { 
      maxResults: 5,
      userId: sessionInfo?.userId,
      sessionId: sessionInfo?.sessionId
    }
    
    let response
    switch (searchType) {
      case 'news':
        response = await searchDentalNews(query)
        break
      case 'research':
        response = await searchDentalResearch(query)
        break
      case 'nhs':
        response = await searchNHSInfo(query)
        break
      case 'smart':
      default:
        // Let the web search service determine the best approach
        response = await webSearch(query, searchOptions)
        break
    }
    
    return {
      results: response.results,
      isCached: response.isCached
    }
  } catch (error) {
    console.error('Web search failed:', error)
    return { results: [] }
  }
}

export interface AIResponseWithSearch {
  content: string
  searchResults?: {
    results: SearchResult[]
    provider: 'perplexity' | 'exa'
    searchType: 'smart' | 'news' | 'research' | 'nhs'
    isCached: boolean
    searchTime?: number
    query: string
  }
}

export async function generateAIResponse(
  message: string,
  chatHistory: ChatMessage[] = [],
  pageContext?: DentalContext,
  stream: boolean = false,
  userContext?: UserContext,
  sessionInfo?: { userId?: string; sessionId?: string }
): Promise<string | ReadableStream | AIResponseWithSearch> {
  // Check if LiteLLM is configured
  if (!isLiteLLMConfigured()) {
    return generateFallbackResponse(message, pageContext)
  }

  try {
    // Detect if this is an emergency
    const isEmergency = detectEmergency(message)
    const queryCategory = categorizeQuery(message)
    
    // Build conversation history with dynamic system prompt
    const systemPrompt = generateSystemPrompt(userContext)
    const messages = [
      { role: "system", content: systemPrompt },
    ]

    // Add contextual prompts based on query type (only for first message or emergencies)
    const isFirstMessage = chatHistory.length === 0
    
    if (isEmergency) {
      messages.push({
        role: "system",
        content: dentalKnowledgeBase.contextualPrompts.emergency
      })
    } else if (isFirstMessage && queryCategory && dentalKnowledgeBase.contextualPrompts[queryCategory]) {
      messages.push({
        role: "system",
        content: dentalKnowledgeBase.contextualPrompts[queryCategory]
      })
    }
    
    // Add conversation context prompt if there's history
    if (chatHistory.length > 0) {
      messages.push({
        role: "system",
        content: "This is a continuing conversation. Focus on answering the user's current question while maintaining context from previous messages. Avoid repeating information already discussed."
      })
    }

    // Add page context if available
    if (pageContext?.title) {
      messages.push({
        role: "system",
        content: `The user is currently reading: "${pageContext.title}" in the "${pageContext.category}" category. URL: ${pageContext.url}. Consider this context when answering.`
      })
    }
    
    // Add glossary context if available
    if (userContext.glossaryContext) {
      const { term, definition, pronunciation, example, relatedTerms, category } = userContext.glossaryContext
      messages.push({
        role: "system",
        content: `The user is asking about the glossary term "${term}". 
Definition: ${definition}
${pronunciation ? `Pronunciation: ${pronunciation}` : ''}
${category ? `Category: ${category}` : ''}
${example ? `Example: ${example}` : ''}
${relatedTerms?.length ? `Related terms: ${relatedTerms.join(', ')}` : ''}

Provide additional context, examples, and explanations to help the user understand this term better. Suggest exploring related terms if relevant.`
      })
    }
    
    // Perform web search if enabled and needed
    let searchResults: SearchResult[] = []
    let searchError: string | null = null
    let searchMetadata: AIResponseWithSearch['searchResults'] | undefined
    
    if (shouldPerformWebSearch(message, userContext?.webSearchEnabled)) {
      const searchStartTime = Date.now()
      try {
        const searchResponse = await performContextualWebSearch(message, userContext?.webSearchType, sessionInfo)
        searchResults = searchResponse.results
        
        if (searchResults.length > 0) {
          // Store search metadata for response
          searchMetadata = {
            results: searchResults,
            provider: determineSearchProvider(message, userContext?.webSearchType),
            searchType: userContext?.webSearchType || 'smart',
            isCached: searchResponse.isCached || false,
            searchTime: Date.now() - searchStartTime,
            query: message
          }
          
          // Add search results to context
          const searchContext = searchResults.map((result, index) => 
            `[${index + 1}] ${result.title}\n${result.snippet}\nSource: ${result.url}`
          ).join('\n\n')
          
          messages.push({
            role: "system",
            content: `Web search results for the user's query:\n\n${searchContext}\n\nUse these search results to provide accurate, up-to-date information. Always cite sources when using information from these results.`
          })
        } else {
          // No results found
          searchError = 'No relevant web search results found'
        }
      } catch (error) {
        console.error('Web search error in AI response:', error)
        searchError = 'Web search temporarily unavailable'
        // Continue without search results rather than failing entirely
      }
    }
    
    // Add search error context if applicable
    if (searchError && userContext?.webSearchEnabled) {
      messages.push({
        role: "system",
        content: `Note: ${searchError}. Please provide the best answer based on your knowledge, and mention that current web information is temporarily unavailable.`
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
    const responseContent = data.choices[0]?.message?.content || generateFallbackResponse(message, pageContext)
    
    // Return response with search metadata for non-streaming
    if (searchMetadata) {
      return {
        content: responseContent,
        searchResults: searchMetadata
      }
    }
    
    return responseContent
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
import { z } from 'zod'

// Search result schemas
export const searchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  source: z.enum(['perplexity', 'exa']),
  relevanceScore: z.number().optional(),
  publishedDate: z.string().optional(),
  citations: z.array(z.string()).optional()
})

export type SearchResult = z.infer<typeof searchResultSchema>

export const webSearchResponseSchema = z.object({
  query: z.string(),
  results: z.array(searchResultSchema),
  totalResults: z.number(),
  searchType: z.enum(['general', 'medical', 'news', 'academic']),
  processingTime: z.number()
})

export type WebSearchResponse = z.infer<typeof webSearchResponseSchema>

// Search options
export interface SearchOptions {
  maxResults?: number
  searchType?: 'general' | 'medical' | 'news' | 'academic'
  dateRange?: {
    from?: Date
    to?: Date
  }
  domains?: string[]
  excludeDomains?: string[]
}

// Cache configuration
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const searchCache = new Map<string, { data: WebSearchResponse; timestamp: number }>()

// Determine which API to use based on query intent
function determineSearchProvider(query: string, searchType?: string): 'perplexity' | 'exa' {
  const lowerQuery = query.toLowerCase()
  
  // Use Perplexity for real-time information
  if (
    lowerQuery.includes('price') ||
    lowerQuery.includes('cost') ||
    lowerQuery.includes('nhs') ||
    lowerQuery.includes('news') ||
    lowerQuery.includes('latest') ||
    lowerQuery.includes('current') ||
    lowerQuery.includes('dentist near') ||
    searchType === 'news'
  ) {
    return 'perplexity'
  }
  
  // Use Exa for semantic/research queries
  if (
    lowerQuery.includes('research') ||
    lowerQuery.includes('study') ||
    lowerQuery.includes('similar') ||
    lowerQuery.includes('related') ||
    lowerQuery.includes('compare') ||
    searchType === 'academic' ||
    searchType === 'medical'
  ) {
    return 'exa'
  }
  
  // Default to Perplexity for general queries
  return 'perplexity'
}

// Search with Perplexity API
async function searchWithPerplexity(
  query: string, 
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    throw new Error('Perplexity API key not configured')
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'pplx-api',
        messages: [
          {
            role: 'system',
            content: 'You are a dental health information assistant focused on UK dentistry. Return search results with citations.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        return_citations: true
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Parse Perplexity response and extract results
    // Note: Actual implementation depends on Perplexity's response format
    const results: SearchResult[] = []
    
    // Extract citations and format as search results
    if (data.citations) {
      data.citations.forEach((citation: any, index: number) => {
        results.push({
          title: citation.title || `Result ${index + 1}`,
          url: citation.url || '',
          snippet: citation.snippet || citation.text || '',
          source: 'perplexity',
          relevanceScore: citation.score,
          publishedDate: citation.published_date
        })
      })
    }

    return results.slice(0, options.maxResults || 10)
  } catch (error) {
    console.error('Perplexity search error:', error)
    throw error
  }
}

// Search with Exa API
async function searchWithExa(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) {
    throw new Error('Exa API key not configured')
  }

  try {
    const searchParams: any = {
      query,
      num_results: options.maxResults || 10,
      use_autoprompt: true,
      type: 'neural' // Use neural search for semantic understanding
    }

    // Add filters
    if (options.domains && options.domains.length > 0) {
      searchParams.include_domains = options.domains
    }
    if (options.excludeDomains && options.excludeDomains.length > 0) {
      searchParams.exclude_domains = options.excludeDomains
    }
    if (options.dateRange?.from) {
      searchParams.start_published_date = options.dateRange.from.toISOString().split('T')[0]
    }
    if (options.dateRange?.to) {
      searchParams.end_published_date = options.dateRange.to.toISOString().split('T')[0]
    }

    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchParams)
    })

    if (!response.ok) {
      throw new Error(`Exa API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Format Exa results
    const results: SearchResult[] = data.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.text || result.highlight || '',
      source: 'exa',
      relevanceScore: result.score,
      publishedDate: result.published_date
    }))

    return results
  } catch (error) {
    console.error('Exa search error:', error)
    throw error
  }
}

// Main search function with caching and routing
export async function webSearch(
  query: string,
  options: SearchOptions = {}
): Promise<WebSearchResponse> {
  // Generate cache key
  const cacheKey = JSON.stringify({ query, options })
  
  // Check cache
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const startTime = Date.now()
  
  try {
    // Determine which provider to use
    const provider = determineSearchProvider(query, options.searchType)
    
    // Perform search
    let results: SearchResult[]
    if (provider === 'perplexity') {
      results = await searchWithPerplexity(query, options)
    } else {
      results = await searchWithExa(query, options)
    }

    // Build response
    const response: WebSearchResponse = {
      query,
      results,
      totalResults: results.length,
      searchType: options.searchType || 'general',
      processingTime: Date.now() - startTime
    }

    // Cache the results
    searchCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    })

    return response
  } catch (error) {
    console.error('Web search error:', error)
    throw error
  }
}

// Specialized search functions
export async function searchDentalResearch(query: string): Promise<WebSearchResponse> {
  return webSearch(query, {
    searchType: 'academic',
    domains: ['pubmed.ncbi.nlm.nih.gov', 'cochrane.org', 'nature.com', 'bmj.com'],
    maxResults: 20
  })
}

export async function searchNHSInfo(query: string): Promise<WebSearchResponse> {
  return webSearch(query + ' NHS UK dental', {
    searchType: 'general',
    domains: ['nhs.uk', 'gov.uk'],
    maxResults: 10
  })
}

export async function searchDentalNews(query: string): Promise<WebSearchResponse> {
  return webSearch(query + ' dental news UK', {
    searchType: 'news',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    },
    maxResults: 15
  })
}

// Clear expired cache entries
export function clearExpiredCache() {
  const now = Date.now()
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      searchCache.delete(key)
    }
  }
}

// Clear all cache
export function clearSearchCache() {
  searchCache.clear()
}
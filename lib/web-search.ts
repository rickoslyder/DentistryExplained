import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { getCachedSearch, setCachedSearch, cleanExpiredCache as cleanDbCache } from './web-search-cache'
import { ResearchService } from './research'

// Search result schemas
export const searchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  source: z.enum(['perplexity', 'exa', 'gpt-researcher']),
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
  processingTime: z.number(),
  isCached: z.boolean().optional()
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
  userId?: string
  sessionId?: string
  forceDeepResearch?: boolean
}

// Cache configuration
const CACHE_TTL_HOURS = 24 // 24 hours

// Set up automatic database cache cleanup every hour
if (typeof global !== 'undefined' && !global.webSearchCacheCleanupInterval) {
  global.webSearchCacheCleanupInterval = setInterval(async () => {
    const deletedCount = await cleanDbCache()
    if (deletedCount > 0) {
      console.log(`Cleaned ${deletedCount} expired cache entries`)
    }
  }, 60 * 60 * 1000) // Run every hour
}

// Determine which API to use based on query intent
function determineSearchProvider(query: string, searchType?: string, forceDeepResearch?: boolean): 'perplexity' | 'exa' | 'gpt-researcher' {
  const lowerQuery = query.toLowerCase()
  
  // Use GPT-Researcher for deep research requests
  if (forceDeepResearch || lowerQuery.includes('deep research') || lowerQuery.includes('comprehensive report')) {
    return 'gpt-researcher'
  }
  
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
    console.warn('Perplexity API key not configured')
    return []
  }

  try {
    // Determine the appropriate model based on search type
    let model = 'sonar-small-online'
    if (options.searchType === 'academic' || options.searchType === 'medical') {
      model = 'sonar-pro'
    } else if (options.searchType === 'news') {
      model = 'sonar-medium-online'
    }

    const requestBody: any = {
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a dental health information assistant focused on UK dentistry. Provide accurate, evidence-based information.'
        },
        {
          role: 'user',
          content: `Search for: ${query}`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      return_search_results: true  // New field to get search results
    }

    // Add search filters if specified
    if (options.domains && options.domains.length > 0) {
      requestBody.search_domain_filter = options.domains
    }
    
    // Add recency filter for news
    if (options.searchType === 'news') {
      requestBody.search_recency_filter = 'week'
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const results: SearchResult[] = []
    
    // Extract search results from the new search_results field
    if (data.search_results && Array.isArray(data.search_results)) {
      data.search_results.forEach((result: any, index: number) => {
        results.push({
          title: result.title || `Result ${index + 1}`,
          url: result.url || '',
          snippet: result.snippet || result.text || '',
          source: 'perplexity',
          relevanceScore: result.score || (1 - index * 0.1), // Approximate score based on order
          publishedDate: result.date || result.publishedDate
        })
      })
    } else if (data.citations && Array.isArray(data.citations)) {
      // Fallback to legacy citations field
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

    // If no structured results, try to extract URLs from the response content
    if (results.length === 0 && data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content
      const urlRegex = /https?:\/\/[^\s\)]+/g
      const urls = content.match(urlRegex) || []
      
      urls.forEach((url: string, index: number) => {
        results.push({
          title: `Reference ${index + 1}`,
          url: url.replace(/[.,;]$/, ''), // Clean trailing punctuation
          snippet: 'Content from Perplexity search',
          source: 'perplexity',
          relevanceScore: 1 - index * 0.1
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
    console.warn('Exa API key not configured')
    return []
  }

  try {
    const searchParams: any = {
      query,
      num_results: options.maxResults || 10,
      use_autoprompt: true,
      type: 'neural', // Use neural search for semantic understanding
      contents: {
        text: true,
        highlights: true,
        highlight_scores: true
      }
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

    // For academic/medical searches, use specific domains
    if (options.searchType === 'academic' || options.searchType === 'medical') {
      searchParams.include_domains = [
        'pubmed.ncbi.nlm.nih.gov',
        'cochrane.org',
        'bmj.com',
        'thelancet.com',
        'nature.com',
        'sciencedirect.com',
        'nejm.org',
        ...(options.domains || [])
      ]
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
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Exa API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    
    // Validate response structure
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid Exa API response structure')
    }
    
    // Format Exa results
    const results: SearchResult[] = data.results.map((result: any) => {
      // Extract the best highlight or use text summary
      let snippet = ''
      if (result.highlights && result.highlights.length > 0) {
        // Use the highlight with the highest score
        const bestHighlight = result.highlights.reduce((best: any, current: any, index: number) => {
          const currentScore = result.highlight_scores?.[index] || 0
          const bestScore = result.highlight_scores?.[result.highlights.indexOf(best)] || 0
          return currentScore > bestScore ? current : best
        }, result.highlights[0])
        snippet = bestHighlight
      } else if (result.text) {
        // Truncate text to reasonable snippet length
        snippet = result.text.substring(0, 300) + (result.text.length > 300 ? '...' : '')
      }

      return {
        title: result.title || 'Untitled',
        url: result.url || '',
        snippet,
        source: 'exa',
        relevanceScore: result.score || 0,
        publishedDate: result.published_date || result.publishedDate
      }
    })

    return results
  } catch (error) {
    console.error('Exa search error:', error)
    throw error
  }
}

// Search with GPT-Researcher
async function searchWithGPTResearcher(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    const researchService = new ResearchService()
    
    // Check if service is available
    const serviceHealthy = await researchService.checkHealth()
    if (!serviceHealthy) {
      console.warn('GPT-Researcher service not available, falling back to Exa')
      return searchWithExa(query, options)
    }

    // Conduct research
    const research = await researchService.conductResearch({
      topic: query,
      reportType: 'research_report',
      sourcesCount: options.maxResults || 10,
      focusMedical: options.searchType === 'medical' || options.searchType === 'academic',
      includeCitations: true
    })

    // Convert research sources to search results
    const results: SearchResult[] = research.sources.map((source, index) => ({
      title: source.title,
      url: source.url,
      snippet: source.snippet,
      source: 'gpt-researcher' as const,
      relevanceScore: 1 - (index * 0.05), // Higher scores for earlier results
      citations: [source.url]
    }))

    return results
  } catch (error) {
    console.error('GPT-Researcher search error:', error)
    // Fallback to Exa on error
    return searchWithExa(query, options)
  }
}

// Main search function with database caching and routing
export async function webSearch(
  query: string,
  options: SearchOptions = {}
): Promise<WebSearchResponse> {
  // Generate cache key (exclude user/session info from cache key)
  const { userId, sessionId, ...cacheOptions } = options
  const cacheKey = JSON.stringify({ query, options: cacheOptions })
  
  // Check database cache
  const cached = await getCachedSearch(cacheKey)
  
  if (cached) {
    // Track cached search if user/session provided
    if (userId || sessionId) {
      trackWebSearch({
        query,
        searchType: options.searchType || 'general',
        provider: determineSearchProvider(query, options.searchType, options.forceDeepResearch),
        resultsCount: cached.results.length,
        cached: true,
        userId,
        sessionId
      }).catch(err => console.error('Failed to track cached search:', err))
    }
    // Mark as cached
    return {
      ...cached,
      isCached: true
    }
  }

  const startTime = Date.now()
  
  try {
    // Determine which provider to use
    const provider = determineSearchProvider(query, options.searchType, options.forceDeepResearch)
    
    // Perform search
    let results: SearchResult[]
    if (provider === 'perplexity') {
      results = await searchWithPerplexity(query, options)
    } else if (provider === 'exa') {
      results = await searchWithExa(query, options)
    } else {
      results = await searchWithGPTResearcher(query, options)
    }

    // Build response
    const response: WebSearchResponse = {
      query,
      results,
      totalResults: results.length,
      searchType: options.searchType || 'general',
      processingTime: Date.now() - startTime,
      isCached: false
    }

    // Cache the results in database
    await setCachedSearch(cacheKey, response, provider, CACHE_TTL_HOURS)

    // Track the search if user/session provided
    if (userId || sessionId) {
      trackWebSearch({
        query,
        searchType: options.searchType || 'general',
        provider,
        resultsCount: results.length,
        cached: false,
        userId,
        sessionId
      }).catch(err => console.error('Failed to track web search:', err))
    }

    return response
  } catch (error) {
    console.error('Web search error:', error)
    throw error
  }
}

// Helper function to track web searches
async function trackWebSearch(params: {
  query: string
  searchType: string
  provider: 'perplexity' | 'exa' | 'gpt-researcher'
  resultsCount: number
  cached: boolean
  userId?: string
  sessionId?: string
}) {
  try {
    const { error } = await supabaseAdmin
      .from('web_searches')
      .insert({
        user_id: params.userId,
        session_id: params.sessionId,
        query: params.query,
        search_type: params.searchType,
        provider: params.provider,
        results_count: params.resultsCount,
        cached: params.cached
      })
    
    if (error) {
      console.error('Error tracking web search:', error)
    }
  } catch (err) {
    console.error('Failed to track web search:', err)
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

// Deep research function using GPT-Researcher
export async function searchDeepResearch(query: string, userId?: string, sessionId?: string): Promise<WebSearchResponse> {
  return webSearch(query, {
    searchType: 'academic',
    forceDeepResearch: true,
    maxResults: 15,
    userId,
    sessionId
  })
}

// Export cache management functions from web-search-cache
export { clearAllCache as clearSearchCache, getCacheStats } from './web-search-cache'
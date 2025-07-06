import { SearchResult } from '@/lib/web-search'

export interface Citation {
  number: number
  source: SearchResult
  usedInResponse: boolean
}

export interface ProcessedResponse {
  content: string
  citations: Citation[]
}

/**
 * Processes AI response to add inline citations based on search results
 * Converts source references to numbered citations [1], [2], etc.
 */
export function processCitations(
  response: string,
  searchResults: SearchResult[]
): ProcessedResponse {
  if (!searchResults || searchResults.length === 0) {
    return { content: response, citations: [] }
  }

  let processedContent = response
  const citations: Citation[] = []
  const usedSources = new Set<number>()

  // First pass: Find all source references and replace with citations
  searchResults.forEach((result, index) => {
    const citationNumber = index + 1
    
    // Look for various patterns that indicate this source was used
    const patterns = [
      // Direct URL mentions
      new RegExp(escapeRegExp(result.url), 'gi'),
      // Domain mentions
      new RegExp(escapeRegExp(getDomainFromUrl(result.url)), 'gi'),
      // Title mentions (if distinctive enough)
      result.title.length > 20 ? new RegExp(escapeRegExp(result.title), 'gi') : null,
      // Common citation patterns
      new RegExp(`\\[${index + 1}\\]`, 'g'),
      new RegExp(`Source:\\s*${escapeRegExp(result.url)}`, 'gi'),
      new RegExp(`According to ${escapeRegExp(getDomainFromUrl(result.url))}`, 'gi'),
    ].filter(Boolean) as RegExp[]

    let sourceUsed = false
    
    patterns.forEach(pattern => {
      if (pattern.test(processedContent)) {
        sourceUsed = true
        // Replace the pattern with citation
        processedContent = processedContent.replace(pattern, (match) => {
          // Don't double-cite
          if (match.includes('[') && match.includes(']')) {
            return match
          }
          return `${match} [${citationNumber}]`
        })
      }
    })

    // Also check for semantic matches (e.g., if the content discusses the same topic)
    if (!sourceUsed && result.snippet) {
      const snippetWords = extractKeywords(result.snippet)
      const contentWords = extractKeywords(processedContent)
      const overlap = calculateOverlap(snippetWords, contentWords)
      
      if (overlap > 0.3) { // 30% keyword overlap threshold
        sourceUsed = true
        // Find the most relevant sentence to add citation
        const sentences = processedContent.split(/[.!?]+/)
        let bestSentenceIndex = -1
        let bestOverlap = 0
        
        sentences.forEach((sentence, idx) => {
          const sentenceWords = extractKeywords(sentence)
          const sentenceOverlap = calculateOverlap(snippetWords, sentenceWords)
          if (sentenceOverlap > bestOverlap) {
            bestOverlap = sentenceOverlap
            bestSentenceIndex = idx
          }
        })
        
        if (bestSentenceIndex !== -1 && bestOverlap > 0.2) {
          // Add citation to the end of the most relevant sentence
          const sentenceEnd = sentences.slice(0, bestSentenceIndex + 1).join('. ').length
          processedContent = 
            processedContent.slice(0, sentenceEnd) + 
            ` [${citationNumber}]` + 
            processedContent.slice(sentenceEnd)
        }
      }
    }

    if (sourceUsed) {
      usedSources.add(index)
    }

    citations.push({
      number: citationNumber,
      source: result,
      usedInResponse: sourceUsed
    })
  })

  // Second pass: Ensure all cited sources are included
  // Sometimes the AI mentions information without explicitly citing the source
  if (usedSources.size === 0 && searchResults.length > 0) {
    // If no citations were added but we have search results,
    // add a general citation at the end
    processedContent += '\n\nInformation sourced from web search results [1]'
    citations[0].usedInResponse = true
  }

  // Clean up any duplicate citations
  processedContent = processedContent.replace(/(\[\d+\])\s*\1+/g, '$1')

  return {
    content: processedContent,
    citations: citations.filter(c => c.usedInResponse)
  }
}

/**
 * Formats citations for display at the bottom of a message
 */
export function formatCitationList(citations: Citation[]): string {
  if (citations.length === 0) return ''

  return '\n\nSources:\n' + citations
    .map(c => `[${c.number}] ${c.source.title} - ${getDomainFromUrl(c.source.url)}`)
    .join('\n')
}

// Helper functions
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

function extractKeywords(text: string): Set<string> {
  // Simple keyword extraction - can be improved with NLP
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'some', 'any',
    'few', 'more', 'most', 'other', 'such', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'just', 'now'
  ])

  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
  )
}

function calculateOverlap(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0
  
  let overlap = 0
  set1.forEach(word => {
    if (set2.has(word)) overlap++
  })
  
  return overlap / Math.min(set1.size, set2.size)
}
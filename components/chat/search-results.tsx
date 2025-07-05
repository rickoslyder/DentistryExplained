'use client'

import { useState } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  FileText, 
  Newspaper, 
  Search,
  ExternalLink,
  Clock,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchResult } from '@/lib/web-search'

interface SearchResultsProps {
  results: SearchResult[]
  provider: 'perplexity' | 'exa'
  searchType: 'smart' | 'news' | 'research' | 'nhs'
  isCached: boolean
  searchTime?: number
  query: string
}

export function SearchResults({
  results,
  provider,
  searchType,
  isCached,
  searchTime,
  query
}: SearchResultsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())

  const toggleResult = (index: number) => {
    const newExpanded = new Set(expandedResults)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedResults(newExpanded)
  }

  const getSearchIcon = () => {
    switch (searchType) {
      case 'news':
        return <Newspaper className="h-4 w-4" />
      case 'research':
        return <FileText className="h-4 w-4" />
      case 'nhs':
        return <Globe className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getProviderColor = () => {
    return provider === 'perplexity' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
  }

  if (!results || results.length === 0) {
    return null
  }

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {getSearchIcon()}
          <div>
            <h3 className="font-medium text-sm">
              Web Search Results
              {isCached && (
                <Database className="inline-block ml-2 h-3 w-3 text-gray-500" title="Cached results" />
              )}
            </h3>
            <p className="text-xs text-gray-600">
              {results.length} results for "{query}"
              {searchTime && ` • ${searchTime}ms`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', getProviderColor())}>
            {provider}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {searchType}
          </Badge>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {/* Results */}
      {isExpanded && (
        <div className="divide-y">
          {results.slice(0, 5).map((result, index) => (
            <SearchResultCard
              key={index}
              result={result}
              index={index}
              isExpanded={expandedResults.has(index)}
              onToggle={() => toggleResult(index)}
            />
          ))}
          
          {results.length > 5 && (
            <div className="p-3 text-center text-sm text-gray-600">
              Showing 5 of {results.length} results
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

interface SearchResultCardProps {
  result: SearchResult
  index: number
  isExpanded: boolean
  onToggle: () => void
}

function SearchResultCard({ result, index, isExpanded, onToggle }: SearchResultCardProps) {
  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return 'unknown'
    }
  }

  const getFaviconUrl = (url: string) => {
    const domain = getDomainFromUrl(url)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
  }

  return (
    <div className="p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">
          <img 
            src={getFaviconUrl(result.url)} 
            alt="" 
            className="h-4 w-4"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 group"
              >
                {result.title}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{getDomainFromUrl(result.url)}</span>
                {result.publishedDate && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(result.publishedDate).toLocaleDateString()}
                    </span>
                  </>
                )}
                {result.relevanceScore && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {Math.round(result.relevanceScore * 100)}% relevant
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          
          {/* Snippet */}
          <p className={cn(
            "text-sm text-gray-700 mt-2",
            !isExpanded && "line-clamp-2"
          )}>
            {result.snippet}
          </p>
          
          {/* Citations if available */}
          {isExpanded && result.citations && result.citations.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Related sources:</p>
              <div className="flex flex-wrap gap-1">
                {result.citations.map((citation, i) => (
                  <a
                    key={i}
                    href={citation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    [{i + 1}]
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
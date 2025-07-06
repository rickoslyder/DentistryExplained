'use client'

import React from 'react'
import { CitationTooltip } from './citation-tooltip'
import { Citation } from '@/lib/citation-processor'
import { cn } from '@/lib/utils'

interface MessageWithCitationsProps {
  content: string
  citations: Citation[]
  className?: string
}

export function MessageWithCitations({ content, citations, className }: MessageWithCitationsProps) {
  // Create a map for quick citation lookup
  const citationMap = new Map(citations.map(c => [c.number, c]))
  
  // Split content by citation pattern [n]
  const parts = content.split(/(\[\d+\])/g)
  
  return (
    <div className={cn("whitespace-pre-wrap", className)}>
      {parts.map((part, index) => {
        // Check if this part is a citation
        const citationMatch = part.match(/\[(\d+)\]/)
        if (citationMatch) {
          const citationNumber = parseInt(citationMatch[1])
          const citation = citationMap.get(citationNumber)
          
          if (citation) {
            return (
              <CitationTooltip key={index} citation={citation}>
                <sup className="text-xs">[{citationNumber}]</sup>
              </CitationTooltip>
            )
          }
        }
        
        // Regular text - check for URLs to make them clickable
        if (part.includes('http')) {
          return <LinkifyText key={index} text={part} />
        }
        
        return <span key={index}>{part}</span>
      })}
      
      {/* Citation list at the bottom */}
      {citations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-600 mb-2">Sources:</h4>
          <div className="space-y-1">
            {citations.map(citation => (
              <div key={citation.number} className="flex items-start gap-2 text-xs">
                <span className="text-gray-500 font-medium">[{citation.number}]</span>
                <a
                  href={citation.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex-1"
                >
                  {citation.source.title}
                  <span className="text-gray-500 ml-1">
                    - {getDomainFromUrl(citation.source.url)}
                  </span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component to linkify URLs in text
function LinkifyText({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {part}
            </a>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}
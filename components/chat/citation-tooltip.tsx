'use client'

import { useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { ExternalLink } from 'lucide-react'
import { Citation } from '@/lib/citation-processor'
import { cn } from '@/lib/utils'

interface CitationTooltipProps {
  citation: Citation
  children: React.ReactNode
  className?: string
}

export function CitationTooltip({ citation, children, className }: CitationTooltipProps) {
  const [open, setOpen] = useState(false)

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return 'unknown'
    }
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <a
            href={citation.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-baseline text-blue-600 hover:text-blue-800 hover:underline font-medium",
              className
            )}
            onClick={(e) => {
              // Allow tooltip on hover, but open link on click
              e.stopPropagation()
            }}
          >
            {children}
          </a>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 w-80 rounded-lg border bg-white p-4 shadow-lg"
            sideOffset={5}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm line-clamp-2">
                  {citation.source.title}
                </h4>
                <ExternalLink className="h-3 w-3 flex-shrink-0 text-gray-400" />
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>{getDomainFromUrl(citation.source.url)}</span>
                {citation.source.publishedDate && (
                  <>
                    <span>•</span>
                    <span>{new Date(citation.source.publishedDate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
              
              <p className="text-sm text-gray-700 line-clamp-3">
                {citation.source.snippet}
              </p>
              
              {citation.source.relevanceScore && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.round(citation.source.relevanceScore * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {Math.round(citation.source.relevanceScore * 100)}% relevant
                  </span>
                </div>
              )}
            </div>
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
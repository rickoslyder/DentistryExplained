'use client'

import React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { HelpCircle } from 'lucide-react'

interface GlossaryTooltipProps {
  term: string
  definition: string
  pronunciation?: string
  children: React.ReactNode
  showIcon?: boolean
  trackInteraction?: () => void
}

export function GlossaryTooltip({
  term,
  definition,
  pronunciation,
  children,
  showIcon = false,
  trackInteraction
}: GlossaryTooltipProps) {
  const [open, setOpen] = React.useState(false)
  const [highlightTerms, setHighlightTerms] = React.useState(true)
  
  // Load highlight preference
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('glossary-preferences')
      if (stored) {
        const prefs = JSON.parse(stored)
        setHighlightTerms(prefs.highlightTerms ?? true)
      }
    } catch (error) {
      // Fail silently
    }
  }, [])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && trackInteraction) {
      trackInteraction()
    }
  }

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root open={open} onOpenChange={handleOpenChange}>
        <Tooltip.Trigger asChild>
          <span className={highlightTerms ? "glossary-term" : "inline-flex items-center"}>
            {children}
            {showIcon && <HelpCircle className="ml-1 h-3 w-3 text-primary/70" />}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 max-w-sm bg-white p-4 rounded-lg shadow-lg border border-gray-200"
            sideOffset={5}
            side="top"
          >
            <div className="space-y-2">
              <div>
                <h4 className="font-semibold text-gray-900">{term}</h4>
                {pronunciation && (
                  <p className="text-xs text-gray-500 italic">{pronunciation}</p>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{definition}</p>
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                <a 
                  href="/glossary" 
                  className="text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault()
                    window.open(`/glossary#${term.toLowerCase().replace(/\s+/g, '-')}`, '_blank')
                  }}
                >
                  View in glossary →
                </a>
              </div>
            </div>
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
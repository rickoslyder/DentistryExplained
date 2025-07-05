'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { trackGlossaryInteraction } from '@/lib/glossary-tracking'
import { useGlossaryPreferences } from '@/hooks/use-glossary-preferences'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  pronunciation?: string | null
  also_known_as?: string[] | null
  related_terms?: string[] | null
  category?: string | null
  difficulty?: string | null
  example?: string | null
}

interface GlossaryPreferences {
  enableTooltips: boolean
  showOnlyBasicTerms: boolean
  highlightTerms: boolean
}

interface GlossaryContextType {
  terms: Map<string, GlossaryTerm>
  isLoading: boolean
  getTermByName: (name: string) => GlossaryTerm | undefined
  trackTermView: (term: string) => void
  termsLoaded: boolean
  preferences: GlossaryPreferences
}

const GlossaryContext = createContext<GlossaryContextType | undefined>(undefined)

export function GlossaryProvider({ children }: { children: React.ReactNode }) {
  const [terms, setTerms] = useState<Map<string, GlossaryTerm>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [termsLoaded, setTermsLoaded] = useState(false)
  const { preferences } = useGlossaryPreferences()

  useEffect(() => {
    async function loadGlossaryTerms() {
      try {
        const response = await fetch('/api/glossary')
        if (!response.ok) throw new Error('Failed to fetch glossary terms')
        
        const data = await response.json()
        const termsMap = new Map<string, GlossaryTerm>()
        
        // Create map with term as key (lowercase for case-insensitive matching)
        data.terms.forEach((term: GlossaryTerm) => {
          termsMap.set(term.term.toLowerCase(), term)
          
          // Also add aliases/alternative names
          if (term.also_known_as) {
            term.also_known_as.forEach(alias => {
              termsMap.set(alias.toLowerCase(), term)
            })
          }
        })
        
        setTerms(termsMap)
        setTermsLoaded(true)
      } catch (error) {
        console.error('Error loading glossary terms:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGlossaryTerms()
  }, [])

  const getTermByName = useCallback((name: string): GlossaryTerm | undefined => {
    const term = terms.get(name.toLowerCase())
    
    // Filter by difficulty if preference is set
    if (term && preferences.showOnlyBasicTerms && term.difficulty === 'advanced') {
      return undefined
    }
    
    return term
  }, [terms, preferences.showOnlyBasicTerms])

  const trackTermView = useCallback((term: string) => {
    // Track the tooltip view
    trackGlossaryInteraction({ 
      term, 
      interaction_type: 'view',
      metadata: { source: 'tooltip' }
    })
  }, [])

  const value: GlossaryContextType = {
    terms,
    isLoading,
    getTermByName,
    trackTermView,
    termsLoaded,
    preferences
  }

  return (
    <GlossaryContext.Provider value={value}>
      {children}
    </GlossaryContext.Provider>
  )
}

export function useGlossary() {
  const context = useContext(GlossaryContext)
  if (context === undefined) {
    throw new Error('useGlossary must be used within a GlossaryProvider')
  }
  return context
}
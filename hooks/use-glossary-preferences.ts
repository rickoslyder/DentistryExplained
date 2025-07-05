'use client'

import { useState, useEffect } from 'react'

interface GlossaryPreferences {
  enableTooltips: boolean
  showOnlyBasicTerms: boolean
  highlightTerms: boolean
}

const DEFAULT_PREFERENCES: GlossaryPreferences = {
  enableTooltips: true,
  showOnlyBasicTerms: false,
  highlightTerms: true,
}

const STORAGE_KEY = 'glossary-preferences'

export function useGlossaryPreferences() {
  const [preferences, setPreferences] = useState<GlossaryPreferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) })
      }
    } catch (error) {
      console.error('Failed to load glossary preferences:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save preferences to localStorage
  const updatePreferences = (updates: Partial<GlossaryPreferences>) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences))
    } catch (error) {
      console.error('Failed to save glossary preferences:', error)
    }
  }

  const toggleTooltips = () => updatePreferences({ enableTooltips: !preferences.enableTooltips })
  const toggleBasicOnly = () => updatePreferences({ showOnlyBasicTerms: !preferences.showOnlyBasicTerms })
  const toggleHighlight = () => updatePreferences({ highlightTerms: !preferences.highlightTerms })

  return {
    preferences,
    isLoaded,
    updatePreferences,
    toggleTooltips,
    toggleBasicOnly,
    toggleHighlight,
  }
}
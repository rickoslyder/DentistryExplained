import { useEffect, useRef, useCallback, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { toast } from 'sonner'

interface AutosaveData {
  articleId?: string | null
  title?: string
  slug?: string
  content?: string
  excerpt?: string
  seo_title?: string
  seo_description?: string
  category_id?: string | null
  tags?: string[]
  featured?: boolean
  featured_image?: string | null
  reading_time?: number
  difficulty_level?: string
  metadata?: Record<string, any>
}

interface UseAutosaveOptions {
  enabled?: boolean
  delay?: number // milliseconds
  onSave?: (draftId: string) => void
  onError?: (error: Error) => void
}

export function useAutosave(
  data: AutosaveData,
  options: UseAutosaveOptions = {}
) {
  const {
    enabled = true,
    delay = 3000, // 3 seconds default
    onSave,
    onError,
  } = options

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const lastSavedDataRef = useRef<string>('')
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Debounce the data to avoid too frequent saves
  const [debouncedData] = useDebounce(data, delay)

  const save = useCallback(async (dataToSave: AutosaveData) => {
    // Check if data has actually changed
    const dataString = JSON.stringify(dataToSave)
    if (dataString === lastSavedDataRef.current) {
      return
    }

    setIsSaving(true)
    
    try {
      const response = await fetch('/api/admin/articles/autosave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      })

      if (!response.ok) {
        throw new Error('Failed to autosave')
      }

      const result = await response.json()
      
      setDraftId(result.draftId)
      setLastSaved(new Date())
      lastSavedDataRef.current = dataString
      
      if (onSave) {
        onSave(result.draftId)
      }
      
      // Show subtle feedback
      toast.success('Draft saved', {
        duration: 2000,
        position: 'bottom-right',
      })
    } catch (error) {
      console.error('Autosave error:', error)
      
      if (onError) {
        onError(error as Error)
      }
      
      toast.error('Failed to save draft', {
        duration: 3000,
        position: 'bottom-right',
      })
    } finally {
      setIsSaving(false)
    }
  }, [onSave, onError])

  // Manual save function
  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    save(data)
  }, [data, save])

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !debouncedData.content) {
      return
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for save
    saveTimeoutRef.current = setTimeout(() => {
      save(debouncedData)
    }, 100) // Small delay after debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [debouncedData, enabled, save])

  // Load existing draft on mount
  useEffect(() => {
    if (!data.articleId) return

    const loadDraft = async () => {
      try {
        const response = await fetch(`/api/admin/articles/autosave?articleId=${data.articleId}`)
        if (response.ok) {
          const { draft } = await response.json()
          if (draft) {
            setDraftId(draft.id)
            setLastSaved(new Date(draft.updated_at))
            // You might want to return the draft data to populate the form
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }

    loadDraft()
  }, [data.articleId])

  return {
    isSaving,
    lastSaved,
    draftId,
    saveNow,
  }
}
import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { debounce } from '@/lib/utils'
import type { WidgetConfig } from '@/lib/widgets/types'

interface DashboardLayout {
  id: string | null
  name: string
  description?: string
  widgets: WidgetConfig[]
  settings: Record<string, any>
  is_default: boolean
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const layoutRef = useRef<DashboardLayout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    layoutRef.current = layout
  }, [layout])

  // Fetch layout on mount
  useEffect(() => {
    fetchLayout()
  }, [])

  const fetchLayout = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/dashboard/layout')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard layout')
      }
      
      const data = await response.json()
      setLayout(data.layout)
    } catch (error) {
      toast({
        title: 'Error loading dashboard',
        description: 'Failed to load your dashboard layout',
        variant: 'destructive',
      })
      // Set default layout on error
      setLayout({
        id: null,
        name: 'Default Layout',
        widgets: [],
        settings: {},
        is_default: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveLayoutInternal = useCallback(async (widgets: WidgetConfig[]) => {
    if (!layoutRef.current || isSaving) return

    try {
      setIsSaving(true)
      
      const response = await fetch('/api/admin/dashboard/layout', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          widgets,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save dashboard layout')
      }
      
      const data = await response.json()
      setLayout(data.layout)
      
    } catch (error) {
      toast({
        title: 'Error saving dashboard',
        description: 'Failed to save your dashboard layout',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, toast])

  // Debounced save function
  const saveLayout = useCallback((widgets: WidgetConfig[]) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set a new timeout for saving
    saveTimeoutRef.current = setTimeout(() => {
      saveLayoutInternal(widgets)
    }, 1000) // Wait 1 second before saving
  }, [saveLayoutInternal])

  const addWidget = useCallback((widget: WidgetConfig) => {
    if (!layoutRef.current) return

    const updatedWidgets = [...layoutRef.current.widgets, widget]
    setLayout({ ...layoutRef.current, widgets: updatedWidgets })
    saveLayout(updatedWidgets)
  }, [saveLayout])

  const removeWidget = useCallback((widgetId: string) => {
    if (!layoutRef.current) return

    const updatedWidgets = layoutRef.current.widgets.filter(w => w.id !== widgetId)
    setLayout({ ...layoutRef.current, widgets: updatedWidgets })
    saveLayout(updatedWidgets)
  }, [saveLayout])

  const updateWidgets = useCallback((widgets: WidgetConfig[]) => {
    if (!layoutRef.current) return

    setLayout({ ...layoutRef.current, widgets })
    saveLayout(widgets)
  }, [saveLayout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    layout,
    isLoading,
    isSaving,
    addWidget,
    removeWidget,
    updateWidgets,
    refetch: fetchLayout,
  }
}
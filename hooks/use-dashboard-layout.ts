import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
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
  const isSavingRef = useRef(false)

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
      const response = await fetch('/api/admin/dashboard/layout', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard layout')
      }
      
      const data = await response.json()
      // If no layout exists, create one with default widgets
      if (!data.layout) {
        const defaultLayout: DashboardLayout = {
          id: null,
          name: 'Default Layout',
          widgets: [],
          settings: {},
          is_default: true,
        }
        setLayout(defaultLayout)
      } else {
        setLayout(data.layout)
      }
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
    if (!layoutRef.current || isSavingRef.current) return

    try {
      isSavingRef.current = true
      setIsSaving(true)
      
      const response = await fetch('/api/admin/dashboard/layout', {
        method: 'PUT',
        credentials: 'include',
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
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [toast]) // Remove isSaving from dependencies

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

  const initializeDefaultWidgets = useCallback(() => {
    if (!layout || layout.widgets.length > 0) return
    
    const defaultWidgets: WidgetConfig[] = [
      {
        id: `widget_${Date.now()}_1`,
        type: 'stats',
        title: 'Platform Stats',
        x: 0,
        y: 0,
        w: 6,
        h: 4,
      },
      {
        id: `widget_${Date.now()}_2`,
        type: 'quick-actions',
        title: 'Quick Actions',
        x: 6,
        y: 0,
        w: 6,
        h: 4,
      },
      {
        id: `widget_${Date.now()}_3`,
        type: 'recent-activity',
        title: 'Recent Activity',
        x: 0,
        y: 4,
        w: 6,
        h: 6,
      },
      {
        id: `widget_${Date.now()}_4`,
        type: 'content-status',
        title: 'Content Status',
        x: 6,
        y: 4,
        w: 3,
        h: 6,
      },
      {
        id: `widget_${Date.now()}_5`,
        type: 'user-growth',
        title: 'User Growth',
        x: 9,
        y: 4,
        w: 3,
        h: 6,
      },
    ]
    
    updateWidgets(defaultWidgets)
  }, [layout, updateWidgets])

  return {
    layout,
    isLoading,
    isSaving,
    addWidget,
    removeWidget,
    updateWidgets,
    initializeDefaultWidgets,
    refetch: fetchLayout,
  }
}
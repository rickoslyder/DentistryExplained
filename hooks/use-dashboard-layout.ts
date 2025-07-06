import { useState, useEffect, useCallback } from 'react'
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

  const saveLayout = useCallback(async (widgets: WidgetConfig[]) => {
    if (!layout || isSaving) return

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
  }, [layout, isSaving, toast])

  const addWidget = useCallback((widget: WidgetConfig) => {
    if (!layout) return

    const updatedWidgets = [...layout.widgets, widget]
    setLayout({ ...layout, widgets: updatedWidgets })
    saveLayout(updatedWidgets)
  }, [layout, saveLayout])

  const removeWidget = useCallback((widgetId: string) => {
    if (!layout) return

    const updatedWidgets = layout.widgets.filter(w => w.id !== widgetId)
    setLayout({ ...layout, widgets: updatedWidgets })
    saveLayout(updatedWidgets)
  }, [layout, saveLayout])

  const updateWidgets = useCallback((widgets: WidgetConfig[]) => {
    if (!layout) return

    setLayout({ ...layout, widgets })
    saveLayout(widgets)
  }, [layout, saveLayout])

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
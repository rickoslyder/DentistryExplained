'use client'

import { useState, useEffect, useRef } from 'react'
import { DashboardGrid } from '@/components/admin/widgets/dashboard-grid'
import { useDashboardLayout } from '@/hooks/use-dashboard-layout'
import { registerCoreWidgets } from '@/components/admin/widgets'
import { widgetRegistry } from '@/lib/widgets/registry'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Save, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { v4 as uuidv4 } from 'uuid'
import type { WidgetConfig } from '@/lib/widgets/types'

export function DashboardClient() {
  const [isEditing, setIsEditing] = useState(false)
  const widgetsRegistered = useRef(false)
  const initRef = useRef(false)
  const { layout, isLoading, isSaving, addWidget, removeWidget, updateWidgets } = useDashboardLayout()

  // Register widgets only once
  useEffect(() => {
    if (!widgetsRegistered.current) {
      registerCoreWidgets()
      widgetsRegistered.current = true
    }
  }, [])

  const handleAddWidget = (type: string) => {
    const registryEntry = widgetRegistry.get(type)
    if (!registryEntry) return

    const newWidget: WidgetConfig = {
      id: uuidv4(),
      type,
      title: registryEntry.defaultConfig.title || registryEntry.name,
      x: 0,
      y: 0,
      w: registryEntry.defaultConfig.w || 4,
      h: registryEntry.defaultConfig.h || 4,
      minW: registryEntry.defaultConfig.minW,
      minH: registryEntry.defaultConfig.minH,
      settings: {},
    }

    // Find a position for the new widget
    const widgets = layout?.widgets || []
    let maxY = 0
    widgets.forEach(widget => {
      const bottomY = widget.y + widget.h
      if (bottomY > maxY) maxY = bottomY
    })
    newWidget.y = maxY

    addWidget(newWidget)
  }

  const availableWidgets = widgetRegistry.getAll()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Initialize default widgets only once
  useEffect(() => {
    if (!isLoading && layout && layout.widgets.length === 0 && !initRef.current && !isSaving) {
      initRef.current = true
      const defaultWidgets: WidgetConfig[] = [
        {
          id: uuidv4(),
          type: 'stats',
          title: 'Platform Stats',
          x: 0,
          y: 0,
          w: 6,
          h: 4,
        },
        {
          id: uuidv4(),
          type: 'quick-actions',
          title: 'Quick Actions',
          x: 6,
          y: 0,
          w: 6,
          h: 4,
        },
        {
          id: uuidv4(),
          type: 'recent-activity',
          title: 'Recent Activity',
          x: 0,
          y: 4,
          w: 6,
          h: 6,
        },
        {
          id: uuidv4(),
          type: 'content-status',
          title: 'Content Status',
          x: 6,
          y: 4,
          w: 3,
          h: 6,
        },
        {
          id: uuidv4(),
          type: 'user-growth',
          title: 'User Growth',
          x: 9,
          y: 4,
          w: 3,
          h: 6,
        },
      ]
      updateWidgets(defaultWidgets)
    }
  }, [isLoading, layout, isSaving, updateWidgets])

  const widgets = layout?.widgets || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Drag and resize widgets to customize your dashboard' : 'Monitor your platform at a glance'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Widget
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {availableWidgets.map((widget) => {
                  const Icon = widget.icon
                  return (
                    <DropdownMenuItem
                      key={widget.type}
                      onClick={() => handleAddWidget(widget.type)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <div>
                        <p className="font-medium">{widget.name}</p>
                        <p className="text-xs text-muted-foreground">{widget.description}</p>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Layout'}
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Customize
              </>
            )}
          </Button>
        </div>
      </div>

      <DashboardGrid
        widgets={widgets}
        isEditing={isEditing}
        onLayoutChange={updateWidgets}
        onRemoveWidget={removeWidget}
        onWidgetSettings={(widgetId) => {
          // TODO: Open widget settings dialog
          console.log('Widget settings:', widgetId)
        }}
      />
    </div>
  )
}
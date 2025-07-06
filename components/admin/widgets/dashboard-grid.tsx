'use client'

import { useState, useCallback, useEffect } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { widgetRegistry } from '@/lib/widgets/registry'
import { WidgetWrapper } from './widget-wrapper'
import type { WidgetConfig } from '@/lib/widgets/types'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardGridProps {
  widgets: WidgetConfig[]
  isEditing: boolean
  onLayoutChange: (widgets: WidgetConfig[]) => void
  onRemoveWidget: (widgetId: string) => void
  onWidgetSettings: (widgetId: string) => void
}

export function DashboardGrid({
  widgets,
  isEditing,
  onLayoutChange,
  onRemoveWidget,
  onWidgetSettings,
}: DashboardGridProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLayoutChange = useCallback((layout: Layout[]) => {
    if (!isEditing) return

    const updatedWidgets = widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id)
      if (layoutItem) {
        return {
          ...widget,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        }
      }
      return widget
    })

    onLayoutChange(updatedWidgets)
  }, [widgets, isEditing, onLayoutChange])

  const renderWidget = (widget: WidgetConfig) => {
    const registryEntry = widgetRegistry.get(widget.type)
    if (!registryEntry) {
      return (
        <div key={widget.id} data-grid={widget}>
          <WidgetWrapper
            title="Unknown Widget"
            error={new Error(`Widget type "${widget.type}" not found`)}
          >
            <div />
          </WidgetWrapper>
        </div>
      )
    }

    const WidgetComponent = registryEntry.component

    return (
      <div key={widget.id} data-grid={widget}>
        <WidgetComponent
          id={widget.id}
          config={widget}
          isEditing={isEditing}
          onRemove={() => onRemoveWidget(widget.id)}
          onSettingsChange={(settings) => {
            const updatedWidgets = widgets.map(w =>
              w.id === widget.id ? { ...w, settings } : w
            )
            onLayoutChange(updatedWidgets)
          }}
        />
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {widgets.map(widget => (
          <div key={widget.id} className="h-64">
            <WidgetWrapper title={widget.title} isLoading>
              <div />
            </WidgetWrapper>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: widgets }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={60}
      isDraggable={isEditing}
      isResizable={isEditing}
      onLayoutChange={handleLayoutChange}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      useCSSTransforms={true}
      compactType="vertical"
      preventCollision={false}
    >
      {widgets.map(renderWidget)}
    </ResponsiveGridLayout>
  )
}
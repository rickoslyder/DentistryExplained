export interface WidgetConfig {
  id: string
  type: string
  title: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
  settings?: Record<string, any>
}

export interface WidgetRegistryEntry {
  type: string
  name: string
  description: string
  icon: React.ComponentType<any>
  component: React.ComponentType<WidgetComponentProps>
  defaultConfig: Partial<WidgetConfig>
  settingsSchema?: any
}

export interface WidgetComponentProps {
  id: string
  config: WidgetConfig
  isEditing: boolean
  onSettingsChange?: (settings: Record<string, any>) => void
  onRemove?: () => void
}

export interface DashboardLayout {
  id: string
  name: string
  description?: string
  widgets: WidgetConfig[]
  cols?: number
  rowHeight?: number
  createdAt: Date
  updatedAt: Date
}

export interface WidgetDataResult<T = any> {
  data?: T
  error?: Error
  isLoading: boolean
  refetch: () => void
}
import { WidgetRegistryEntry } from './types'

class WidgetRegistry {
  private widgets: Map<string, WidgetRegistryEntry> = new Map()

  register(entry: WidgetRegistryEntry) {
    if (this.widgets.has(entry.type)) {
      // Skip re-registration if already exists
      return
    }
    this.widgets.set(entry.type, entry)
  }

  unregister(type: string) {
    this.widgets.delete(type)
  }

  get(type: string): WidgetRegistryEntry | undefined {
    return this.widgets.get(type)
  }

  getAll(): WidgetRegistryEntry[] {
    return Array.from(this.widgets.values())
  }

  has(type: string): boolean {
    return this.widgets.has(type)
  }

  clear() {
    this.widgets.clear()
  }
}

// Create singleton instance
export const widgetRegistry = new WidgetRegistry()

// Helper function to register multiple widgets at once
export function registerWidgets(entries: WidgetRegistryEntry[]) {
  entries.forEach(entry => widgetRegistry.register(entry))
}
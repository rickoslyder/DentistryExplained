import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    shortcuts.forEach(shortcut => {
      const isCtrlPressed = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true
      const isMetaPressed = shortcut.meta ? event.metaKey : true
      const isShiftPressed = shortcut.shift ? event.shiftKey : !shortcut.shift || event.shiftKey
      const isAltPressed = shortcut.alt ? event.altKey : !shortcut.alt || event.altKey
      
      const isKeyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

      if (isKeyMatch && isCtrlPressed && isMetaPressed && isShiftPressed && isAltPressed) {
        event.preventDefault()
        shortcut.action()
      }
    })
  }, [shortcuts, enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
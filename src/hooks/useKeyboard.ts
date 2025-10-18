import { useEffect, useCallback } from 'react'

type KeyHandler = (event: KeyboardEvent) => void

export function useKeyboard() {
  const handleKeyDown = useCallback((handler: KeyHandler) => {
    const keyHandler = (event: KeyboardEvent) => {
      handler(event)
    }

    document.addEventListener('keydown', keyHandler)
    return () => document.removeEventListener('keydown', keyHandler)
  }, [])

  const handleKeyUp = useCallback((handler: KeyHandler) => {
    const keyHandler = (event: KeyboardEvent) => {
      handler(event)
    }

    document.addEventListener('keyup', keyHandler)
    return () => document.removeEventListener('keyup', keyHandler)
  }, [])

  return { handleKeyDown, handleKeyUp }
}

// Specific key handlers
export function useKeyPress(targetKey: string, handler: () => void) {
  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        handler()
      }
    }

    document.addEventListener('keydown', keyHandler)
    return () => document.removeEventListener('keydown', keyHandler)
  }, [targetKey, handler])
}

export function useEscapeKey(handler: () => void) {
  useKeyPress('Escape', handler)
}

export function useEnterKey(handler: () => void) {
  useKeyPress('Enter', handler)
}

// Keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const modifier = event.ctrlKey || event.metaKey
      
      // Handle Ctrl/Cmd + key combinations
      if (modifier) {
        const shortcut = `ctrl+${key}`
        if (shortcuts[shortcut]) {
          event.preventDefault()
          shortcuts[shortcut]()
        }
      }
      
      // Handle single key shortcuts
      if (shortcuts[key]) {
        event.preventDefault()
        shortcuts[key]()
      }
    }

    document.addEventListener('keydown', keyHandler)
    return () => document.removeEventListener('keydown', keyHandler)
  }, [shortcuts])
}

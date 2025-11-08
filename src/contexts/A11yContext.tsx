import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface A11yContextType {
  // Color and contrast
  highContrast: boolean
  toggleHighContrast: () => void
  
  // Font size
  fontSize: number
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
  
  // Motion preferences
  reduceMotion: boolean
  toggleReduceMotion: () => void
  
  // Focus management
  focusVisible: boolean
  toggleFocusVisible: () => void
  
  // Screen reader announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  
  // Keyboard navigation
  isKeyboardUser: boolean
  
  // Focus trap for modals
  trapFocus: (elementId: string) => void
  releaseFocus: () => void
}

const A11yContext = createContext<A11yContextType | undefined>(undefined)

const MIN_FONT_SIZE = 14
const MAX_FONT_SIZE = 24
const DEFAULT_FONT_SIZE = 16

export function A11yProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [focusVisible, setFocusVisible] = useState(true)
  const [isKeyboardUser, setIsKeyboardUser] = useState(true)
  const [focusTrapped, setFocusTrapped] = useState<string | null>(null)
  
  // Monitor keyboard/mouse usage
  useEffect(() => {
    const handleKeyDown = () => setIsKeyboardUser(true)
    const handleMouseDown = () => setIsKeyboardUser(false)
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleMouseDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])
  
  // Apply high contrast mode
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [highContrast])
  
  // Apply font size
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])
  
  // Apply reduced motion
  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
  }, [reduceMotion])
  
  // Focus visibility
  useEffect(() => {
    if (!focusVisible) {
      document.documentElement.classList.add('no-focus-outline')
    } else {
      document.documentElement.classList.remove('no-focus-outline')
    }
  }, [focusVisible])
  
  // Focus trap implementation
  useEffect(() => {
    if (!focusTrapped) return
    
    const trapContainer = document.getElementById(focusTrapped)
    if (!trapContainer) return
    
    const focusableElements = trapContainer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }
    
    document.addEventListener('keydown', handleFocusTrap)
    firstFocusable.focus()
    
    return () => document.removeEventListener('keydown', handleFocusTrap)
  }, [focusTrapped])

  // Screen reader announcements
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.setAttribute('class', 'sr-only')
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  const value: A11yContextType = {
    // Color and contrast
    highContrast,
    toggleHighContrast: () => setHighContrast(prev => !prev),
    
    // Font size
    fontSize,
    increaseFontSize: () => setFontSize(prev => Math.min(prev + 2, MAX_FONT_SIZE)),
    decreaseFontSize: () => setFontSize(prev => Math.max(prev - 2, MIN_FONT_SIZE)),
    resetFontSize: () => setFontSize(DEFAULT_FONT_SIZE),
    
    // Motion preferences
    reduceMotion,
    toggleReduceMotion: () => setReduceMotion(prev => !prev),
    
    // Focus management
    focusVisible,
    toggleFocusVisible: () => setFocusVisible(prev => !prev),
    
    // Screen reader announcements
    announce,
    
    // Keyboard navigation
    isKeyboardUser,
    
    // Focus trap
    trapFocus: (elementId: string) => setFocusTrapped(elementId),
    releaseFocus: () => setFocusTrapped(null),
  }

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>
}

export function useA11y() {
  const context = useContext(A11yContext)
  if (!context) {
    throw new Error('useA11y must be used within an A11yProvider')
  }
  return context
}
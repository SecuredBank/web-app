import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface A11yPreferences {
  // Color and contrast
  highContrast: boolean
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  
  // Font and text
  fontSize: number
  fontFamily: string
  lineSpacing: number
  letterSpacing: number
  
  // Motion and animation
  reduceMotion: boolean
  animationSpeed: number
  
  // Focus and navigation
  focusVisible: boolean
  focusIndicatorSize: number
  focusIndicatorColor: string
  keyboardMode: boolean
  
  // Sound and media
  soundEnabled: boolean
  videoCaptions: boolean
  videoDescriptions: boolean
  
  // Content preferences
  imageAltTextVisible: boolean
  tableOfContentsVisible: boolean
  readingGuideEnabled: boolean
}

interface A11yContextType extends A11yPreferences {
  // Color and contrast
  toggleHighContrast: () => void
  setColorBlindMode: (mode: A11yPreferences['colorBlindMode']) => void
  
  // Font and text
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
  setFontFamily: (font: string) => void
  adjustLineSpacing: (value: number) => void
  adjustLetterSpacing: (value: number) => void
  
  // Motion and animation
  toggleReduceMotion: () => void
  setAnimationSpeed: (speed: number) => void
  
  // Focus and navigation
  toggleFocusVisible: () => void
  setFocusIndicator: (size: number, color: string) => void
  toggleKeyboardMode: () => void
  
  // Sound and media
  toggleSound: () => void
  toggleCaptions: () => void
  toggleVideoDescriptions: () => void
  
  // Content preferences
  toggleImageAltText: () => void
  toggleTableOfContents: () => void
  toggleReadingGuide: () => void
  
  // Screen reader announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  
  // Focus trap for modals
  trapFocus: (elementId: string) => void
  releaseFocus: () => void
  
  // Navigation helpers
  skipToMain: () => void
  skipToNav: () => void
  
  // Preferences management
  savePreferences: () => void
  resetPreferences: () => void
  exportPreferences: () => string
  importPreferences: (preferences: string) => void
}

const A11yContext = createContext<A11yContextType | undefined>(undefined)

const MIN_FONT_SIZE = 14
const MAX_FONT_SIZE = 24
const DEFAULT_FONT_SIZE = 16
const DEFAULT_LINE_SPACING = 1.5
const DEFAULT_LETTER_SPACING = 0
const DEFAULT_FOCUS_INDICATOR_SIZE = 2
const DEFAULT_FOCUS_INDICATOR_COLOR = '#4C9AFF'
const DEFAULT_ANIMATION_SPEED = 1

const defaultPreferences: A11yPreferences = {
  highContrast: false,
  colorBlindMode: 'none',
  fontSize: DEFAULT_FONT_SIZE,
  fontFamily: 'system-ui',
  lineSpacing: DEFAULT_LINE_SPACING,
  letterSpacing: DEFAULT_LETTER_SPACING,
  reduceMotion: false,
  animationSpeed: DEFAULT_ANIMATION_SPEED,
  focusVisible: true,
  focusIndicatorSize: DEFAULT_FOCUS_INDICATOR_SIZE,
  focusIndicatorColor: DEFAULT_FOCUS_INDICATOR_COLOR,
  keyboardMode: true,
  soundEnabled: true,
  videoCaptions: true,
  videoDescriptions: false,
  imageAltTextVisible: false,
  tableOfContentsVisible: false,
  readingGuideEnabled: false,
}

export function A11yProvider({ children }: { children: ReactNode }) {
  // Core accessibility states
  const [preferences, setPreferences] = useState<A11yPreferences>(() => {
    try {
      const saved = localStorage.getItem('a11y_preferences')
      return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences
    } catch {
      return defaultPreferences
    }
  })
  
  // Focus trap state
  const [focusTrapped, setFocusTrapped] = useState<string | null>(null)
  
  // Monitor keyboard/mouse usage
  useEffect(() => {
    const handleKeyDown = () => setPreferences(prev => ({ ...prev, keyboardMode: true }))
    const handleMouseDown = () => setPreferences(prev => ({ ...prev, keyboardMode: false }))
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleMouseDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])
  
  // Apply preferences to document
  useEffect(() => {
    // High contrast mode
    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    // Font size
    document.documentElement.style.fontSize = `${preferences.fontSize}px`
    
    // Line and letter spacing
    document.documentElement.style.lineHeight = `${preferences.lineSpacing}`
    document.documentElement.style.letterSpacing = `${preferences.letterSpacing}px`

    // Reduced motion
    if (preferences.reduceMotion) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }

    // Focus visibility
    if (!preferences.focusVisible) {
      document.documentElement.classList.add('no-focus-outline')
    } else {
      document.documentElement.classList.remove('no-focus-outline')
    }

    // Color blind mode
    document.documentElement.setAttribute('data-color-blind-mode', preferences.colorBlindMode)
    
    // Font family
    document.documentElement.style.fontFamily = preferences.fontFamily
    
    // Focus indicator
    document.documentElement.style.setProperty('--focus-indicator-size', `${preferences.focusIndicatorSize}px`)
    document.documentElement.style.setProperty('--focus-indicator-color', preferences.focusIndicatorColor)
    
    // Save preferences to localStorage
    localStorage.setItem('a11y_preferences', JSON.stringify(preferences))
  }, [preferences])
  
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
    ...preferences,

    // Color and contrast
    toggleHighContrast: () => setPreferences(prev => ({ ...prev, highContrast: !prev.highContrast })),
    setColorBlindMode: (mode) => setPreferences(prev => ({ ...prev, colorBlindMode: mode })),
    
    // Font and text
    increaseFontSize: () => setPreferences(prev => ({ 
      ...prev, 
      fontSize: Math.min(prev.fontSize + 2, MAX_FONT_SIZE) 
    })),
    decreaseFontSize: () => setPreferences(prev => ({ 
      ...prev, 
      fontSize: Math.max(prev.fontSize - 2, MIN_FONT_SIZE) 
    })),
    resetFontSize: () => setPreferences(prev => ({ ...prev, fontSize: DEFAULT_FONT_SIZE })),
    setFontFamily: (font) => setPreferences(prev => ({ ...prev, fontFamily: font })),
    adjustLineSpacing: (value) => setPreferences(prev => ({ ...prev, lineSpacing: value })),
    adjustLetterSpacing: (value) => setPreferences(prev => ({ ...prev, letterSpacing: value })),
    
    // Motion and animation
    toggleReduceMotion: () => setPreferences(prev => ({ ...prev, reduceMotion: !prev.reduceMotion })),
    setAnimationSpeed: (speed) => setPreferences(prev => ({ ...prev, animationSpeed: speed })),
    
    // Focus and navigation
    toggleFocusVisible: () => setPreferences(prev => ({ ...prev, focusVisible: !prev.focusVisible })),
    setFocusIndicator: (size, color) => setPreferences(prev => ({ 
      ...prev, 
      focusIndicatorSize: size,
      focusIndicatorColor: color 
    })),
    toggleKeyboardMode: () => setPreferences(prev => ({ ...prev, keyboardMode: !prev.keyboardMode })),
    
    // Sound and media
    toggleSound: () => setPreferences(prev => ({ ...prev, soundEnabled: !prev.soundEnabled })),
    toggleCaptions: () => setPreferences(prev => ({ ...prev, videoCaptions: !prev.videoCaptions })),
    toggleVideoDescriptions: () => setPreferences(prev => ({ 
      ...prev, 
      videoDescriptions: !prev.videoDescriptions 
    })),
    
    // Content preferences
    toggleImageAltText: () => setPreferences(prev => ({ 
      ...prev, 
      imageAltTextVisible: !prev.imageAltTextVisible 
    })),
    toggleTableOfContents: () => setPreferences(prev => ({ 
      ...prev, 
      tableOfContentsVisible: !prev.tableOfContentsVisible 
    })),
    toggleReadingGuide: () => setPreferences(prev => ({ 
      ...prev, 
      readingGuideEnabled: !prev.readingGuideEnabled 
    })),
    
    // Screen reader announcements
    announce,
    
    // Focus trap
    trapFocus: (elementId: string) => setFocusTrapped(elementId),
    releaseFocus: () => setFocusTrapped(null),
    
    // Navigation helpers
    skipToMain: () => {
      const main = document.querySelector('main')
      if (main) {
        main.setAttribute('tabindex', '-1')
        main.focus()
        main.removeAttribute('tabindex')
      }
    },
    skipToNav: () => {
      const nav = document.querySelector('nav')
      if (nav) {
        nav.setAttribute('tabindex', '-1')
        nav.focus()
        nav.removeAttribute('tabindex')
      }
    },
    
    // Preferences management
    savePreferences: () => {
      try {
        localStorage.setItem('a11y_preferences', JSON.stringify(preferences))
      } catch (e) {
        console.error('Failed to save accessibility preferences:', e)
      }
    },
    resetPreferences: () => {
      setPreferences(defaultPreferences)
      localStorage.removeItem('a11y_preferences')
    },
    exportPreferences: () => {
      return JSON.stringify(preferences)
    },
    importPreferences: (prefsString) => {
      try {
        const newPrefs = JSON.parse(prefsString)
        setPreferences({ ...defaultPreferences, ...newPrefs })
      } catch (e) {
        console.error('Failed to import accessibility preferences:', e)
      }
    }
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

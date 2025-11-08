import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { SecurityMiddleware } from '../utils/securityMiddleware'
import { SessionManager } from '../utils/sessionManager'
import { CSRFProtection } from '../utils/csrfProtection'
import { XSSProtection } from '../utils/xssProtection'
import { encryptData, decryptData } from '../utils/securityUtils'
import { useA11y } from './A11yContext'
import { useDebounce } from '../hooks/useDebounce'
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring'
import { SecurityTokenCache } from '../utils/SecurityTokenCache'

interface SecurityConfig {
  xss: { enabled: boolean }
  csrf: {
    enabled: boolean
    ignoredPaths: string[]
  }
  session: {
    enabled: boolean
    renewOnRequest: boolean
  }
  cors: {
    enabled: boolean
    allowedOrigins: string[]
    allowedMethods: string[]
    allowedHeaders: string[]
    exposedHeaders: string[]
    maxAge: number
  }
  rateLimit: {
    enabled: boolean
    windowMs: number
    maxRequests: number
  }
  accessibility: {
    enabled: boolean
    logoutOnInactivity: boolean
    inactivityTimeout: number
    screenReaderWarnings: boolean
    autoRefreshTokens: boolean
    sessionAlerts: boolean
    keyboardTimeout: number
    focusResetOnNavigation: boolean
    visualFeedbackDuration: number
  }
}

interface SecurityContextType {
  securityMiddleware: SecurityMiddleware
  sessionManager: SessionManager
  csrf: CSRFProtection
  xss: XSSProtection
  refreshSecurity: () => Promise<void>
  // Accessibility-related security features
  announceSecurityEvent: (message: string, priority?: 'polite' | 'assertive') => void
  clearSensitiveData: () => void
  handleSecurityTimeout: () => void
  resetSecurityFocus: () => void
  isSecureInputFocused: boolean
  startSecureSession: () => void
  endSecureSession: () => void
  monitorInactivity: () => void
  pauseInactivityMonitoring: () => void
  resumeInactivityMonitoring: () => void
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

const defaultConfig: SecurityConfig = {
  xss: {
    enabled: true,
  },
  csrf: {
    enabled: true,
    ignoredPaths: ['/api/login', '/api/register'],
  },
  session: {
    enabled: true,
    renewOnRequest: true,
  },
  cors: {
    enabled: true,
    allowedOrigins: [window.location.origin],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 7200,
  },
  rateLimit: {
    enabled: true,
    windowMs: 60000, // 1 minute
    maxRequests: 100,
  },
  accessibility: {
    enabled: true,
    logoutOnInactivity: true,
    inactivityTimeout: 300000, // 5 minutes
    screenReaderWarnings: true,
    autoRefreshTokens: true,
    sessionAlerts: true,
    keyboardTimeout: 30000, // 30 seconds
    focusResetOnNavigation: true,
    visualFeedbackDuration: 2000, // 2 seconds
  }
}

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  // Initialize security features
  const securityMiddleware = useRef(new SecurityMiddleware(defaultConfig)).current
  const sessionManager = useRef(new SessionManager()).current
  const csrf = useRef(new CSRFProtection()).current
  const xss = useRef(new XSSProtection()).current
  
  // Initialize performance monitoring
  const performance = usePerformanceMonitoring('SecurityContext', {
    threshold: 100,
    enableMemoryMetrics: true,
    onThresholdExceeded: (metrics) => {
      console.warn('Security operation exceeded threshold:', metrics);
    }
  })
  
  // Initialize token cache
  const tokenCache = useRef(new SecurityTokenCache(300000)).current // 5 minutes TTL
  
  // Track batch updates
  const pendingUpdates = useRef<Set<() => Promise<void>>>(new Set())
  const batchTimeout = useRef<number>()
  
  // Get accessibility context
  const a11y = useA11y()
  
  // Track secure input focus
  const [isSecureInputFocused, setIsSecureInputFocused] = useState(false)
  
  // Track inactivity timer
  const inactivityTimer = useRef<number>()
  const inactivityPaused = useRef(false)
  
  // Announce security events using screen reader
  const announceSecurityEvent = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (defaultConfig.accessibility.screenReaderWarnings) {
      a11y.announce(message, priority)
    }
  }
  
  // Clear sensitive data from forms and state
  const clearSensitiveData = () => {
    // Clear form fields with sensitive data
    const sensitiveInputs = document.querySelectorAll('input[type="password"], input[data-sensitive="true"]')
    sensitiveInputs.forEach((input: HTMLInputElement) => {
      input.value = ''
    })
    
    // Clear sensitive data from localStorage
    localStorage.removeItem('user_data')
    localStorage.removeItem('temp_session')
    
    announceSecurityEvent('Sensitive data cleared')
  }
  
  // Handle security timeout
  const handleSecurityTimeout = () => {
    if (!defaultConfig.accessibility.logoutOnInactivity || inactivityPaused.current) return
    
    clearSensitiveData()
    refreshSecurity()
    announceSecurityEvent('Session timed out due to inactivity', 'assertive')
    
    // Reset focus to login form or appropriate element
    resetSecurityFocus()
  }
  
  // Reset focus after security events
  const resetSecurityFocus = () => {
    if (!defaultConfig.accessibility.focusResetOnNavigation) return
    
    const loginForm = document.querySelector('#login-form')
    const mainContent = document.querySelector('main')
    
    if (loginForm) {
      const firstInput = loginForm.querySelector('input')
      if (firstInput) {
        firstInput.focus()
      }
    } else if (mainContent) {
      mainContent.setAttribute('tabindex', '-1')
      mainContent.focus()
      mainContent.removeAttribute('tabindex')
    }
  }
  
  // Start secure session
  const startSecureSession = () => {
    setIsSecureInputFocused(true)
    announceSecurityEvent('Entering secure input mode')
    
    // Enhance security for sensitive operations
    if (defaultConfig.accessibility.autoRefreshTokens) {
      refreshSecurity()
    }
  }
  
  // End secure session
  const endSecureSession = () => {
    setIsSecureInputFocused(false)
    announceSecurityEvent('Exiting secure input mode')
    clearSensitiveData()
  }
  
  // Monitor user inactivity
  const monitorInactivity = () => {
    if (inactivityTimer.current) {
      window.clearTimeout(inactivityTimer.current)
    }
    
    if (!inactivityPaused.current && defaultConfig.accessibility.logoutOnInactivity) {
      inactivityTimer.current = window.setTimeout(
        handleSecurityTimeout,
        defaultConfig.accessibility.inactivityTimeout
      )
    }
  }
  
  // Pause inactivity monitoring
  const pauseInactivityMonitoring = () => {
    inactivityPaused.current = true
    if (inactivityTimer.current) {
      window.clearTimeout(inactivityTimer.current)
    }
    if (defaultConfig.accessibility.sessionAlerts) {
      announceSecurityEvent('Security timeout paused')
    }
  }
  
  // Resume inactivity monitoring
  const resumeInactivityMonitoring = () => {
    inactivityPaused.current = false
    monitorInactivity()
    if (defaultConfig.accessibility.sessionAlerts) {
      announceSecurityEvent('Security timeout resumed')
    }
  }

  // Set up regular security maintenance
  useEffect(() => {
    const maintenanceInterval = setInterval(() => {
      // Clean up expired sessions and tokens
      sessionManager.cleanup()
      csrf.clearExpiredTokens()
      securityMiddleware.cleanup()
    }, 5 * 60 * 1000) // Run every 5 minutes

    return () => clearInterval(maintenanceInterval)
  }, [sessionManager, csrf, securityMiddleware])

    // Set up device fingerprinting
  useEffect(() => {
    try {
      // Generate browser fingerprint
      const components = [
        window.navigator.userAgent,
        window.navigator.language,
        window.screen.colorDepth,
        window.screen.width,
        window.screen.height,
        new Date().getTimezoneOffset()
      ].join('|')
      
      // Encrypt the fingerprint for storage
      const fingerprint = encryptData(components)
      localStorage.setItem('device_fingerprint', fingerprint)
    } catch (error) {
      console.error('Failed to generate device fingerprint:', error)
    }
  }, [])

  // Set up CSP and security headers
  useEffect(() => {
    // Generate a random nonce
    const nonce = crypto.getRandomValues(new Uint8Array(16))
      .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
    
    const meta = document.createElement('meta')
    meta.httpEquiv = 'Content-Security-Policy'
    meta.content = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim()
    document.head.appendChild(meta)
    
    return () => {
      document.head.removeChild(meta)
    }
  }, [csrf])

  // Initialize security headers
  useEffect(() => {
    // Add security headers to all API requests
    const originalFetch = window.fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init)
      const securedRequest = await securityMiddleware.preProcessRequest(request)
      
      try {
        const response = await originalFetch(securedRequest)
        return await securityMiddleware.preProcessResponse(response)
      } catch (error) {
        console.error('Security middleware error:', error)
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [securityMiddleware])

  // Batched security updates
  const processBatchedUpdates = useCallback(async () => {
    performance.startOperation('processBatchedUpdates');
    const updates = Array.from(pendingUpdates.current);
    pendingUpdates.current.clear();

    try {
      await Promise.all(updates.map(update => update()));
    } catch (error) {
      console.error('Error processing security updates:', error);
    }

    performance.endOperation();
  }, []);

  // Add update to batch
  const queueSecurityUpdate = useCallback((update: () => Promise<void>) => {
    pendingUpdates.current.add(update);
    
    if (batchTimeout.current) {
      window.clearTimeout(batchTimeout.current);
    }
    
    batchTimeout.current = window.setTimeout(processBatchedUpdates, 100);
  }, [processBatchedUpdates]);

  // Optimized security token management
  const getSecurityToken = useCallback((type: string, userId: string): string | null => {
    const cachedToken = tokenCache.get(`${type}_${userId}`);
    if (cachedToken) return cachedToken;

    let newToken: string | null = null;
    performance.startOperation('generateSecurityToken');
    
    try {
      switch (type) {
        case 'csrf':
          newToken = csrf.generateToken(userId);
          break;
        case 'session':
          const fingerprint = localStorage.getItem('device_fingerprint');
          if (fingerprint) {
            const session = sessionManager.createSession(userId, fingerprint);
            newToken = session.id;
          }
          break;
      }

      if (newToken) {
        tokenCache.set(`${type}_${userId}`, newToken, type);
      }
    } finally {
      performance.endOperation();
    }

    return newToken;
  }, []);

  // Optimized security refresh
  const refreshSecurity = useCallback(async () => {
    performance.startOperation('refreshSecurity');
    const userId = localStorage.getItem('user_id');

    if (userId) {
      queueSecurityUpdate(async () => {
        // Generate new CSRF token
        const newToken = getSecurityToken('csrf', userId);
        if (newToken) {
          localStorage.setItem('csrf_token', newToken);
        }

        // Create new session if needed
        const fingerprint = localStorage.getItem('device_fingerprint');
        if (fingerprint) {
          const sessionId = localStorage.getItem('session_id');
          const hasValidSession = sessionId && sessionManager.getSession(sessionId, fingerprint);

          if (!hasValidSession) {
            const newSessionToken = getSecurityToken('session', userId);
            if (newSessionToken) {
              localStorage.setItem('session_id', newSessionToken);
            }
          }
        }
      });
    }

    performance.endOperation();
  }, [queueSecurityUpdate, getSecurityToken]);

  // Set up event listeners for inactivity monitoring
  useEffect(() => {
    if (!defaultConfig.accessibility.logoutOnInactivity) return

    const events = ['mousemove', 'mousedown', 'keypress', 'DOMMouseScroll', 'mousewheel', 'touchmove', 'MSPointerMove']
    
    events.forEach(event => {
      window.addEventListener(event, monitorInactivity)
    })
    
    monitorInactivity() // Start initial timer
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, monitorInactivity)
      })
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current)
      }
    }
  }, [])

  const value: SecurityContextType = {
    securityMiddleware,
    sessionManager,
    csrf,
    xss,
    refreshSecurity,
    // Accessibility-enhanced security features
    announceSecurityEvent,
    clearSensitiveData,
    handleSecurityTimeout,
    resetSecurityFocus,
    isSecureInputFocused,
    startSecureSession,
    endSecureSession,
    monitorInactivity,
    pauseInactivityMonitoring,
    resumeInactivityMonitoring
  }

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  )
}

export function useSecurity() {
  const context = useContext(SecurityContext)
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider')
  }
  return context
}
import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { SecurityMiddleware } from '../utils/securityMiddleware'
import { SessionManager } from '../utils/sessionManager'
import { CSRFProtection } from '../utils/csrfProtection'
import { XSSProtection } from '../utils/xssProtection'
import { encryptData, decryptData } from '../utils/securityUtils'
import { useA11y } from './A11yContext'
import { useDebounce } from '../hooks/useDebounce'
import { useSecurityPerformance } from '../hooks/useSecurityPerformance'
import { SecurityTokenCache } from '../utils/SecurityTokenCache'

interface CachedOperation<T> {
  result: T
  timestamp: number
  expiry: number
}

interface PerformanceConfig {
  tokenCacheTTL: number
  operationCacheTTL: number
  batchDelay: number
  highFrequencyDebounce: number
  maxBatchSize: number
  cleanupInterval: number
  metricsEnabled: boolean
}

const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  tokenCacheTTL: 300000, // 5 minutes
  operationCacheTTL: 60000, // 1 minute
  batchDelay: 100, // 100ms
  highFrequencyDebounce: 250, // 250ms
  maxBatchSize: 50,
  cleanupInterval: 300000, // 5 minutes
  metricsEnabled: process.env.NODE_ENV === 'development'
}

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

export function SecurityProvider({ 
  children,
  performanceConfig = DEFAULT_PERFORMANCE_CONFIG 
}: { 
  children: React.ReactNode
  performanceConfig?: Partial<PerformanceConfig>
}) {
  // Initialize security performance monitoring
  const { 
    metrics,
    queueOperation,
    trackOperation,
    cleanup: cleanupPerformance
  } = useSecurityPerformance({
    componentName: 'SecurityProvider',
    threshold: 100,
    enableMemoryMetrics: performanceConfig.metricsEnabled,
    batchSize: performanceConfig.maxBatchSize,
    batchDelay: performanceConfig.batchDelay
  })

  // Initialize security services with performance tracking
  const services = useMemo(() => {
    metrics.startOperation('initializeSecurityServices');
    
    const middleware = new SecurityMiddleware(defaultConfig);
    const manager = new SessionManager();
    const csrfProtection = new CSRFProtection();
    const xssProtection = new XSSProtection();
    const cache = new SecurityTokenCache(performanceConfig.tokenCacheTTL);
    
    metrics.endOperation();
    
    return {
      securityMiddleware: middleware,
      sessionManager: manager,
      csrf: csrfProtection,
      xss: xssProtection,
      tokenCache: cache
    };
  }, [metrics]);

  // Extract services
  const securityMiddleware = services.securityMiddleware;
  const sessionManager = services.sessionManager;
  const csrf = services.csrf;
  const xss = services.xss;
  const tokenCache = services.tokenCache;
  
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
  
  // Clear sensitive data from forms and state with performance tracking
  const clearSensitiveData = () => {
    metrics.startOperation('clearSensitiveData');
    // Clear form fields with sensitive data
    const sensitiveInputs = document.querySelectorAll('input[type="password"], input[data-sensitive="true"]');
    Array.from(sensitiveInputs).forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.value = '';
      }
    });
    
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
  
  // Optimized inactivity monitoring with debounce
  const debouncedInactivityCheck = useDebounce((timestamp: number) => {
    performance.startOperation('inactivityCheck');
    
    if (inactivityTimer.current) {
      window.clearTimeout(inactivityTimer.current);
    }
    
    if (!inactivityPaused.current && defaultConfig.accessibility.logoutOnInactivity) {
      // Calculate remaining time based on last activity
      const remainingTime = Math.max(
        0,
        defaultConfig.accessibility.inactivityTimeout - (Date.now() - timestamp)
      );

      inactivityTimer.current = window.setTimeout(
        handleSecurityTimeout,
        remainingTime
      );
    }
    
    performance.endOperation();
  }, 1000); // Debounce for 1 second

  // Monitor inactivity with timestamp tracking
  const monitorInactivity = useCallback(() => {
    const timestamp = Date.now();
    debouncedInactivityCheck(timestamp);
  }, [debouncedInactivityCheck]);
  
  // Optimized pause inactivity monitoring
  const pauseInactivityMonitoring = useCallback(() => {
    performance.startOperation('pauseInactivity');
    
    inactivityPaused.current = true;
    if (inactivityTimer.current) {
      window.clearTimeout(inactivityTimer.current);
    }
    
    if (defaultConfig.accessibility.sessionAlerts) {
      queueSecurityUpdate(async () => {
        announceSecurityEvent('Security timeout paused');
      });
    }
    
    performance.endOperation();
  }, []);
  
  // Optimized resume inactivity monitoring
  const resumeInactivityMonitoring = useCallback(() => {
    performance.startOperation('resumeInactivity');
    
    inactivityPaused.current = false;
    monitorInactivity();
    
    if (defaultConfig.accessibility.sessionAlerts) {
      queueSecurityUpdate(async () => {
        announceSecurityEvent('Security timeout resumed');
      });
    }
    
    performance.endOperation();
  }, [monitorInactivity]);

  // Set up optimized security maintenance
  useEffect(() => {
    metrics.startOperation('setupMaintenanceInterval');
    
    let isRunningMaintenance = false;
    const performMaintenance = async () => {
      if (isRunningMaintenance) return;
      
      try {
        isRunningMaintenance = true;
        metrics.startOperation('securityMaintenance');
        
        // Queue maintenance tasks
        const tasks = [];
        
        // Session cleanup if available
        if (typeof sessionManager.cleanup === 'function') {
          tasks.push(queueOperation(() => sessionManager.cleanup()));
        }
        
        // CSRF token cleanup
        tasks.push(queueOperation(() => csrf.clearExpiredTokens()));
        
        // Security middleware cleanup if available
        if (typeof securityMiddleware.cleanup === 'function') {
          tasks.push(queueOperation(() => securityMiddleware.cleanup()));
        }
        
        // Token cache cleanup
        tasks.push(queueOperation(async () => {
          services.tokenCache.cleanup();
        }));
        
        await Promise.all(tasks);
        metrics.endOperation();
      } finally {
        isRunningMaintenance = false;
      }
    };

    const maintenanceInterval = setInterval(
      performMaintenance,
      performanceConfig.cleanupInterval || DEFAULT_PERFORMANCE_CONFIG.cleanupInterval
    );

    // Initial maintenance
    performMaintenance();

    return () => {
      clearInterval(maintenanceInterval);
      metrics.startOperation('cleanupMaintenance');
      // Final cleanup
      void performMaintenance();
      metrics.endOperation();
    };
  }, [sessionManager, csrf, securityMiddleware, metrics]);

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

  // Event listener management with cleanup and performance tracking
  useEffect(() => {
    if (!defaultConfig.accessibility.logoutOnInactivity) return;
    
    performance.startOperation('setupEventListeners');
    
    // Map of events to their throttled/debounced handlers
    const eventHandlers = new Map([
      ['keydown', monitorInactivity],
      ['mousedown', monitorInactivity],
      ['mousemove', useDebounce(monitorInactivity, 250)], // Debounce high-frequency events
      ['wheel', useDebounce(monitorInactivity, 250)],
      ['touchstart', monitorInactivity],
      ['touchmove', useDebounce(monitorInactivity, 250)],
      ['focus', monitorInactivity]
    ]);
    
    // Batch add event listeners
    queueSecurityUpdate(async () => {
      for (const [event, handler] of eventHandlers.entries()) {
        window.addEventListener(event, handler, { passive: true });
      }
    });
    
    monitorInactivity(); // Start initial timer
    performance.endOperation();
    
    // Cleanup function
    return () => {
      performance.startOperation('cleanupEventListeners');
      
      // Batch remove event listeners
      for (const [event, handler] of eventHandlers.entries()) {
        window.removeEventListener(event, handler);
      }
      
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
      }
      
      if (batchTimeout.current) {
        window.clearTimeout(batchTimeout.current);
      }
      
      performance.endOperation();
    };
  }, [monitorInactivity]);

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
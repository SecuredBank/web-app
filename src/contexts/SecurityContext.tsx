import React, { createContext, useContext, useEffect, useRef } from 'react'
import { SecurityMiddleware } from '../utils/securityMiddleware'
import { SessionManager } from '../utils/sessionManager'
import { CSRFProtection } from '../utils/csrfProtection'
import { XSSProtection } from '../utils/xssProtection'
import { encryptData, decryptData } from '../utils/securityUtils'

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
}

interface SecurityContextType {
  securityMiddleware: SecurityMiddleware
  sessionManager: SessionManager
  csrf: CSRFProtection
  xss: XSSProtection
  refreshSecurity: () => Promise<void>
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
}

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  // Initialize security features
  const securityMiddleware = useRef(new SecurityMiddleware(defaultConfig)).current
  const sessionManager = useRef(new SessionManager()).current
  const csrf = useRef(new CSRFProtection()).current
  const xss = useRef(new XSSProtection()).current

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
      const browserFingerprint = generateBrowserFingerprint()
      localStorage.setItem('device_fingerprint', browserFingerprint)
    } catch (error) {
      console.error('Failed to generate device fingerprint:', error)
    }
  }, [])

  // Set up CSP and security headers
  useEffect(() => {
    const nonce = generateCSPNonce()
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
    document.head.appendChild(meta)    return () => {
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

  // Function to refresh security context
  const refreshSecurity = async () => {
    const userId = localStorage.getItem('user_id')
    if (userId) {
      // Generate new CSRF token
      const newToken = csrf.generateToken(userId)
      localStorage.setItem('csrf_token', newToken)

      // Create new session if needed
      const fingerprint = localStorage.getItem('device_fingerprint')
      if (fingerprint && !sessionManager.getSession(localStorage.getItem('session_id') || '', fingerprint)) {
        const session = sessionManager.createSession(userId, fingerprint)
        localStorage.setItem('session_id', session.id)
      }
    }
  }

  const value = {
    securityMiddleware,
    sessionManager,
    csrf,
    xss,
    refreshSecurity
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
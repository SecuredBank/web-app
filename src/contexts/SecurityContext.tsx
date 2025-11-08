import React, { createContext, useContext, useEffect, useRef } from 'react'
import { SecurityMiddleware } from '../utils/securityMiddleware'
import { SessionManager } from '../utils/sessionManager'
import { CSRFProtection } from '../utils/csrfProtection'
import { XSSProtection } from '../utils/xssProtection'

interface SecurityContextType {
  securityMiddleware: SecurityMiddleware
  sessionManager: SessionManager
  csrf: CSRFProtection
  xss: XSSProtection
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  // Initialize security features
  const securityMiddleware = useRef(new SecurityMiddleware()).current
  const sessionManager = useRef(new SessionManager()).current
  const csrf = useRef(new CSRFProtection()).current
  const xss = useRef(new XSSProtection()).current

  // Set up regular security maintenance
  useEffect(() => {
    const maintenanceInterval = setInterval(() => {
      // Clean up expired sessions and tokens
      sessionManager.maintenance()
      csrf.clearExpiredTokens()
      securityMiddleware.cleanup()
    }, 5 * 60 * 1000) // Run every 5 minutes

    return () => clearInterval(maintenanceInterval)
  }, [sessionManager, csrf, securityMiddleware])

  // Set up CSP nonce generation
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.httpEquiv = 'Content-Security-Policy'
    meta.content = `
      default-src 'self';
      script-src 'self' 'nonce-${csrf.generateToken("csp")}';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' https://api.securedbank.com;
      frame-ancestors 'none';
      form-action 'self';
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

  const value = {
    securityMiddleware,
    sessionManager,
    csrf,
    xss
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
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SecurityMiddleware } from '../utils/securityMiddleware'
import { CSRFProtection } from '../utils/csrfProtection'
import { XSSProtection } from '../utils/xssProtection'
import { SessionManager } from '../utils/sessionManager'

describe('Security Features', () => {
  let securityMiddleware: SecurityMiddleware
  let request: Request
  let response: Response

  beforeEach(() => {
    securityMiddleware = new SecurityMiddleware()
    request = new Request('https://api.example.com/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid.jwt.token',
      },
    })
    response = new Response(JSON.stringify({ data: 'test' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })

  describe('XSS Protection', () => {
    it('should sanitize malicious input', () => {
      const xss = new XSSProtection()
      const maliciousInput =
        '<script>alert("xss")</script><img src="x" onerror="alert(1)">'
      const sanitized = xss.sanitizeInput(maliciousInput)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('onerror')
    })

    it('should allow safe HTML', () => {
      const xss = new XSSProtection()
      const safeInput = '<p>Hello <strong>world</strong></p>'
      const sanitized = xss.sanitizeInput(safeInput)
      expect(sanitized).toBe(safeInput)
    })
  })

  describe('CSRF Protection', () => {
    it('should generate and validate CSRF tokens', () => {
      const csrf = new CSRFProtection()
      const userId = 'user123'
      const token = csrf.generateToken(userId)

      expect(token).toBeTruthy()
      expect(csrf.validateToken(userId, token)).toBe(true)
      expect(csrf.validateToken(userId, 'invalid-token')).toBe(false)
    })

    it('should clear expired tokens', () => {
      const csrf = new CSRFProtection()
      const userId = 'user123'
      const token = csrf.generateToken(userId)

      // Mock time passing
      vi.advanceTimersByTime(25 * 60 * 60 * 1000) // 25 hours

      csrf.clearExpiredTokens()
      expect(csrf.validateToken(userId, token)).toBe(false)
    })
  })

  describe('Session Management', () => {
    it('should create and validate sessions', () => {
      const sessionManager = new SessionManager()
      const userId = 'user123'
      const fingerprint = 'device123'

      const session = sessionManager.createSession(userId, fingerprint)
      expect(session).toBeTruthy()
      expect(session.userId).toBe(userId)

      const validatedSession = sessionManager.getSession(
        session.id,
        fingerprint
      )
      expect(validatedSession).toBeTruthy()
    })

    it('should detect session hijacking attempts', () => {
      const sessionManager = new SessionManager()
      const userId = 'user123'
      const fingerprint1 = 'device123'
      const fingerprint2 = 'different-device'

      const session = sessionManager.createSession(userId, fingerprint1)
      const validatedSession = sessionManager.getSession(
        session.id,
        fingerprint2
      )
      expect(validatedSession).toBeNull()
    })
  })

  describe('Security Middleware', () => {
    it('should preprocess requests', async () => {
      const processedRequest =
        await securityMiddleware.preProcessRequest(request)
      const headers = Object.fromEntries(processedRequest.headers.entries())

      expect(headers['X-CSRF-Token']).toBeTruthy()
    })

    it('should validate requests', () => {
      expect(() => {
        securityMiddleware.validateRequest(request)
      }).not.toThrow()

      const invalidRequest = new Request('https://api.example.com/data', {
        method: 'POST',
      })

      expect(() => {
        securityMiddleware.validateRequest(invalidRequest)
      }).toThrow()
    })

    it('should prevent brute force attacks', async () => {
      const loginRequest = new Request(
        'https://api.example.com/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrong',
          }),
        }
      )

      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await securityMiddleware.preProcessRequest(loginRequest)
      }

      // The next attempt should be blocked
      await expect(
        securityMiddleware.preProcessRequest(loginRequest)
      ).rejects.toThrow('Too many login attempts')
    })
  })

  describe('Man-in-the-Middle Protection', () => {
    it('should enforce secure headers', async () => {
      const processedRequest =
        await securityMiddleware.preProcessRequest(request)
      const headers = Object.fromEntries(processedRequest.headers.entries())

      expect(headers['Content-Security-Policy']).toBeTruthy()
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['X-Frame-Options']).toBe('DENY')
    })
  })
})


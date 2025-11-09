import { CSRFProtection } from './csrfProtection'
import { XSSProtection } from './xssProtection'
import { SessionManager } from './sessionManager'
import { validateTokenExpiry } from './securityUtils'

export interface SecurityConfig {
  csrfProtection?: boolean
  xssProtection?: boolean
  sessionManagement?: boolean
  maxLoginAttempts?: number
  loginAttemptWindow?: number
}

export class SecurityMiddleware {
  private csrf: CSRFProtection
  private xss: XSSProtection
  private sessionManager: SessionManager
  private loginAttempts: Map<string, { count: number; timestamp: number }>
  private config: SecurityConfig

  constructor(config: SecurityConfig = {}) {
    this.config = {
      csrfProtection: true,
      xssProtection: true,
      sessionManagement: true,
      maxLoginAttempts: 5,
      loginAttemptWindow: 15 * 60 * 1000, // 15 minutes
      ...config,
    }

    this.csrf = new CSRFProtection()
    this.xss = new XSSProtection()
    this.sessionManager = new SessionManager()
    this.loginAttempts = new Map()
  }

  // Request preprocessing
  async preProcessRequest(request: Request): Promise<Request> {
    const modifiedRequest = request.clone()
    const url = new URL(request.url)

    // Track login attempts
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      const body = await request.json()
      const identifier = body.email || body.username
      if (!this.checkLoginAttempts(identifier)) {
        throw new Error('Too many login attempts. Please try again later.')
      }
    }

    // Add CSRF token for non-GET requests
    if (this.config.csrfProtection && request.method !== 'GET') {
      const token = this.csrf.generateToken(this.getUserId(request))
      modifiedRequest.headers.set('X-CSRF-Token', token)
    }

    // Sanitize request body for XSS
    if (this.config.xssProtection && request.body) {
      const body = await request.json()
      const sanitizedBody = this.xss.sanitizeProps(body)
      const newRequest = new Request(request.url, {
        ...request,
        body: JSON.stringify(sanitizedBody),
      })
      return newRequest
    }

    return modifiedRequest
  }

  // Response preprocessing
  async preProcessResponse(response: Response): Promise<Response> {
    // Clone the response to read and modify
    const clonedResponse = response.clone()
    const body = await clonedResponse.json()

    // Sanitize response data
    if (this.config.xssProtection) {
      const sanitizedBody = this.sanitizeResponseData(body)
      return new Response(JSON.stringify(sanitizedBody), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }

    return response
  }

  // Security validation
  validateRequest(request: Request): void {
    const url = new URL(request.url)

    // Validate CSRF token
    if (this.config.csrfProtection && request.method !== 'GET') {
      const token = request.headers.get('X-CSRF-Token')
      if (!token || !this.csrf.validateToken(this.getUserId(request), token)) {
        throw new Error('Invalid or missing CSRF token')
      }
    }

    // Validate session
    if (this.config.sessionManagement) {
      const sessionId = this.getSessionId(request)
      const fingerprint = this.getFingerprint(request)

      if (
        !sessionId ||
        !this.sessionManager.getSession(sessionId, fingerprint)
      ) {
        throw new Error('Invalid session')
      }
    }

    // Validate authentication token
    if (this.requiresAuth(url.pathname)) {
      const token = this.getAuthToken(request)
      if (!token || !validateTokenExpiry(token)) {
        throw new Error('Invalid or expired authentication token')
      }
    }
  }

  private sanitizeResponseData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponseData(item))
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeResponseData(value)
      }
      return sanitized
    }
    if (typeof data === 'string') {
      return this.xss.sanitizeInput(data)
    }
    return data
  }

  private checkLoginAttempts(identifier: string): boolean {
    const now = Date.now()
    const attempt = this.loginAttempts.get(identifier)

    if (!attempt) {
      this.loginAttempts.set(identifier, { count: 1, timestamp: now })
      return true
    }

    // Reset if window has passed
    if (now - attempt.timestamp > (this.config.loginAttemptWindow || 0)) {
      this.loginAttempts.set(identifier, { count: 1, timestamp: now })
      return true
    }

    // Increment attempts
    attempt.count++
    this.loginAttempts.set(identifier, attempt)

    return attempt.count <= (this.config.maxLoginAttempts || 5)
  }

  private getUserId(request: Request): string {
    // Implementation depends on your authentication strategy
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return ''

    try {
      const token = authHeader.replace('Bearer ', '')
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub || payload.userId || ''
    } catch {
      return ''
    }
  }

  private getSessionId(request: Request): string | null {
    const cookies = request.headers.get('cookie')
    return this.sessionManager.parseSessionCookie(cookies || '')
  }

  private getFingerprint(request: Request): string {
    return request.headers.get('X-Device-Fingerprint') || ''
  }

  private getAuthToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization')
    return authHeader ? authHeader.replace('Bearer ', '') : null
  }

  private requiresAuth(pathname: string): boolean {
    // List of paths that require authentication
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
    ]
    return !publicPaths.includes(pathname)
  }

  // Cleanup methods
  cleanup(): void {
    // Clean up expired CSRF tokens
    this.csrf.clearExpiredTokens()

    // Clean up expired sessions
    this.sessionManager.maintenance()

    // Clean up login attempts
    const now = Date.now()
    for (const [identifier, attempt] of this.loginAttempts.entries()) {
      if (now - attempt.timestamp > (this.config.loginAttemptWindow || 0)) {
        this.loginAttempts.delete(identifier)
      }
    }
  }
}


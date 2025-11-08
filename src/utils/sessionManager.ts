import { encryptData, decryptData } from './securityUtils'

export interface SessionConfig {
  maxAge?: number
  renewThreshold?: number
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  domain?: string
  path?: string
}

export interface SessionData {
  id: string
  userId: string
  createdAt: number
  lastActivity: number
  expiresAt: number
  data: Record<string, any>
}

const defaultConfig: SessionConfig = {
  maxAge: 30 * 60 * 1000, // 30 minutes
  renewThreshold: 5 * 60 * 1000, // 5 minutes
  secure: true,
  sameSite: 'strict',
  path: '/',
}

export class SessionManager {
  private config: SessionConfig
  private sessions: Map<string, SessionData>
  private fingerprints: Map<string, Set<string>>

  constructor(config: SessionConfig = {}) {
    this.config = { ...defaultConfig, ...config }
    this.sessions = new Map()
    this.fingerprints = new Map()
  }

  createSession(
    userId: string,
    fingerprint: string,
    initialData: Record<string, any> = {}
  ): SessionData {
    const now = Date.now()
    const sessionId = this.generateSessionId()

    const session: SessionData = {
      id: sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + (this.config.maxAge || 0),
      data: initialData,
    }

    // Store session
    this.sessions.set(sessionId, session)

    // Track fingerprint
    if (!this.fingerprints.has(userId)) {
      this.fingerprints.set(userId, new Set())
    }
    this.fingerprints.get(userId)?.add(fingerprint)

    return session
  }

  getSession(sessionId: string, fingerprint: string): SessionData | null {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return null
    }

    // Validate session
    if (!this.validateSession(session, fingerprint)) {
      this.destroySession(sessionId)
      return null
    }

    // Update last activity
    session.lastActivity = Date.now()

    // Check if session needs renewal
    if (this.shouldRenewSession(session)) {
      this.renewSession(session)
    }

    return session
  }

  private validateSession(session: SessionData, fingerprint: string): boolean {
    const now = Date.now()

    // Check expiration
    if (now > session.expiresAt) {
      return false
    }

    // Verify fingerprint
    const userFingerprints = this.fingerprints.get(session.userId)
    if (!userFingerprints?.has(fingerprint)) {
      return false
    }

    // Validate inactivity
    const inactiveTime = now - session.lastActivity
    if (inactiveTime > (this.config.maxAge || 0)) {
      return false
    }

    return true
  }

  private shouldRenewSession(session: SessionData): boolean {
    const now = Date.now()
    const threshold = this.config.renewThreshold || 0
    return session.expiresAt - now < threshold
  }

  private renewSession(session: SessionData): void {
    session.expiresAt = Date.now() + (this.config.maxAge || 0)
  }

  destroySession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      this.sessions.delete(sessionId)

      // Clean up fingerprints
      const userFingerprints = this.fingerprints.get(session.userId)
      if (userFingerprints) {
        // We don't delete the fingerprint as it might be used by other active sessions
        // It will be cleaned up during maintenance
      }
    }
  }

  destroyAllUserSessions(userId: string): void {
    // Find and destroy all sessions for this user
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.destroySession(sessionId)
      }
    }

    // Clean up fingerprints
    this.fingerprints.delete(userId)
  }

  maintenance(): void {
    const now = Date.now()

    // Clean expired sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (
        now > session.expiresAt ||
        now - session.lastActivity > (this.config.maxAge || 0)
      ) {
        this.destroySession(sessionId)
      }
    }

    // Clean up unused fingerprints
    for (const [userId, fingerprints] of this.fingerprints.entries()) {
      const hasActiveSessions = Array.from(this.sessions.values()).some(
        session => session.userId === userId
      )

      if (!hasActiveSessions) {
        this.fingerprints.delete(userId)
      }
    }
  }

  private generateSessionId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  getCookieString(sessionId: string): string {
    const { secure, sameSite, domain, path } = this.config
    const parts = [`session=${encryptData(sessionId)}`]

    parts.push('HttpOnly')
    if (secure) parts.push('Secure')
    if (sameSite) parts.push(`SameSite=${sameSite}`)
    if (domain) parts.push(`Domain=${domain}`)
    if (path) parts.push(`Path=${path}`)

    return parts.join('; ')
  }

  parseSessionCookie(cookie: string): string | null {
    const match = cookie.match(/session=([^;]+)/)
    if (!match) return null

    try {
      return decryptData(match[1])
    } catch {
      return null
    }
  }
}

import { generateNonce } from './securityUtils'

export interface CSRFConfig {
  cookieName?: string
  headerName?: string
  cookieOptions?: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    path?: string
  }
}

const defaultConfig: CSRFConfig = {
  cookieName: 'XSRF-TOKEN',
  headerName: 'X-XSRF-TOKEN',
  cookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
  },
}

export class CSRFProtection {
  private config: CSRFConfig
  private tokens: Map<string, { token: string; expires: number }>

  constructor(config: CSRFConfig = {}) {
    this.config = { ...defaultConfig, ...config }
    this.tokens = new Map()
  }

  generateToken(userId: string): string {
    const token = generateNonce()
    const expires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    this.tokens.set(userId, { token, expires })
    return token
  }

  validateToken(userId: string, token: string): boolean {
    const storedData = this.tokens.get(userId)

    if (!storedData) {
      return false
    }

    if (Date.now() > storedData.expires) {
      this.tokens.delete(userId)
      return false
    }

    return storedData.token === token
  }

  clearExpiredTokens(): void {
    const now = Date.now()
    for (const [userId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(userId)
      }
    }
  }

  getCookieString(token: string): string {
    const { cookieName, cookieOptions } = this.config
    const parts = [`${cookieName}=${token}`]

    if (cookieOptions?.httpOnly) parts.push('HttpOnly')
    if (cookieOptions?.secure) parts.push('Secure')
    if (cookieOptions?.sameSite)
      parts.push(`SameSite=${cookieOptions.sameSite}`)
    if (cookieOptions?.path) parts.push(`Path=${cookieOptions.path}`)

    return parts.join('; ')
  }
}

interface CachedToken {
  token: string
  expiry: number
  type: string
}

class SecurityTokenCache {
  private cache: Map<string, CachedToken>
  private readonly defaultTTL: number

  constructor(defaultTTL = 300000) {
    // 5 minutes default TTL
    this.cache = new Map()
    this.defaultTTL = defaultTTL
  }

  set(key: string, token: string, type: string, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { token, expiry, type })

    // Schedule cleanup
    setTimeout(() => {
      if (this.has(key)) {
        this.delete(key)
      }
    }, ttl || this.defaultTTL)
  }

  get(key: string): string | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() > cached.expiry) {
      this.delete(key)
      return null
    }

    return cached.token
  }

  has(key: string): boolean {
    const cached = this.cache.get(key)
    if (!cached) return false

    if (Date.now() > cached.expiry) {
      this.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.delete(key)
      }
    }
  }

  getTokensByType(type: string): string[] {
    const tokens: string[] = []
    for (const [_, value] of this.cache.entries()) {
      if (value.type === type && Date.now() <= value.expiry) {
        tokens.push(value.token)
      }
    }
    return tokens
  }
}

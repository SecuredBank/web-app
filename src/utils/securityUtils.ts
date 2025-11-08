import { AES, enc } from 'crypto-js'

// Security Constants
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_ATTEMPT_TIMEOUT = 15 * 60 * 1000 // 15 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const SENSITIVE_DATA_FIELDS = ['password', 'token', 'secret', 'key', 'auth']

// In development, use a default key. In production, require environment variable
const ENCRYPTION_KEY =
  process.env.NODE_ENV === 'production'
    ? process.env.VITE_TOKEN_ENCRYPTION_KEY || ''
    : 'default-secure-key-change-in-production'

// Data Security Functions
export const encryptData = (data: string): string => {
  return AES.encrypt(data, ENCRYPTION_KEY).toString()
}

export const decryptData = (encryptedData: string): string => {
  const bytes = AES.decrypt(encryptedData, ENCRYPTION_KEY)
  return bytes.toString(enc.Utf8)
}

export const sanitizeData = <T extends Record<string, any>>(
  data: T
): Partial<T> => {
  const sanitized = { ...data }
  Object.keys(sanitized).forEach(key => {
    if (
      SENSITIVE_DATA_FIELDS.some(field => key.toLowerCase().includes(field))
    ) {
      delete sanitized[key]
    }
  })
  return sanitized
}

// Session Security
export interface LoginAttempt {
  count: number
  timeout: number
}

export interface LoginAttemptResult {
  allowed: boolean
  remainingAttempts: number
}

export const validateSessionTimeout = (
  lastActivityTime: Date | null
): boolean => {
  if (!lastActivityTime) return false
  return Date.now() - lastActivityTime.getTime() < SESSION_TIMEOUT
}

export const handleLoginAttempt = (
  userId: string,
  success: boolean,
  loginAttempts: Map<string, LoginAttempt>
): LoginAttemptResult => {
  const now = Date.now()
  const userAttempts = loginAttempts.get(userId) || { count: 0, timeout: 0 }

  if (userAttempts.timeout > now) {
    return { allowed: false, remainingAttempts: 0 }
  }

  if (userAttempts.timeout && userAttempts.timeout < now) {
    userAttempts.count = 0
    userAttempts.timeout = 0
  }

  if (success) {
    loginAttempts.set(userId, { count: 0, timeout: 0 })
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS }
  } else {
    const newCount = userAttempts.count + 1
    const remaining = MAX_LOGIN_ATTEMPTS - newCount

    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      loginAttempts.set(userId, {
        count: newCount,
        timeout: now + LOGIN_ATTEMPT_TIMEOUT,
      })
      return { allowed: false, remainingAttempts: 0 }
    }

    loginAttempts.set(userId, { count: newCount, timeout: 0 })
    return { allowed: true, remainingAttempts: remaining }
  }
}

// Security Headers and CORS
export const createSecureHeaders = (token?: string): Headers => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  })

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return headers
}

export const isValidOrigin = (origin: string): boolean => {
  const allowedOrigins = [
    process.env.VITE_APP_URL,
    'https://api.securedbank.com',
    'https://admin.securedbank.com',
  ].filter(Boolean)

  return allowedOrigins.includes(origin)
}

// Nonce Generation for CSP
export const generateNonce = (): string => {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Password Policy
export const validatePasswordStrength = (password: string): boolean => {
  const minLength = 12
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChars
  )
}

// JWT Token Validation
export const validateTokenExpiry = (token: string): boolean => {
  try {
    const [, payload] = token.split('.')
    const decodedPayload = JSON.parse(atob(payload))
    const expiryTime = decodedPayload.exp * 1000 // Convert to milliseconds

    return Date.now() < expiryTime
  } catch {
    return false
  }
}

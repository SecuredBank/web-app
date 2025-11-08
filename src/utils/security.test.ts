import { describe, it, expect, beforeEach } from 'vitest'
import {
  encryptData,
  decryptData,
  sanitizeData,
  handleLoginAttempt,
  validateSessionTimeout,
  validateTokenExpiry,
  validatePasswordStrength,
  createSecureHeaders,
  isValidOrigin,
  generateNonce,
} from '../utils/securityUtils'

describe('Security Utils', () => {
  describe('Data Encryption', () => {
    const testData = 'sensitive-data'

    it('should encrypt and decrypt data correctly', () => {
      const encrypted = encryptData(testData)
      expect(encrypted).not.toBe(testData)
      const decrypted = decryptData(encrypted)
      expect(decrypted).toBe(testData)
    })

    it('should generate different ciphertexts for same plaintext', () => {
      const encrypted1 = encryptData(testData)
      const encrypted2 = encryptData(testData)
      expect(encrypted1).not.toBe(encrypted2)
    })
  })

  describe('Data Sanitization', () => {
    it('should remove sensitive fields', () => {
      const data = {
        username: 'user1',
        password: 'secret123',
        token: 'xyz789',
        email: 'user@example.com',
        authKey: '123456',
      }

      const sanitized = sanitizeData(data)
      expect(sanitized).not.toHaveProperty('password')
      expect(sanitized).not.toHaveProperty('token')
      expect(sanitized).not.toHaveProperty('authKey')
      expect(sanitized).toHaveProperty('username')
      expect(sanitized).toHaveProperty('email')
    })
  })

  describe('Login Attempts', () => {
    const userId = 'test-user'
    let loginAttempts: Map<string, { count: number; timeout: number }>

    beforeEach(() => {
      loginAttempts = new Map()
    })

    it('should track failed login attempts', () => {
      const result1 = handleLoginAttempt(userId, false, loginAttempts)
      expect(result1.allowed).toBe(true)
      expect(result1.remainingAttempts).toBe(4)

      const result2 = handleLoginAttempt(userId, false, loginAttempts)
      expect(result2.allowed).toBe(true)
      expect(result2.remainingAttempts).toBe(3)
    })

    it('should block after max attempts', () => {
      for (let i = 0; i < 5; i++) {
        handleLoginAttempt(userId, false, loginAttempts)
      }

      const result = handleLoginAttempt(userId, false, loginAttempts)
      expect(result.allowed).toBe(false)
      expect(result.remainingAttempts).toBe(0)
    })

    it('should reset attempts after successful login', () => {
      handleLoginAttempt(userId, false, loginAttempts)
      const result = handleLoginAttempt(userId, true, loginAttempts)
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(5)
    })
  })

  describe('Session Management', () => {
    it('should validate session timeout correctly', () => {
      const now = Date.now()
      expect(validateSessionTimeout(now)).toBe(true)
      expect(validateSessionTimeout(now - 31 * 60 * 1000)).toBe(false)
    })

    it('should validate token expiry', () => {
      const validToken =
        'header.' +
        btoa(
          JSON.stringify({
            exp: Math.floor(Date.now() / 1000) + 3600,
          })
        ) +
        '.signature'

      const expiredToken =
        'header.' +
        btoa(
          JSON.stringify({
            exp: Math.floor(Date.now() / 1000) - 3600,
          })
        ) +
        '.signature'

      expect(validateTokenExpiry(validToken)).toBe(true)
      expect(validateTokenExpiry(expiredToken)).toBe(false)
    })
  })

  describe('Password Validation', () => {
    it('should validate password strength', () => {
      expect(validatePasswordStrength('weak')).toBe(false)
      expect(validatePasswordStrength('Abcd123!')).toBe(false) // Too short
      expect(validatePasswordStrength('StrongP@ssw0rd123')).toBe(true)
      expect(validatePasswordStrength('NoSpecialChar123')).toBe(false)
      expect(validatePasswordStrength('no-upper-case-123!')).toBe(false)
      expect(validatePasswordStrength('NO-LOWER-CASE-123!')).toBe(false)
      expect(validatePasswordStrength('No-Numbers-Here!')).toBe(false)
    })
  })

  describe('Security Headers', () => {
    it('should create secure headers', () => {
      const headers = createSecureHeaders()
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(headers.get('X-Frame-Options')).toBe('DENY')
      expect(headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(headers.get('Referrer-Policy')).toBe(
        'strict-origin-when-cross-origin'
      )
    })

    it('should add authorization header when token provided', () => {
      const token = 'test-token'
      const headers = createSecureHeaders(token)
      expect(headers.get('Authorization')).toBe('Bearer test-token')
    })
  })

  describe('Origin Validation', () => {
    it('should validate allowed origins', () => {
      const validOrigins = [
        'https://api.securedbank.com',
        'https://admin.securedbank.com',
      ]

      validOrigins.forEach(origin => {
        expect(isValidOrigin(origin)).toBe(true)
      })

      expect(isValidOrigin('https://malicious-site.com')).toBe(false)
    })
  })

  describe('Nonce Generation', () => {
    it('should generate unique nonces', () => {
      const nonce1 = generateNonce()
      const nonce2 = generateNonce()
      expect(nonce1).not.toBe(nonce2)
      expect(nonce1).toMatch(/^[0-9a-f]{32}$/)
      expect(nonce2).toMatch(/^[0-9a-f]{32}$/)
    })
  })
})

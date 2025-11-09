import type {
  SecurityIncident,
  SecurityMetric,
  ComplianceReport,
} from '../types/security'
import { AES, enc } from 'crypto-js'

// Security Constants
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_ATTEMPT_TIMEOUT = 15 * 60 * 1000 // 15 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const SENSITIVE_DATA_FIELDS = ['password', 'token', 'secret', 'key', 'auth']

// In development, use a default key. In production, require environment variable
const TOKEN_ENCRYPTION_KEY =
  process.env.NODE_ENV === 'production'
    ? (import.meta.env as any).VITE_TOKEN_ENCRYPTION_KEY
    : 'default-secure-key-change-in-production'

// Data Security Functions
export const encryptData = (data: string): string => {
  return AES.encrypt(data, TOKEN_ENCRYPTION_KEY).toString()
}

export const decryptData = (encryptedData: string): string => {
  const bytes = AES.decrypt(encryptedData, TOKEN_ENCRYPTION_KEY)
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
export const validateSessionTimeout = (lastActivityTime: number): boolean => {
  return Date.now() - lastActivityTime < SESSION_TIMEOUT
}

export const handleLoginAttempt = (
  userId: string,
  success: boolean,
  loginAttempts: Map<string, { count: number; timeout: number }>
): { allowed: boolean; remainingAttempts: number } => {
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

// Security Headers
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

// Risk Assessment Functions
export function calculateRiskScore(incident: SecurityIncident): number {
  const severityWeight = {
    critical: 1.0,
    high: 0.8,
    medium: 0.6,
    low: 0.4,
  } as const

  const baseScore = severityWeight[incident.severity] * 100
  const ageInHours =
    (Date.now() - incident.createdAt.getTime()) / (1000 * 60 * 60)
  const timeWeight = Math.max(0.5, 1 - ageInHours / 168) // 168 hours = 1 week

  return Math.round(baseScore * timeWeight)
}

export function prioritizeIncidents(
  incidents: SecurityIncident[]
): SecurityIncident[] {
  const severityScore = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  } as const

  return incidents.sort((a, b) => {
    // Sort by severity first
    if (a.severity !== b.severity) {
      return severityScore[b.severity] - severityScore[a.severity]
    }

    // Then by status (open incidents first)
    if (a.status !== b.status) {
      const statusOrder = {
        open: 4,
        investigating: 3,
        resolved: 2,
        closed: 1,
      } as const
      return (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0)
    }

    // Finally by date
    return b.createdAt.getTime() - a.createdAt.getTime()
  })
}

export const calculateComplianceScore = (
  reports: ComplianceReport[]
): number => {
  if (!reports || !reports.length) return 0

  const weights = {
    pci: 0.3,
    gdpr: 0.3,
    sox: 0.2,
    hipaa: 0.2,
  } as const

  let totalScore = 0
  let totalWeight = 0

  reports.forEach(report => {
    const weight = weights[report.type] || 0
    totalScore += report.score * weight
    totalWeight += weight
  })

  return totalWeight ? Math.round((totalScore / totalWeight) * 100) / 100 : 0
}

export const aggregateSecurityMetrics = (
  metrics: SecurityMetric[]
): Record<string, number> => {
  return metrics.reduce(
    (acc, metric) => {
      acc[metric.name] = metric.value
      return acc
    },
    {} as Record<string, number>
  )
}

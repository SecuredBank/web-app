import { SecurityIncident, SecurityMetric, ComplianceReport } from '../types/security'
import { AES, enc } from 'crypto-js'

declare global {
  interface ImportMetaEnv {
    VITE_TOKEN_ENCRYPTION_KEY: string
    VITE_APP_URL: string
  }
}

// Security Constants
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_ATTEMPT_TIMEOUT = 15 * 60 * 1000 // 15 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const SENSITIVE_DATA_FIELDS = ['password', 'token', 'secret', 'key', 'auth']

// In development, use a default key. In production, require environment variable
const ENCRYPTION_KEY = process.env.NODE_ENV === 'production' 
  ? import.meta.env.VITE_TOKEN_ENCRYPTION_KEY 
  : 'default-secure-key-change-in-production'

// Data Security Functions
export const encryptData = (data: string): string => {
  return AES.encrypt(data, TOKEN_ENCRYPTION_KEY).toString()
}

export const decryptData = (encryptedData: string): string => {
  const bytes = AES.decrypt(encryptedData, TOKEN_ENCRYPTION_KEY)
  return bytes.toString(enc.Utf8)
}

export const sanitizeData = <T extends Record<string, any>>(data: T): Partial<T> => {
  const sanitized = { ...data }
  Object.keys(sanitized).forEach(key => {
    if (SENSITIVE_DATA_FIELDS.some(field => key.toLowerCase().includes(field))) {
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
        timeout: now + LOGIN_ATTEMPT_TIMEOUT
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
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  })

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return headers
}

export const isValidOrigin = (origin: string): boolean => {
  const allowedOrigins = [
    import.meta.env.VITE_APP_URL,
    'https://api.securedbank.com',
    'https://admin.securedbank.com'
  ].filter(Boolean)

  return allowedOrigins.includes(origin)
}

// Security Incident Management Functions
  const severityWeights = {
    critical: 1.0,
    high: 0.8,
    medium: 0.5,
    low: 0.2
  }

  const statusMultipliers = {
    open: 1.0,
    investigating: 0.8,
    resolved: 0.2,
    closed: 0.1
  }

  const baseScore = severityWeights[incident.severity] * 100
  const timeWeight = calculateTimeWeight(incident.createdAt)
  const statusMultiplier = statusMultipliers[incident.status]
  const impactMultiplier = calculateImpactMultiplier(incident)

  return baseScore * timeWeight * statusMultiplier * impactMultiplier
}

const calculateTimeWeight = (createdAt: Date): number => {
  const now = new Date()
  const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0.1, Math.min(1, 1 - (ageInDays / 30)))
}

const calculateImpactMultiplier = (incident: SecurityIncident): number => {
  const systemsImpact = Math.min(1, incident.impactedSystems.length / 10)
  const userImpact = Math.min(1, incident.affectedUsers / 1000)
  return (systemsImpact + userImpact) / 2
}

export const aggregateSecurityMetrics = (metrics: SecurityMetric[]): Record<string, number> => {
  return metrics.reduce((acc, metric) => {
    acc[metric.name] = metric.value
    return acc
  }, {} as Record<string, number>)
}

export const calculateComplianceScore = (reports: ComplianceReport[]): number => {
  if (reports.length === 0) return 0

  const weights = {
    pci: 0.4,
    gdpr: 0.3,
    sox: 0.2,
    hipaa: 0.1
  }

  const weightedScores = reports.map(report => {
    const weight = weights[report.type] || 0.1
    return report.score * weight
  })

  return weightedScores.reduce((sum, score) => sum + score, 0)
}

export const categorizeIncidents = (incidents: SecurityIncident[]): Record<string, SecurityIncident[]> => {
  return incidents.reduce((acc, incident) => {
    if (!acc[incident.category]) {
      acc[incident.category] = []
    }
    acc[incident.category].push(incident)
    return acc
  }, {} as Record<string, SecurityIncident[]>)
}

export const prioritizeIncidents = (incidents: SecurityIncident[]): SecurityIncident[] => {
  return [...incidents].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const statusOrder = { open: 4, investigating: 3, resolved: 2, closed: 1 }
    
    // Compare severity first
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity]
    }
    
    // Then compare status
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[b.status] - statusOrder[a.status]
    }
    
    // Finally compare by date
    return b.createdAt.getTime() - a.createdAt.getTime()
  })
}

export const validateIncidentData = (incident: Partial<SecurityIncident>): string[] => {
  const errors: string[] = []

  if (!incident.title?.trim()) {
    errors.push('Title is required')
  }

  if (!incident.description?.trim()) {
    errors.push('Description is required')
  }

  if (!incident.severity || !['critical', 'high', 'medium', 'low'].includes(incident.severity)) {
    errors.push('Valid severity level is required')
  }

  if (!incident.category) {
    errors.push('Incident category is required')
  }

  if (!Array.isArray(incident.impactedSystems) || incident.impactedSystems.length === 0) {
    errors.push('At least one impacted system must be specified')
  }

  return errors
}
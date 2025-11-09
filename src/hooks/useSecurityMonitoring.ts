import { useState, useEffect, useCallback } from 'react'
import { SecuritySeverity, SecurityEventType } from '../types/security'
import { monitoring } from '../services/monitoring'
import { useAuth } from '../contexts/AuthContext'

interface SecurityStatus {
  score: number
  lastCheck: Date | null
  threatLevel: SecuritySeverity
  recentEvents: Array<{
    type: SecurityEventType
    severity: SecuritySeverity
    message: string
    timestamp: number
  }>
}

export function useSecurityMonitoring() {
  const { state: authState } = useAuth()
  const [status, setStatus] = useState<SecurityStatus>({
    score: 100,
    lastCheck: null,
    threatLevel: 'low',
    recentEvents: [],
  })

  // Calculate threat level based on security events
  const calculateThreatLevel = useCallback(
    (events: SecurityStatus['recentEvents']): SecuritySeverity => {
      const recentEvents = events.filter(
        e => Date.now() - e.timestamp < 15 * 60 * 1000 // Last 15 minutes
      )

      const criticalCount = recentEvents.filter(
        e => e.severity === 'critical'
      ).length
      const highCount = recentEvents.filter(e => e.severity === 'high').length
      const mediumCount = recentEvents.filter(
        e => e.severity === 'medium'
      ).length

      if (criticalCount > 0) return 'critical'
      if (highCount >= 3) return 'high'
      if (highCount > 0 || mediumCount >= 3) return 'medium'
      return 'low'
    },
    []
  )

  // Log security event
  const logSecurityEvent = useCallback(
    async (
      type: SecurityEventType,
      severity: SecuritySeverity,
      message: string,
      data?: Record<string, any>
    ) => {
      if (!authState.isAuthenticated) return

      monitoring.security.logSecurityEvent({
        type,
        severity,
        timestamp: Date.now(),
        data: {
          userId: authState.user?.id,
          deviceFingerprint: authState.deviceFingerprint,
          message,
          ...data,
        },
      })

      // Update local security status
      setStatus(prev => {
        const newEvents = [
          { type, severity, message, timestamp: Date.now() },
          ...prev.recentEvents,
        ].slice(0, 10) // Keep last 10 events

        return {
          ...prev,
          lastCheck: new Date(),
          threatLevel: calculateThreatLevel(newEvents),
          recentEvents: newEvents,
        }
      })
    },
    [authState, calculateThreatLevel]
  )

  // Check security status periodically
  useEffect(() => {
    if (!authState.isAuthenticated) return

    const checkSecurity = async () => {
      try {
        // Get current security score
        const score = monitoring.security.getSecurityScore()

        // Get recent events
        const events = monitoring.security.getSecurityEvents(10)

        setStatus(prev => ({
          ...prev,
          score,
          lastCheck: new Date(),
          threatLevel: calculateThreatLevel(prev.recentEvents),
        }))
      } catch (error) {
        console.error('Security check failed:', error)
      }
    }

    // Initial check
    checkSecurity()

    // Setup interval for continuous monitoring
    const interval = setInterval(checkSecurity, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [authState.isAuthenticated, calculateThreatLevel])

  return {
    securityStatus: status,
    logSecurityEvent,
  }
}


import type {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
} from '../types/security'

export interface SecurityMonitoring {
  logSecurityEvent: (event: SecurityEvent) => void
  getSecurityScore: () => number
  getSecurityEvents: (limit?: number) => SecurityEvent[]
  clearSecurityEvents: () => void
}

class SecurityMonitoringService implements SecurityMonitoring {
  private events: SecurityEvent[] = []
  private readonly MAX_EVENTS = 1000
  private securityScore = 100

  // Log a security event and update security score
  logSecurityEvent(event: SecurityEvent): void {
    // Add event to history
    this.events.unshift(event)

    // Trim event history if needed
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS)
    }

    // Update security score based on event severity
    const severityScores = {
      low: -5,
      medium: -10,
      high: -20,
      critical: -30,
    }

    const scoreChange = severityScores[event.severity] || 0
    this.securityScore = Math.max(
      0,
      Math.min(100, this.securityScore + scoreChange)
    )

    // Log event to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Security Event]', event)
    }
  }

  // Get current security score
  getSecurityScore(): number {
    return this.securityScore
  }

  // Get security events with optional limit
  getSecurityEvents(limit?: number): SecurityEvent[] {
    return limit ? this.events.slice(0, limit) : this.events
  }

  // Clear security events and reset score
  clearSecurityEvents(): void {
    this.events = []
    this.securityScore = 100
  }
}

// Create monitoring instance
export const monitoring = {
  security: new SecurityMonitoringService(),
}

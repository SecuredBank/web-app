// Security Types
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'SECURITY_VIOLATION'
  | 'SESSION_EXPIRED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'BRUTE_FORCE_ATTEMPT'
  | 'XSS_ATTEMPT'
  | 'CSRF_VIOLATION'
  | 'INVALID_TOKEN'
  | 'DEVICE_CHANGE'
  | 'TOKEN_REFRESH'
  | 'USER_LOGOUT'
  | 'SECURITY_ALERT'

// Security Event Interface
export interface SecurityEvent {
  type: SecurityEventType
  timestamp: number
  severity: SecuritySeverity
  data?: Record<string, any>
}

// Legacy Security Types
export interface SecurityMetric {
  id: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercentage: number
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

export interface SecurityIncident {
  id: string
  title: string
  description: string
  severity: SecuritySeverity
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  assignedTo?: string
  category: IncidentCategory
  impactedSystems: string[]
  affectedUsers: number
  timeline: IncidentTimelineEvent[]
  tags: string[]
}

export type IncidentCategory =
  | 'data_breach'
  | 'unauthorized_access'
  | 'malware'
  | 'phishing'
  | 'ddos'
  | 'system_failure'
  | 'insider_threat'
  | 'policy_violation'

export interface IncidentTimelineEvent {
  id: string
  timestamp: Date
  type: 'detection' | 'investigation' | 'action' | 'resolution'
  description: string
  performedBy: string
  evidence?: Evidence[]
}

export interface Evidence {
  id: string
  type: 'log' | 'screenshot' | 'file' | 'network_capture'
  url: string
  description: string
  metadata: Record<string, any>
}

export interface SecurityAuditLog {
  id: string
  timestamp: Date
  action: string
  actor: {
    id: string
    name: string
    role: string
  }
  resource: string
  details: Record<string, any>
  status: 'success' | 'failure'
  ipAddress: string
  userAgent: string
  location?: {
    country: string
    city: string
    coordinates: [number, number]
  }
}

export interface ComplianceReport {
  id: string
  type: 'pci' | 'gdpr' | 'sox' | 'hipaa'
  status: 'compliant' | 'non_compliant' | 'partially_compliant'
  score: number
  scanDate: Date
  nextScanDate: Date
  findings: ComplianceFinding[]
  recommendations: string[]
}

export interface ComplianceFinding {
  id: string
  control: string
  description: string
  status: 'pass' | 'fail' | 'warning'
  evidence: string
  remediation?: string
  dueDate?: Date
  assignedTo?: string
}


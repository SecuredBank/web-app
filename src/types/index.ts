// User and Authentication Types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  lastLogin?: Date
  isActive: boolean
  permissions: Permission[]
}

export type UserRole = 'admin' | 'security_officer' | 'analyst' | 'viewer'

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
}

// Security Types
export interface SecurityAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  timestamp: Date
  source: string
  status: AlertStatus
  assignedTo?: string
  resolvedAt?: Date
  metadata?: Record<string, any>
}

export type AlertType = 
  | 'login_anomaly'
  | 'suspicious_transaction'
  | 'data_breach'
  | 'malware_detected'
  | 'unauthorized_access'
  | 'system_intrusion'
  | 'phishing_attempt'
  | 'ddos_attack'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AlertStatus = 'open' | 'investigating' | 'resolved' | 'false_positive'

// Dashboard Types
export interface DashboardStats {
  totalAlerts: number
  criticalAlerts: number
  resolvedToday: number
  activeUsers: number
  systemHealth: number
  threatLevel: ThreatLevel
}

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityMetric {
  id: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change: number
  timestamp: Date
}

// Transaction Types
export interface Transaction {
  id: string
  amount: number
  currency: string
  type: TransactionType
  status: TransactionStatus
  fromAccount: string
  toAccount: string
  timestamp: Date
  description: string
  riskScore: number
  flagged: boolean
}

export type TransactionType = 'transfer' | 'deposit' | 'withdrawal' | 'payment' | 'refund'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

// Report Types
export interface Report {
  id: string
  title: string
  type: ReportType
  generatedAt: Date
  generatedBy: string
  data: ReportData
  format: 'pdf' | 'csv' | 'json'
}

export type ReportType = 
  | 'security_summary'
  | 'user_activity'
  | 'transaction_analysis'
  | 'threat_intelligence'
  | 'compliance_report'

export interface ReportData {
  period: {
    start: Date
    end: Date
  }
  metrics: SecurityMetric[]
  alerts: SecurityAlert[]
  summary: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  timestamp: Date
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form Types
export interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

export interface UserForm {
  name: string
  email: string
  role: UserRole
  isActive: boolean
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// Navigation Types
export interface NavItem {
  id: string
  label: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
}

// Chart Types
export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesData {
  timestamp: Date
  value: number
  label?: string
}

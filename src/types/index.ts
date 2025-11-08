import { ReactNode } from 'react'

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
  department?: string
  phoneNumber?: string
  mfaEnabled: boolean
  failedLoginAttempts: number
  lastPasswordChange: Date
  passwordExpiryDate: Date
  sessionTimeout: number
}

export type UserRole = 
  | 'admin' 
  | 'security_officer' 
  | 'analyst' 
  | 'viewer' 
  | 'auditor' 
  | 'risk_manager'

export interface Permission {
  id: string
  name: string
  resource: string
  action: PermissionAction
  conditions?: Record<string, any>
  grantedAt: Date
  grantedBy: string
  expiresAt?: Date
}

export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'manage' 
  | 'approve' 
  | 'reject'

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
  ipAddress?: string
  location?: GeoLocation
  deviceInfo?: DeviceInfo
  relatedAlerts?: string[]
  priority: number
  escalationLevel: number
  responseActions: ResponseAction[]
  auditTrail: AuditEvent[]
}

export interface GeoLocation {
  latitude: number
  longitude: number
  country: string
  city: string
  region: string
}

export interface DeviceInfo {
  id: string
  type: string
  os: string
  browser: string
  ip: string
  userAgent: string
  lastSeen: Date
  trusted: boolean
}

export interface ResponseAction {
  id: string
  type: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  timestamp: Date
  performedBy?: string
  result?: string
}

export interface AuditEvent {
  id: string
  timestamp: Date
  action: string
  performedBy: string
  details: Record<string, any>
  ipAddress: string
  success: boolean
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
  | 'privilege_escalation'
  | 'configuration_change'
  | 'firewall_breach'
  | 'data_exfiltration'
  | 'ransomware_detected'
  | 'api_abuse'
  | 'brute_force_attempt'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AlertStatus = 
  | 'open' 
  | 'investigating' 
  | 'resolved' 
  | 'false_positive' 
  | 'escalated'
  | 'pending_review'
  | 'mitigated'
  | 'remediated'

// Component Types
export interface BaseProps {
  className?: string
  children?: ReactNode
}

export interface ButtonProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
}

export interface InputProps extends BaseProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'
  label?: string
  placeholder?: string
  value?: string | number
  error?: string
  disabled?: boolean
  required?: boolean
  onChange?: (value: string) => void
}

export interface SelectProps<T> extends BaseProps {
  options: Array<{
    label: string
    value: T
    disabled?: boolean
  }>
  label?: string
  value?: T
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
  onChange?: (value: T) => void
}

export interface CardProps extends BaseProps {
  title?: string | ReactNode
  description?: string | ReactNode
  footer?: ReactNode
  headerAction?: ReactNode
}

export interface ModalProps extends BaseProps {
  isOpen: boolean
  onClose: () => void
  title?: string | ReactNode
  description?: string | ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface AlertProps extends BaseProps {
  title?: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  closable?: boolean
  onClose?: () => void
}

export interface ToastProps {
  title: string
  description?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

export interface TabsProps extends BaseProps {
  tabs: Array<{
    id: string
    label: string
    content: ReactNode
    disabled?: boolean
  }>
  defaultTab?: string
  onChange?: (tabId: string) => void
}

// Chart Types
export interface ChartData {
  label: string
  value: number
  color?: string
}

export interface LineChartProps extends BaseProps {
  data: Array<{
    date: Date | string
    value: number
    category?: string
  }>
  height?: number
  width?: number
  showLegend?: boolean
}

export interface BarChartProps extends BaseProps {
  data: ChartData[]
  height?: number
  width?: number
  showLegend?: boolean
  horizontal?: boolean
}

export interface PieChartProps extends BaseProps {
  data: ChartData[]
  height?: number
  width?: number
  showLegend?: boolean
  donut?: boolean
}

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

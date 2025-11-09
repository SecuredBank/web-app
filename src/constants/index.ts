// Application Constants
export const APP_NAME = 'SecuredBank'
export const APP_VERSION = '1.0.0'
export const APP_DESCRIPTION = 'Bank Cybersecurity Web Application'

// API Configuration
export const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://api.securedbank.com'
export const API_TIMEOUT = 30000 // 30 seconds

// Authentication
export const AUTH_TOKEN_KEY = 'auth_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'
export const USER_KEY = 'user'

// Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SECURITY: '/security',
  USERS: '/users',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SECURITY_OFFICER: 'security_officer',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
} as const

// Alert Severities
export const ALERT_SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

// Alert Types
export const ALERT_TYPES = {
  LOGIN_ANOMALY: 'login_anomaly',
  SUSPICIOUS_TRANSACTION: 'suspicious_transaction',
  DATA_BREACH: 'data_breach',
  MALWARE_DETECTED: 'malware_detected',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  SYSTEM_INTRUSION: 'system_intrusion',
  PHISHING_ATTEMPT: 'phishing_attempt',
  DDOS_ATTACK: 'ddos_attack',
} as const

// Alert Statuses
export const ALERT_STATUSES = {
  OPEN: 'open',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  FALSE_POSITIVE: 'false_positive',
} as const

// Transaction Types
export const TRANSACTION_TYPES = {
  TRANSFER: 'transfer',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  PAYMENT: 'payment',
  REFUND: 'refund',
} as const

// Transaction Statuses
export const TRANSACTION_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

// Report Types
export const REPORT_TYPES = {
  SECURITY_SUMMARY: 'security_summary',
  USER_ACTIVITY: 'user_activity',
  TRANSACTION_ANALYSIS: 'transaction_analysis',
  THREAT_INTELLIGENCE: 'threat_intelligence',
  COMPLIANCE_REPORT: 'compliance_report',
} as const

// Report Formats
export const REPORT_FORMATS = {
  PDF: 'pdf',
  CSV: 'csv',
  JSON: 'json',
} as const

// Theme Options
export const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM dd, yyyy',
  DATETIME: 'MM/dd/yyyy HH:mm',
  TIME: 'HH:mm',
} as const

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
} as const

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'theme',
  USER: 'user',
  SETTINGS: 'settings',
  RECENT_SEARCHES: 'recent_searches',
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  SAVE_SUCCESS: 'Changes saved successfully',
  DELETE_SUCCESS: 'Item deleted successfully',
  UPDATE_SUCCESS: 'Updated successfully',
  CREATE_SUCCESS: 'Created successfully',
} as const

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const

// Breakpoints (for responsive design)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const


import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { User } from '../types/auth'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { loginSchema } from '../utils/validation'
import type { LoginForm } from '../utils/validation'
import { 
  validateSessionTimeout,
  validateTokenExpiry,
  encryptData,
  decryptData,
  getDeviceFingerprint,
} from '../utils/securityUtils'
import toast from 'react-hot-toast'
import { useSecurity } from './SecurityContext'
import { 
  SecurityEvent, 
  SecurityEventType, 
  SecuritySeverity,
  SecurityMonitoring 
} from '../types/security'
import { monitoring } from '../services/monitoring'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  sessionExpiresAt: Date | null
  lastLoginAt: Date | null
  deviceFingerprint: string | null
  failedAttempts: number
  lastAttemptAt: Date | null
  securityScore: number
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { 
      type: 'AUTH_SUCCESS'
      payload: { 
        user: User
        token: string
        expiresAt: Date
        deviceFingerprint: string
        securityScore: number
      }
    }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGIN_ATTEMPT_FAILED'; payload: { timestamp: Date } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'SECURITY_ALERT'; payload: { type: string; severity: SecuritySeverity; message: string } }
  | { type: 'DEVICE_UPDATE'; payload: string }
  | { 
      type: 'REFRESH_TOKEN'
      payload: { 
        token: string
        expiresAt: Date
        securityScore: number 
      }
    }

// Security helper functions
function calculateSecurityScore(user: User, deviceFingerprint: string): number {
  let score = 100;
  
  // Reduce score for security risks
  if (!user.mfaEnabled) score -= 20;
  if (user.failedLoginAttempts > 0) score -= user.failedLoginAttempts * 5;
  if (!deviceFingerprint) score -= 10;
  
  // Time-based factors
  const daysSincePasswordChange = (Date.now() - user.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePasswordChange > 90) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

async function getUserLocation(): Promise<{ country: string; city: string; riskLevel: string } | null> {
  try {
    const response = await fetch('https://api.ipapi.com/api/check?access_key=' + process.env.IPAPI_KEY);
    if (!response.ok) return null;
    const data = await response.json();
    
    // Risk assessment based on location
    const riskLevel = await assessLocationRisk(data.country_name);
    
    return {
      country: data.country_name,
      city: data.city,
      riskLevel
    };
  } catch {
    return null;
  }
}

// Assess location risk based on various factors
async function assessLocationRisk(country: string): Promise<string> {
  try {
    // Check against high-risk countries list
    const response = await fetch('/api/security/location-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country })
    });
    
    if (!response.ok) return 'medium';
    
    const { riskLevel } = await response.json();
    return riskLevel;
  } catch {
    // Default to medium risk if assessment fails
    return 'medium';
  }
}

async function startSecurityMonitoring(userId: string, deviceFingerprint: string) {
  const monitoringInterval = setInterval(async () => {
    try {
      // Check basic security status
      const response = await fetch('/api/security/status', {
        headers: {
          'X-User-Id': userId,
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Request-Time': Date.now().toString()
        }
      });
      
      if (!response.ok) throw new Error('Security status check failed');
      
      const data = await response.json();
      
      // Check for new device logins
      const newDeviceLogins = await fetch('/api/security/device-logins', {
        headers: { 'X-User-Id': userId }
      }).then(res => res.json());
      
      // Combine all security threats
      const allThreats = [
        ...data.threats,
        ...newDeviceLogins.suspiciousLogins.map((login: any) => ({
          type: 'suspicious_device',
          severity: 'high',
          message: `Suspicious login detected from ${login.location}`
        }))
      ];

      if (allThreats.length > 0) {
        data.threats.forEach((threat: any) => {
          dispatch({
            type: 'SECURITY_ALERT',
            payload: {
              type: threat.type,
              severity: threat.severity,
              message: threat.message
            }
          });
        });
      }
    } catch (error) {
      console.error('Security monitoring failed:', error);
    }
  }, 30000); // Check every 30 seconds

  return () => clearInterval(monitoringInterval);
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginForm) => Promise<void>
  logout: () => void
  clearError: () => void
  updateUser: (user: User) => void
  validateSession: () => Promise<boolean>
  getSecurityStatus: () => { score: number; issues: string[] }
  refreshDeviceFingerprint: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Security Configuration
const SESSION_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds
const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000 // 25 minutes in milliseconds
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const SECURITY_CHECK_INTERVAL = 30 * 1000 // 30 seconds

// Security Thresholds
const SECURITY_THRESHOLDS = {
  CRITICAL: 40,
  HIGH: 60,
  MEDIUM: 80,
  LOW: 90
} as const

// Security helper functions
function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Helper for handling security events
const handleSecurityEvent = (
  type: SecurityEventType,
  severity: SecuritySeverity,
  message: string,
  data?: Record<string, any>
) => {
  monitoring.security.logSecurityEvent({
    type,
    severity,
    timestamp: Date.now(),
    data: {
      message,
      ...data
    }
  })
  
  dispatch({
    type: 'SECURITY_ALERT',
    payload: {
      type,
      severity,
      message
    }
  })
}

// Helper types
type SecurityStatus = {
  score: number
  issues: string[]
  lastCheck: Date
  recommendations: string[]
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionExpiresAt: null,
  lastLoginAt: null,
  deviceFingerprint: null,
  failedAttempts: 0,
  lastAttemptAt: null,
  securityScore: 100,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionExpiresAt: action.payload.expiresAt,
        lastLoginAt: new Date(),
        deviceFingerprint: action.payload.deviceFingerprint,
        securityScore: action.payload.securityScore,
        failedAttempts: 0,
        lastAttemptAt: null,
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      }
    case 'LOGIN_ATTEMPT_FAILED':
      return {
        ...state,
        failedAttempts: state.failedAttempts + 1,
        lastAttemptAt: action.payload.timestamp,
        securityScore: Math.max(0, state.securityScore - 10),
      }
    case 'LOGOUT':
      return {
        ...initialState,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      }
    case 'SESSION_EXPIRED':
      return {
        ...initialState,
        error: 'Session expired. Please login again.',
      }
    case 'SECURITY_ALERT': {
      const severityScore = {
        low: -5,
        medium: -10,
        high: -20,
        critical: -30,
      }[action.payload.severity] || 0;

      // Log security event
      monitoring.security.logSecurityEvent({
        type: 'SECURITY_ALERT',
        severity: action.payload.severity,
        timestamp: Date.now(),
        data: {
          type: action.payload.type,
          message: action.payload.message,
          currentScore: state.securityScore
        }
      });

      const newScore = Math.max(0, state.securityScore + severityScore);
      
      // Force logout if security score drops too low
      if (newScore < SECURITY_THRESHOLDS.CRITICAL) {
        setTimeout(() => dispatch({ type: 'LOGOUT' }), 0);
      }

      return {
        ...state,
        securityScore: newScore,
      };
    }
    case 'REFRESH_TOKEN': {
      return {
        ...state,
        token: action.payload.token,
        sessionExpiresAt: action.payload.expiresAt,
        securityScore: action.payload.securityScore,
      };
    }
    case 'DEVICE_UPDATE': {
      return {
        ...state,
        deviceFingerprint: action.payload,
        // Recalculate security score with new device fingerprint
        securityScore: state.user ? calculateSecurityScore(state.user, action.payload) : state.securityScore
      };
    }
    default:
      return state;
      return state
  }
}

// Mock user data for development
const mockUser: User = {
  id: '1',
  email: 'admin@securedbank.com',
  name: 'Security Admin',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
  lastLogin: new Date(),
  isActive: true,
  permissions: [
    { id: '1', name: 'View Dashboard', resource: 'dashboard', action: 'read' },
    { id: '2', name: 'Manage Users', resource: 'users', action: 'write' },
    { id: '3', name: 'View Security Alerts', resource: 'security', action: 'read' },
    { id: '4', name: 'Generate Reports', resource: 'reports', action: 'write' },
  ],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const [storedToken, setStoredToken] = useLocalStorage<string>('auth_token', '')
  const { services, startSecureSession, processSecurityEvent } = useSecurity()

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (!storedToken) return

      try {
        dispatch({ type: 'AUTH_START' })
        
        // Validate session with security service
        const isValid = await services.sessionManager.validateSession(storedToken)
        if (!isValid) {
          processSecurityEvent({
            type: 'SESSION_EXPIRED',
            timestamp: Date.now()
          })
          dispatch({ type: 'SESSION_EXPIRED' })
          return
        }

        // Start secure session
        startSecureSession()
        
        // Decrypt stored user data with XSS protection
        const encryptedUser = localStorage.getItem('user')
        if (!encryptedUser) throw new Error('No user data found')
        
        // Decrypt and sanitize user data with XSS protection
        const decryptedUserRaw = decryptData(encryptedUser)
        if (!decryptedUserRaw) throw new Error('Invalid user data')
        
        // Apply XSS sanitization to decrypted data
        const decryptedUser = services.xss.sanitize(decryptedUserRaw)

        const user = JSON.parse(decryptedUser)
        const expiresAt = new Date(Date.now() + SESSION_DURATION)
        
        // Get device fingerprint for security
        const deviceFingerprint = await getDeviceFingerprint()
        
        // Calculate initial security score
        const securityScore = calculateSecurityScore(user, deviceFingerprint)
        
        dispatch({ 
          type: 'AUTH_SUCCESS',
          payload: {
            user,
            token: storedToken,
            expiresAt,
            deviceFingerprint,
            securityScore
          },
        })
      } catch (error) {
        dispatch({ type: 'SESSION_EXPIRED' })
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      }
    }

    initializeAuth()
  }, [storedToken])

  // Session validation effect with security monitoring
  useEffect(() => {
    if (!state.isAuthenticated) return

    const validateCurrentSession = async () => {
      try {
        const isValid = await services.sessionManager.validateSession(state.token || '')
        if (!isValid) {
          processSecurityEvent({
            type: 'SESSION_EXPIRED',
            timestamp: Date.now()
          })
          dispatch({ type: 'SESSION_EXPIRED' })
          return
        }

        // Refresh security tokens if needed
        if (state.sessionExpiresAt && state.sessionExpiresAt.getTime() - Date.now() < TOKEN_REFRESH_INTERVAL) {
          const newToken = await services.sessionManager.refreshSession(state.token || '')
          if (newToken) {
            const expiresAt = new Date(Date.now() + SESSION_DURATION)
            dispatch({
              type: 'REFRESH_TOKEN',
              payload: { token: newToken, expiresAt }
            })
            setStoredToken(newToken)
          }
        }
      } catch (error) {
        console.error('Session validation failed:', error)
        dispatch({ type: 'SESSION_EXPIRED' })
      }
    }

    const sessionCheckInterval = setInterval(validateCurrentSession, 60000) // Check every minute
    return () => clearInterval(sessionCheckInterval)
  }, [state.isAuthenticated])

  // Token refresh effect
  useEffect(() => {
    if (!state.isAuthenticated || !state.token) return

    const refreshTokenTimer = setInterval(async () => {
      try {
        const newToken = 'new-mock-token' // In real app, get from API
        const expiresAt = new Date(Date.now() + SESSION_DURATION)
        
        dispatch({
          type: 'REFRESH_TOKEN',
          payload: { token: newToken, expiresAt },
        })
        
        setStoredToken(newToken)
      } catch (error) {
        dispatch({ type: 'SESSION_EXPIRED' })
      }
    }, TOKEN_REFRESH_INTERVAL)

    return () => clearInterval(refreshTokenTimer)
  }, [state.isAuthenticated, state.token, setStoredToken])

  const validateSession = async (): Promise<boolean> => {
    if (!state.sessionExpiresAt || !state.token) return false
    
    // Check if session has expired
    if (new Date() > state.sessionExpiresAt) {
      dispatch({ type: 'SESSION_EXPIRED' })
      return false
    }

    // Validate session timeout
    if (!validateSessionTimeout(state.lastLoginAt)) {
      dispatch({ type: 'SESSION_EXPIRED' })
      return false
    }

    return true
  }

  const login = async (credentials: LoginForm) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      // Start secure session for login
      startSecureSession()

      // Validate and sanitize input
      const validationResult = await loginSchema.safeParseAsync(credentials)
      if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0].message)
      }

      // Apply XSS protection to credentials
      const sanitizedCredentials = {
        email: sanitizeInput(credentials.email),
        password: credentials.password, // Don't sanitize password
        rememberMe: credentials.rememberMe
      }

      // Simulate API call in development
      await new Promise(resolve => setTimeout(resolve, 1000))

      // In development, use mock authentication with security
      if (process.env.NODE_ENV === 'development') {
        if (sanitizedCredentials.email === 'admin@securedbank.com' && sanitizedCredentials.password === 'admin123') {
          // Generate secure session token
          const sessionToken = await services.sessionManager.createSession('1', 'development')
          const expiresAt = new Date(Date.now() + SESSION_DURATION)
          const user = { ...mockUser, lastLogin: new Date() }
          
          // Generate CSRF token
          const csrfToken = await services.csrf.generateToken('1')
          
          // Apply security measures and encrypt user data
          const sanitizedUser = services.xss.sanitize(JSON.stringify(user))
          const encryptedUser = encryptData(sanitizedUser)
          localStorage.setItem('user', encryptedUser)
          localStorage.setItem('csrf_token', csrfToken)
          
          // Log successful authentication
          processSecurityEvent({
            type: 'AUTH_SUCCESS',
            timestamp: Date.now(),
            data: { userId: '1' }
          })
          
          dispatch({ 
            type: 'AUTH_SUCCESS',
            payload: { user, token: sessionToken, expiresAt }
          })
          
          setStoredToken(sessionToken)
          
          if (sanitizedCredentials.rememberMe) {
            localStorage.setItem('remember_me', 'true')
          }

          toast.success('Login successful!')
        } else {
          throw new Error('Invalid credentials')
        }
      } else {
        // Production API call would go here
        throw new Error('Not implemented')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      dispatch({ type: 'AUTH_FAILURE', payload: message })
      toast.error(message)
      throw error
    }
  }

  const logout = async () => {
    try {
      // End secure session
      endSecureSession()

      // Clear session in security service
      if (state.token) {
        await services.sessionManager.endSession(state.token)
      }

      // Clear security tokens
      services.csrf.clearTokens()

      // Clear sensitive data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      localStorage.removeItem('remember_me')
      localStorage.removeItem('csrf_token')
      
      // Log security event
      processSecurityEvent({
        type: 'AUTH_SUCCESS',
        timestamp: Date.now(),
        data: { action: 'logout' }
      })

      dispatch({ type: 'LOGOUT' })
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Error during logout')
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const updateUser = (user: User) => {
    try {
      const encryptedUser = encryptData(JSON.stringify(user))
      localStorage.setItem('user', encryptedUser)
      dispatch({ type: 'UPDATE_USER', payload: user })
    } catch (error) {
      console.error('Failed to update user:', error)
      toast.error('Failed to update user information')
    }
  }

  // Security monitoring methods
  const getSecurityStatus = (): { score: number; issues: string[] } => {
    const issues: string[] = []
    
    if (state.securityScore < SECURITY_THRESHOLDS.MEDIUM) {
      issues.push('Security score is below acceptable threshold')
    }
    
    if (state.failedAttempts > 0) {
      issues.push(`${state.failedAttempts} failed login attempts detected`)
    }
    
    if (!state.deviceFingerprint) {
      issues.push('Device fingerprint validation failed')
    }
    
    return {
      score: state.securityScore,
      issues
    }
  }
  
  const refreshDeviceFingerprint = async () => {
    const newFingerprint = await getDeviceFingerprint()
    
    // Validate the new fingerprint matches current session
    const validFingerprint = await services.sessionManager.validateSession(
      state.token || '',
      newFingerprint
    )
    
    if (!validFingerprint) {
      handleSecurityEvent(
        'device_changed',
        'high',
        'Device fingerprint validation failed'
      )
      await logout()
      return
    }
    
    // Update device fingerprint in state
    dispatch({
      type: 'DEVICE_UPDATE',
      payload: newFingerprint
    })
  }

  // Create context value with all methods
  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    updateUser,
    validateSession,
    getSecurityStatus,
    refreshDeviceFingerprint
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


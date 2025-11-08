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
} from '../utils/securityUtils'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  sessionExpiresAt: Date | null
  lastLoginAt: Date | null
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; expiresAt: Date } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'REFRESH_TOKEN'; payload: { token: string; expiresAt: Date } }

interface AuthContextType extends AuthState {
  login: (credentials: LoginForm) => Promise<void>
  logout: () => void
  clearError: () => void
  updateUser: (user: User) => void
  validateSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds
const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000 // 25 minutes in milliseconds

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionExpiresAt: null,
  lastLoginAt: null,
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
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
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
    case 'REFRESH_TOKEN':
      return {
        ...state,
        token: action.payload.token,
        sessionExpiresAt: action.payload.expiresAt,
      }
    default:
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

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (!storedToken) return

      // Validate token expiry
      if (!validateTokenExpiry(storedToken)) {
        dispatch({ type: 'SESSION_EXPIRED' })
        return
      }

      try {
        dispatch({ type: 'AUTH_START' })
        
        // Decrypt stored user data
        const encryptedUser = localStorage.getItem('user')
        if (!encryptedUser) throw new Error('No user data found')
        
        const decryptedUser = decryptData(encryptedUser)
        if (!decryptedUser) throw new Error('Invalid user data')

        const user = JSON.parse(decryptedUser)
        const expiresAt = new Date(Date.now() + SESSION_DURATION)
        
        dispatch({ 
          type: 'AUTH_SUCCESS',
          payload: {
            user,
            token: storedToken,
            expiresAt,
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

  // Session validation effect
  useEffect(() => {
    if (!state.isAuthenticated) return

    const validateCurrentSession = async () => {
      const isValid = await validateSession()
      if (!isValid) {
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

      // Validate input using Zod schema
      const validationResult = await loginSchema.safeParseAsync(credentials)
      if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0].message)
      }

      // Simulate API call in development
      await new Promise(resolve => setTimeout(resolve, 1000))

      // In development, use mock authentication
      if (process.env.NODE_ENV === 'development') {
        if (credentials.email === 'admin@securedbank.com' && credentials.password === 'admin123') {
          const token = 'mock-token'
          const expiresAt = new Date(Date.now() + SESSION_DURATION)
          const user = { ...mockUser, lastLogin: new Date() }
          
          // Encrypt user data before storing
          const encryptedUser = encryptData(JSON.stringify(user))
          localStorage.setItem('user', encryptedUser)
          
          dispatch({ 
            type: 'AUTH_SUCCESS',
            payload: { user, token, expiresAt }
          })
          
          setStoredToken(token)
          
          if (credentials.rememberMe) {
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

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem('remember_me')
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
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

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    updateUser,
    validateSession,
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

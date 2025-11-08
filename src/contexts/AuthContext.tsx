import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { User, LoginCredentials, LoginResponse } from '../types/auth'
import { useApi } from '../hooks/useApi'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { 
  handleLoginAttempt,
  validateSessionTimeout,
  validateTokenExpiry,
  encryptData,
  decryptData,
  createSecureHeaders,
  validatePasswordStrength
} from '../utils/securityUtils'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: string }

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  clearError: () => void
  updateUser: (user: User) => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      }
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        token: action.payload
      }
    default:
      return state
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const api = useApi()
  const [, setStoredToken] = useLocalStorage<string>('auth_token', '')

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token')
      if (!storedToken) return

      try {
        dispatch({ type: 'AUTH_START' })
        const response = await api.get<User>('/api/auth/me')
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user: response, token: storedToken } 
        })
      } catch (error) {
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: 'Session expired. Please login again.' 
        })
        localStorage.removeItem('auth_token')
      }
    }

    initializeAuth()
  }, [api])

  useEffect(() => {
    if (state.token) {
      setStoredToken(state.token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }, [state.token, setStoredToken])

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      const response = await api.post<LoginResponse>('/api/auth/login', credentials)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token
        }
      })

      toast.success('Logged in successfully')
    } catch (error) {
      const message = error instanceof Error 
        ? error.message 
        : 'Failed to login. Please try again.'
      
      dispatch({ type: 'AUTH_FAILURE', payload: message })
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user })
  }

  const refreshToken = async () => {
    try {
      const response = await api.post<LoginResponse>('/api/auth/refresh')
      dispatch({
        type: 'REFRESH_TOKEN_SUCCESS',
        payload: response.token
      })
    } catch (error) {
      dispatch({ type: 'LOGOUT' })
      toast.error('Session expired. Please login again.')
    }
  }

  const value = {
    ...state,
    login,
    logout,
    clearError,
    updateUser,
    refreshToken
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
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
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

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        dispatch({ type: 'LOGIN_SUCCESS', payload: user })
      } catch (error) {
        localStorage.removeItem('user')
      }
    }
  }, [])

  const login = async (credentials: LoginForm) => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock authentication - in real app, validate with backend
      if (credentials.email === 'admin@securedbank.com' && credentials.password === 'admin123') {
        const user = { ...mockUser, lastLogin: new Date() }
        localStorage.setItem('user', JSON.stringify(user))
        dispatch({ type: 'LOGIN_SUCCESS', payload: user })
        toast.success('Login successful!')
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      dispatch({ type: 'LOGIN_FAILURE', payload: message })
      toast.error(message)
    }
  }

  const logout = () => {
    localStorage.removeItem('user')
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const updateUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user))
    dispatch({ type: 'UPDATE_USER', payload: user })
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    updateUser,
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

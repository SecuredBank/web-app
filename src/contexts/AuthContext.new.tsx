import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
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
  validatePasswordStrength,
  LoginAttempt,
  LoginAttemptResult
} from '../utils/securityUtils'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  lastActivity: number
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: string }
  | { type: 'UPDATE_ACTIVITY' }

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  clearError: () => void
  updateUser: (user: User) => void
  refreshToken: () => Promise<void>
  updateActivity: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Keep track of login attempts
const loginAttempts = new Map<string, LoginAttempt>()

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastActivity: Date.now()
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
        error: null,
        lastActivity: Date.now()
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
        user: action.payload,
        lastActivity: Date.now()
      }
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        token: action.payload,
        lastActivity: Date.now()
      }
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: Date.now()
      }
    default:
      return state
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const api = useApi()
  const [storedToken, setStoredToken] = useLocalStorage<string>('auth_token', '')
  const sessionCheckInterval = useRef<number>()

  const checkSession = useCallback(() => {
    if (state.isAuthenticated) {
      // Check session timeout
      if (!validateSessionTimeout(state.lastActivity)) {
        console.warn('Session timeout detected')
        logout()
        return
      }

      // Check token expiry
      if (state.token && !validateTokenExpiry(state.token)) {
        console.warn('Token expired, attempting refresh')
        refreshToken()
      }
    }
  }, [state.isAuthenticated, state.lastActivity, state.token])

  useEffect(() => {
    // Set up session check interval
    if (state.isAuthenticated) {
      sessionCheckInterval.current = window.setInterval(checkSession, 60000) // Check every minute
    }

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
      }
    }
  }, [state.isAuthenticated, checkSession])

  const updateActivity = useCallback(() => {
    dispatch({ type: 'UPDATE_ACTIVITY' })
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      // Validate password strength on login
      if (!validatePasswordStrength(credentials.password)) {
        throw new Error('Password does not meet security requirements')
      }

      dispatch({ type: 'AUTH_START' })

      // Check login attempts
      const attemptResult = handleLoginAttempt(
        credentials.email,
        false,
        loginAttempts
      )

      if (!attemptResult.allowed) {
        throw new Error(`Too many login attempts. Please try again later.`)
      }

      const response = await api.post<LoginResponse>('/api/auth/login', credentials)

      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid response from server')
      }

      // Update login attempts on success
      handleLoginAttempt(credentials.email, true, loginAttempts)

      const token = encryptData(response.data.token)
      setStoredToken(token)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.data.user, token: response.data.token }
      })

      toast.success('Logged in successfully')
    } catch (err) {
      const error = err instanceof Error ? err.message : 'An error occurred during login'
      dispatch({ type: 'AUTH_FAILURE', payload: error })
      toast.error(error)
    }
  }

  const logout = () => {
    setStoredToken('')
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
  }

  const refreshToken = async () => {
    try {
      if (!state.token) return

      const response = await api.post<LoginResponse>('/api/auth/refresh', {
        token: decryptData(state.token)
      })

      if (!response.data?.token) {
        throw new Error('Invalid response from server')
      }

      const token = encryptData(response.data.token)
      setStoredToken(token)
      
      dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: token })
    } catch (err) {
      console.error('Token refresh failed:', err)
      logout()
    }
  }

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' })

  const updateUser = (user: User) => dispatch({ type: 'UPDATE_USER', payload: user })

  const value = {
    ...state,
    login,
    logout,
    clearError,
    updateUser,
    refreshToken,
    updateActivity
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

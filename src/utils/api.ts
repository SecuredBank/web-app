import { API_BASE_URL, API_TIMEOUT } from '../constants'
import { createSecureHeaders, validateTokenExpiry } from './securityUtils'

// API Response types
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  timestamp: string
}

// Remove the interface and just use the class
export class ApiError extends Error {
  code: string
  details?: any

  constructor(message: string, code: string, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
}

// API Client class
class ApiClient {
  private baseURL: string
  private defaultTimeout: number
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL
    this.defaultTimeout = timeout

    // Convert Headers to plain object
    const headers = createSecureHeaders()
    const headerObj: Record<string, string> = {}
    headers.forEach((value, key) => {
      headerObj[key] = value
    })
    this.defaultHeaders = headerObj
  }

  // Set authorization token
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  // Remove authorization token
  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization']
  }

  // Make HTTP request
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
    } = config

    const url = `${this.baseURL}${endpoint}`
    const requestHeaders = { ...this.defaultHeaders, ...headers }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          errorData.code || 'HTTP_ERROR',
          errorData
        )
      }

      const data = await response.json()
      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof ApiError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 'TIMEOUT_ERROR')
        }
        throw new ApiError(error.message, 'NETWORK_ERROR')
      }

      throw new ApiError('Network error', 'NETWORK_ERROR', error)
    }
  }

  // GET request
  async get<T>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  // POST request
  async post<T>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body })
  }

  // PUT request
  async put<T>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body })
  }

  // PATCH request
  async patch<T>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body })
  }

  // DELETE request
  async delete<T>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }
}

// Custom error class
class ApiError extends Error {
  public code: string
  public details?: any

  constructor(message: string, code: string, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

// Create default API client instance
export const apiClient = new ApiClient()

// API endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },

  // Users
  users: {
    list: '/users',
    create: '/users',
    get: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },

  // Security Alerts
  alerts: {
    list: '/alerts',
    create: '/alerts',
    get: (id: string) => `/alerts/${id}`,
    update: (id: string) => `/alerts/${id}`,
    delete: (id: string) => `/alerts/${id}`,
    resolve: (id: string) => `/alerts/${id}/resolve`,
  },

  // Reports
  reports: {
    list: '/reports',
    create: '/reports',
    get: (id: string) => `/reports/${id}`,
    download: (id: string) => `/reports/${id}/download`,
  },

  // Dashboard
  dashboard: {
    stats: '/dashboard/stats',
    metrics: '/dashboard/metrics',
    recent: '/dashboard/recent',
  },
} as const

// Helper functions
export const handleApiError = (error: any): string => {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error.response?.data?.message) {
    return error.response.data.message
  }

  return 'An unexpected error occurred'
}

export const isApiError = (error: any): error is ApiError => {
  return error instanceof ApiError
}

// Request interceptor for adding auth token
export const setupAuthInterceptor = (getToken: () => string | null) => {
  const originalRequest = apiClient.request.bind(apiClient)

  apiClient.request = async function <T>(
    endpoint: string,
    config: RequestConfig = {}
  ) {
    const token = getToken()
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    return originalRequest<T>(endpoint, config)
  }
}

export { ApiError }

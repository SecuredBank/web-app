import { API_BASE_URL, API_TIMEOUT } from '../constants'
import { createSecureHeaders, validateTokenExpiry } from './securityUtils'
import { CSRFProtection } from './csrfProtection'
import { XSSProtection } from './xssProtection'
import { SessionManager } from './sessionManager'

// API Response types
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  timestamp: string
}

// API Error class
export class ApiError extends Error {
  code: string
  details?: any

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
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
  requiresAuth?: boolean
}

// API Client class
export class ApiClient {
  private baseURL: string
  private defaultTimeout: number
  private defaultHeaders: Record<string, string>
  private csrf: CSRFProtection
  private xss: XSSProtection
  private sessionManager: SessionManager

  constructor(baseURL: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL
    this.defaultTimeout = timeout
    this.csrf = new CSRFProtection()
    this.xss = new XSSProtection()
    this.sessionManager = new SessionManager()

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
      requiresAuth = false,
    } = config

    const url = `${this.baseURL}${endpoint}`
    const requestHeaders = { ...this.defaultHeaders, ...headers }

    // Check token if auth is required
    if (requiresAuth && requestHeaders['Authorization']) {
      const token = requestHeaders['Authorization'].replace('Bearer ', '')
      if (!validateTokenExpiry(token)) {
        // Let the auth interceptor handle token refresh
        throw new ApiError('Token expired', 'TOKEN_EXPIRED')
      }
    }

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

      throw new ApiError('Network error', 'NETWORK_ERROR')
    }
  }

  // HTTP method shortcuts
  async get<T>(endpoint: string, config: Omit<RequestConfig, 'method'> = {}) {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T>(
    endpoint: string,
    data: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ) {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data })
  }

  async put<T>(
    endpoint: string,
    data: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ) {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data })
  }

  async delete<T>(
    endpoint: string,
    config: Omit<RequestConfig, 'method'> = {}
  ) {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  async patch<T>(
    endpoint: string,
    data: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ) {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body: data })
  }
}

// Create singleton instance
const apiClient = new ApiClient()

// Add token refresh interceptor
let refreshPromise: Promise<void> | null = null

async function refreshAuthToken(): Promise<void> {
  try {
    const response = await apiClient.post<{ token: string }>(
      '/auth/refresh',
      {}
    )
    apiClient.setAuthToken(response.data.token)
  } catch (error) {
    apiClient.removeAuthToken()
    throw error
  }
}

// Create a proxy for the API client to handle token refresh
const apiClientProxy = new Proxy(apiClient, {
  get(target: ApiClient, prop: string | symbol) {
    if (prop === 'request') {
      return async function <T>(endpoint: string, config: RequestConfig = {}) {
        try {
          return await target.request<T>(endpoint, config)
        } catch (error) {
          if (error instanceof ApiError && error.code === 'TOKEN_EXPIRED') {
            if (!refreshPromise) {
              refreshPromise = refreshAuthToken()
            }

            try {
              await refreshPromise
              return await target.request<T>(endpoint, config)
            } finally {
              refreshPromise = null
            }
          }
          throw error
        }
      }
    }
    return Reflect.get(target, prop)
  },
})

export default apiClientProxy


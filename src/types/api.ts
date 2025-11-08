import { type } from 'os'

export interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

export interface ApiError {
  status: number
  message: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
}

export interface QueryParams {
  [key: string]: string | number | boolean | undefined
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestConfig {
  method: HttpMethod
  headers?: Record<string, string>
  params?: QueryParams
  data?: unknown
  timeout?: number
}

export interface UseApiOptions {
  baseURL: string
  timeout?: number
  withCredentials?: boolean
}

export interface ApiInstance {
  get: <T>(url: string, params?: QueryParams) => Promise<T>
  post: <T>(url: string, data: unknown) => Promise<T>
  put: <T>(url: string, data: unknown) => Promise<T>
  patch: <T>(url: string, data: unknown) => Promise<T>
  delete: <T>(url: string) => Promise<T>
  request: <T>(config: RequestConfig) => Promise<T>
}
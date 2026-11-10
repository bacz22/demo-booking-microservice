/**
 * CineBook API Client
 * Bọc fetch API với Correlation-Id, Error handling theo chuẩn Spring Boot Backend.
 * Mọi request đi qua API Gateway: tự gắn Authorization: Bearer <accessToken>;
 * gặp 401 thì refresh token một lần rồi gửi lại.
 */
import { tokenStore } from '@/lib/token-store'

export interface ApiErrorResponse {
  code?: string
  message?: string
  correlationId?: string
  timestamp?: string
  path?: string
}

export class ApiClientError extends Error {
  status: number
  code: string
  correlationId?: string
  path?: string

  constructor(status: number, message: string, code = 'API_ERROR', correlationId?: string, path?: string) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.correlationId = correlationId
    this.path = path
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function buildUrl(endpoint: string): string {
  let cleanEndpoint = endpoint
  if (BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.slice(4)
  }
  return cleanEndpoint.startsWith('http')
    ? cleanEndpoint
    : `${BASE_URL}${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`
}

// Một lần refresh dùng chung cho các request 401 đồng thời
let refreshInFlight: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  const tokens = tokenStore.get()
  if (!tokens) return false
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        })
        if (!res.ok) {
          tokenStore.notifyExpired()
          return false
        }
        const data = await res.json()
        tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        return true
      } catch {
        return false
      } finally {
        setTimeout(() => {
          refreshInFlight = null
        }, 0)
      }
    })()
  }
  return refreshInFlight
}

function isAuthEndpoint(endpoint: string): boolean {
  return /^\/?(api\/)?auth\/(login|register|refresh|logout)/.test(endpoint)
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const url = buildUrl(endpoint)

  const headers = new Headers(options.headers || {})
  if (!headers.has('X-Correlation-Id')) {
    headers.set('X-Correlation-Id', generateUUID())
  }
  const tokens = tokenStore.get()
  if (tokens && !headers.has('Authorization') && !isAuthEndpoint(endpoint)) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`)
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  // Tự động set Content-Type: application/json nếu body là chuỗi JSON và chưa có header
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const config: RequestInit = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(url, config)

    // Access token hết hạn → refresh một lần rồi gửi lại request
    if (response.status === 401 && tokens && !retried && !isAuthEndpoint(endpoint)) {
      if (await refreshTokens()) {
        const retryHeaders = new Headers(options.headers || {})
        retryHeaders.delete('Authorization')
        return request<T>(endpoint, { ...options, headers: retryHeaders }, true)
      }
    }

    // Xử lý status 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`
      let errorCode = `HTTP_${response.status}`
      let correlationId = response.headers.get('X-Correlation-Id') || undefined
      let errorPath = endpoint

      if (isJson) {
        try {
          const errorData: ApiErrorResponse = await response.json()
          if (errorData.message) errorMessage = errorData.message
          if (errorData.code) errorCode = errorData.code
          if (errorData.correlationId) correlationId = errorData.correlationId
          if (errorData.path) errorPath = errorData.path
        } catch {
          // parse failed, use default
        }
      } else {
        try {
          const text = await response.text()
          if (text) errorMessage = text
        } catch {
          // ignore
        }
      }

      throw new ApiClientError(response.status, errorMessage, errorCode, correlationId, errorPath)
    }

    if (isJson) {
      return (await response.json()) as T
    }

    return (await response.text()) as unknown as T
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }
    // Lỗi kết nối / network error
    throw new ApiClientError(0, error instanceof Error ? error.message : 'Network Connection Error', 'NETWORK_ERROR')
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  postForm: <T>(endpoint: string, formData: FormData, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      // Không set Content-Type header để browser tự sinh boundary cho multipart/form-data
    }),
}

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getToken, setToken, clearToken } from './tokenStorage'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface RefreshResponse {
  token: string
  expiresAt?: string
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})

let refreshPromise: Promise<string> | null = null

apiClient.interceptors.request.use((config) => {
  const isAuthRequest = config.url?.includes('/api/auth/login') || config.url?.includes('/api/auth/refresh')
  const token = getToken()
  if (token && !isAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    const isLoginRequest = originalRequest.url?.includes('/api/auth/login')
    if (isLoginRequest) {
      return Promise.reject(error)
    }

    const isRefreshRequest = originalRequest.url?.includes('/api/auth/refresh')
    if (originalRequest._retry || isRefreshRequest) {
      clearToken()
      window.location.hash = '#/login?sessionExpired=1'
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const response = await axios.post<RefreshResponse>(
            `${apiClient.defaults.baseURL || ''}/api/auth/refresh`,
            {},
            { withCredentials: true },
          )
          const newToken = response.data.token
          setToken(newToken)
          return newToken
        } catch (refreshErr) {
          clearToken()
          window.location.hash = '#/login?sessionExpired=1'
          throw refreshErr
        } finally {
          refreshPromise = null
        }
      })()
    }

    try {
      const newToken = await refreshPromise
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
      }
      return apiClient(originalRequest)
    } catch (refreshErr) {
      return Promise.reject(refreshErr)
    }
  },
)

export default apiClient
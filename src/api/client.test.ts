import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { setToken, getToken } from './tokenStorage'

function makeAxiosError(status: number, config: InternalAxiosRequestConfig): AxiosError {
  const error = new AxiosError(
    `Request failed with status code ${status}`,
    `${status}`,
    config,
    {},
    {
      status,
      statusText: status === 401 ? 'Unauthorized' : 'Error',
      headers: {},
      config,
      data: {},
    } as AxiosResponse,
  )
  return error
}

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = ''
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('has withCredentials set to true', async () => {
    const { default: apiClient } = await import('./client')
    expect(apiClient.defaults.withCredentials).toBe(true)
  })

  it('attaches Bearer token to requests when token is present', async () => {
    setToken('test-access-token')
    const { default: apiClient } = await import('./client')

    const mockAdapter = vi.fn().mockImplementation((config: InternalAxiosRequestConfig) => {
      return Promise.resolve({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      })
    })

    apiClient.defaults.adapter = mockAdapter

    await apiClient.get('/api/clients')

    expect(mockAdapter).toHaveBeenCalledTimes(1)
    const config = mockAdapter.mock.calls[0][0]
    expect(config.headers.Authorization).toBe('Bearer test-access-token')
  })

  it('does not attach Bearer token to login or refresh endpoints', async () => {
    setToken('test-access-token')
    const { default: apiClient } = await import('./client')

    const mockAdapter = vi.fn().mockImplementation((config: InternalAxiosRequestConfig) => {
      return Promise.resolve({
        data: { token: 'new-token' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      })
    })

    apiClient.defaults.adapter = mockAdapter

    await apiClient.post('/api/auth/login', { email: 'a@b.com', password: '123' })
    expect(mockAdapter.mock.calls[0][0].headers.Authorization).toBeUndefined()

    await apiClient.post('/api/auth/refresh')
    expect(mockAdapter.mock.calls[1][0].headers.Authorization).toBeUndefined()
  })

  it('does not retry and does not redirect to sessionExpired on 401 from /api/auth/login', async () => {
    const { default: apiClient } = await import('./client')

    const mockAdapter = vi.fn().mockImplementation((config: InternalAxiosRequestConfig) => {
      return Promise.reject(makeAxiosError(401, config))
    })

    apiClient.defaults.adapter = mockAdapter
    const postSpy = vi.spyOn(axios, 'post')

    await expect(apiClient.post('/api/auth/login', { email: 'a@b.com', password: 'wrong' })).rejects.toThrow()

    expect(postSpy).not.toHaveBeenCalled()
    expect(window.location.hash).not.toContain('sessionExpired=1')
  })

  it('refreshes token on 401 and retries the original request with new token', async () => {
    setToken('old-token')
    const { default: apiClient } = await import('./client')

    let callCount = 0
    const mockAdapter = vi.fn().mockImplementation((config: InternalAxiosRequestConfig) => {
      callCount++
      if (callCount === 1) {
        return Promise.reject(makeAxiosError(401, config))
      }
      return Promise.resolve({
        data: [{ id: 1, name: 'Client A' }],
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      })
    })

    apiClient.defaults.adapter = mockAdapter

    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { token: 'refreshed-token', expiresAt: '2030-01-01' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    })

    const response = await apiClient.get('/api/clients')

    expect(response.data).toEqual([{ id: 1, name: 'Client A' }])
    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(getToken()).toBe('refreshed-token')
    expect(mockAdapter).toHaveBeenCalledTimes(2)
    // The retried request should have new token in header
    expect(mockAdapter.mock.calls[1][0].headers.Authorization).toBe('Bearer refreshed-token')
  })

  it('shares the in-flight refresh promise across concurrent 401 requests and calls refresh only once', async () => {
    setToken('old-token')
    const { default: apiClient } = await import('./client')

    let attempts: Record<string, number> = { '/api/clients': 0, '/api/projects': 0, '/api/time-entries': 0 }

    const mockAdapter = vi.fn().mockImplementation((config: InternalAxiosRequestConfig) => {
      const url = config.url || ''
      attempts[url] = (attempts[url] || 0) + 1
      if (attempts[url] === 1) {
        return Promise.reject(makeAxiosError(401, config))
      }
      return Promise.resolve({
        data: { url, success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      })
    })

    apiClient.defaults.adapter = mockAdapter

    const axiosPostSpy = vi.spyOn(axios, 'post').mockImplementation(async () => {
      // Simulate network latency for refresh
      await new Promise((resolve) => setTimeout(resolve, 50))
      return {
        data: { token: 'shared-refreshed-token' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      }
    })

    // Fire 3 requests concurrently
    const [res1, res2, res3] = await Promise.all([
      apiClient.get('/api/clients'),
      apiClient.get('/api/projects'),
      apiClient.get('/api/time-entries'),
    ])

    expect(res1.data).toEqual({ url: '/api/clients', success: true })
    expect(res2.data).toEqual({ url: '/api/projects', success: true })
    expect(res3.data).toEqual({ url: '/api/time-entries', success: true })

    // Refresh should only have been called ONCE
    expect(axiosPostSpy).toHaveBeenCalledTimes(1)
    expect(getToken()).toBe('shared-refreshed-token')
  })

  it('clears token, sets sessionExpired=1 in hash, and rejects requests when refresh fails', async () => {
    setToken('old-token')
    const { default: apiClient } = await import('./client')

    const mockAdapter = vi.fn().mockImplementation((config: InternalAxiosRequestConfig) => {
      return Promise.reject(makeAxiosError(401, config))
    })

    apiClient.defaults.adapter = mockAdapter

    vi.spyOn(axios, 'post').mockRejectedValueOnce(
      makeAxiosError(401, { url: '/api/auth/refresh' } as any),
    )

    await expect(apiClient.get('/api/clients')).rejects.toThrow()

    expect(getToken()).toBeNull()
    expect(window.location.hash).toBe('#/login?sessionExpired=1')
  })
})

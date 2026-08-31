import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'
import apiClient from '../api/client'
import { setToken, clearToken, getToken } from '../api/tokenStorage'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('initializes with null token and isAuthenticated = false when nothing in storage', () => {
    const authStore = useAuthStore()
    expect(authStore.token).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
  })

  it('initializes with token and isAuthenticated = true when token exists in storage', () => {
    setToken('initial-token')
    const authStore = useAuthStore()
    expect(authStore.token).toBe('initial-token')
    expect(authStore.isAuthenticated).toBe(true)
  })

  it('logs in successfully, updates state and localStorage', async () => {
    const authStore = useAuthStore()

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { token: 'new-login-token', expiresAt: '2030-01-01' },
    })

    await authStore.login('test@example.com', 'password123')

    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    })
    expect(authStore.token).toBe('new-login-token')
    expect(authStore.isAuthenticated).toBe(true)
    expect(getToken()).toBe('new-login-token')
  })

  it('refreshes token successfully, updates state and localStorage', async () => {
    setToken('old-token')
    const authStore = useAuthStore()

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { token: 'refreshed-token', expiresAt: '2030-01-01' },
    })

    const result = await authStore.refresh()

    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/refresh')
    expect(result.token).toBe('refreshed-token')
    expect(authStore.token).toBe('refreshed-token')
    expect(authStore.isAuthenticated).toBe(true)
    expect(getToken()).toBe('refreshed-token')
  })

  it('logs out successfully, calls endpoint and clears state and localStorage', async () => {
    setToken('active-token')
    const authStore = useAuthStore()

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: {} })

    await authStore.logout()

    expect(postSpy).toHaveBeenCalledWith('/api/auth/logout')
    expect(authStore.token).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(getToken()).toBeNull()
  })

  it('clears state even if logout endpoint fails', async () => {
    setToken('active-token')
    const authStore = useAuthStore()

    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Network error'))

    await authStore.logout()

    expect(authStore.token).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(getToken()).toBeNull()
  })

  it('reacts to external tokenStorage updates via subscribeToken', () => {
    const authStore = useAuthStore()
    expect(authStore.isAuthenticated).toBe(false)

    setToken('external-token')
    expect(authStore.token).toBe('external-token')
    expect(authStore.isAuthenticated).toBe(true)

    clearToken()
    expect(authStore.token).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
  })
})

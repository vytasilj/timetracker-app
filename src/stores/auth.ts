import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/client'
import { getToken, setToken, clearToken, subscribeToken } from '../api/tokenStorage'

interface LoginResponse {
  token: string
  expiresAt: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken())

  subscribeToken((newToken) => {
    token.value = newToken
  })

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', { email, password })
    token.value = response.data.token
    setToken(response.data.token)
  }

  async function refresh() {
    const response = await apiClient.post<LoginResponse>('/api/auth/refresh')
    token.value = response.data.token
    setToken(response.data.token)
    return response.data
  }

  async function logout() {
    try {
      await apiClient.post('/api/auth/logout')
    } catch {
      // Ignore network/server errors during logout
    } finally {
      token.value = null
      clearToken()
    }
  }

  return { token, isAuthenticated, login, refresh, logout }
})
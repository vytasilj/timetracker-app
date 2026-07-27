import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/client'
import { getToken, setToken, clearToken } from '../api/tokenStorage'

interface LoginResponse {
  token: string
  expiresAt: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken())

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', { email, password })
    token.value = response.data.token
    setToken(response.data.token)
  }

  function logout() {
    token.value = null
    clearToken()
  }

  return { token, isAuthenticated, login, logout }
})
import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'
import type { Client, CreateClientPayload } from '../types/client'

export const useClientsStore = defineStore('clients', () => {
  const clients = ref<Client[]>([])
  const isLoading = ref(false)

  async function fetchAll() {
    isLoading.value = true
    try {
      const response = await apiClient.get<Client[]>('/api/clients')
      clients.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function create(payload: CreateClientPayload) {
    const response = await apiClient.post<Client>('/api/clients', payload)
    clients.value.push(response.data)
  }

  async function remove(id: number) {
    await apiClient.delete(`/api/clients/${id}`)
    clients.value = clients.value.filter((c) => c.id !== id)
  }

  return { clients, isLoading, fetchAll, create, remove }
})
import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'
import type { TimeEntry, CreateTimeEntryPayload } from '../types/timeEntry'

export const useTimeEntriesStore = defineStore('timeEntries', () => {
  const entries = ref<TimeEntry[]>([])
  const isLoading = ref(false)

  async function fetchAll() {
    isLoading.value = true
    try {
      const response = await apiClient.get<TimeEntry[]>('/api/timeentries')
      entries.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function create(payload: CreateTimeEntryPayload) {
    const response = await apiClient.post<TimeEntry>('/api/timeentries', payload)
    entries.value.unshift(response.data)
  }

  async function remove(id: number) {
    await apiClient.delete(`/api/timeentries/${id}`)
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  return { entries, isLoading, fetchAll, create, remove }
})
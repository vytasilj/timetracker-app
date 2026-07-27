import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'
import type { Project, CreateProjectPayload } from '../types/project'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const isLoading = ref(false)

  async function fetchAll() {
    isLoading.value = true
    try {
      const response = await apiClient.get<Project[]>('/api/projects')
      projects.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function create(payload: CreateProjectPayload) {
    const response = await apiClient.post<Project>('/api/projects', payload)
    projects.value.push(response.data)
  }

  async function remove(id: number) {
    await apiClient.delete(`/api/projects/${id}`)
    projects.value = projects.value.filter((p) => p.id !== id)
  }

  return { projects, isLoading, fetchAll, create, remove }
})
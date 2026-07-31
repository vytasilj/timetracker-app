import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../api/client'
import type {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectRate,
  CreateProjectRatePayload,
} from '../types/project'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const ratesByProject = ref<Record<number, ProjectRate[]>>({})

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

  async function update(id: number, payload: UpdateProjectPayload) {
    await apiClient.put(`/api/projects/${id}`, payload)
    await fetchAll()
  }

  async function remove(id: number) {
    await apiClient.delete(`/api/projects/${id}`)
    projects.value = projects.value.filter((p) => p.id !== id)
  }

  async function fetchRates(projectId: number) {
    const response = await apiClient.get<ProjectRate[]>(`/api/projects/${projectId}/rates`)
    ratesByProject.value[projectId] = response.data
  }

  async function addRate(projectId: number, payload: CreateProjectRatePayload) {
    await apiClient.post(`/api/projects/${projectId}/rates`, payload)
    await fetchRates(projectId)
    await fetchAll()
  }

  async function deleteRate(projectId: number, rateId: number) {
    await apiClient.delete(`/api/projects/${projectId}/rates/${rateId}`)
    await fetchRates(projectId)
    await fetchAll()
  }

  return { projects, isLoading, ratesByProject, fetchAll, create, update, remove, fetchRates, addRate, deleteRate }
})
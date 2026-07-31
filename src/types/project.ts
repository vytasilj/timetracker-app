export type ProjectStatus = 'Active' | 'Closed'

export interface Project {
  id: number
  clientId: number
  clientName: string
  name: string
  currentHourlyRate: number
  status: ProjectStatus
}

export interface CreateProjectPayload {
  clientId: number
  name: string
  initialHourlyRate: number
  effectiveFrom: string
}

export interface UpdateProjectPayload {
  name: string
  status: ProjectStatus
}

export interface ProjectRate {
  id: number
  hourlyRate: number
  effectiveFrom: string
}

export interface CreateProjectRatePayload {
  hourlyRate: number
  effectiveFrom: string
}
export type ProjectStatus = 'Active' | 'Closed'

export interface Project {
  id: number
  clientId: number
  clientName: string
  name: string
  defaultHourlyRate: number
  status: ProjectStatus
}

export interface CreateProjectPayload {
  clientId: number
  name: string
  defaultHourlyRate: number
}
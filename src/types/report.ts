export interface ProjectSummary {
    projectId: number
    projectName: string
    totalHours: number
    totalEarnings: number
  }
  
  export interface ClientSummary {
    clientId: number
    clientName: string
    totalHours: number
    totalEarnings: number
    projects: ProjectSummary[]
  }
  
  export interface MonthlySummary {
    year: number
    month: number
    totalHours: number
    totalEarnings: number
    clients: ClientSummary[]
  }
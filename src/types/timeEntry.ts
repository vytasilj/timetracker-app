export interface TimeEntry {
  id: number
  projectId: number
  projectName: string
  date: string
  startTime: string | null
  endTime: string | null
  deductLunchBreak: boolean
  hours: number | null
  hourlyRateOverride: number | null
  effectiveHourlyRate: number
  description: string | null
}

export interface CreateTimeEntryPayload {
  projectId: number
  date: string
  startTime: string | null
  endTime: string | null
  deductLunchBreak: boolean
  hours: number | null
  hourlyRateOverride: number | null
  description: string | null
}

export interface UpdateTimeEntryPayload {
  date: string
  startTime: string | null
  endTime: string | null
  deductLunchBreak: boolean
  hours: number | null
  hourlyRateOverride: number | null
  description: string | null
}
export interface Client {
  id: number
  name: string
  contactEmail: string | null
  note: string | null
}

export interface CreateClientPayload {
  name: string
  contactEmail: string | null
  note: string | null
}
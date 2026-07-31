import axios from 'axios'
import { getAccessToken } from './googleAuth'

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const SPREADSHEET_ID_KEY = 'timetracker-google-spreadsheet-id'

async function authedClient() {
  const token = await getAccessToken()
  return axios.create({
    baseURL: SHEETS_API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  })
}

async function getOrCreateSpreadsheet(firstSheetTitle: string): Promise<string> {
  const stored = localStorage.getItem(SPREADSHEET_ID_KEY)
  if (stored) {
    try {
      const client = await authedClient()
      await client.get(`/${stored}`)
      return stored
    } catch {
      localStorage.removeItem(SPREADSHEET_ID_KEY)
    }
  }

  const client = await authedClient()
  const response = await client.post('', {
    properties: { title: 'Time Tracker Summary' },
    sheets: [{ properties: { title: firstSheetTitle } }],
  })
  const spreadsheetId = response.data.spreadsheetId as string
  localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId)
  return spreadsheetId
}

async function ensureMonthSheetExists(spreadsheetId: string, sheetTitle: string): Promise<void> {
  const client = await authedClient()
  const { data } = await client.get(`/${spreadsheetId}`)
  const exists = data.sheets.some((s: any) => s.properties.title === sheetTitle)
  if (exists) return

  await client.post(`/${spreadsheetId}:batchUpdate`, {
    requests: [{ addSheet: { properties: { title: sheetTitle } } }],
  })
}

export interface SummaryRow {
  client: string
  project: string
  hours: number
  earnings: number
}

export async function exportMonthlySummary(
  year: number,
  month: number,
  rows: SummaryRow[],
  totalHours: number,
  totalEarnings: number,
): Promise<string> {
  const sheetTitle = `${year}-${String(month).padStart(2, '0')}`
  const spreadsheetId = await getOrCreateSpreadsheet(sheetTitle)
  await ensureMonthSheetExists(spreadsheetId, sheetTitle)

  const client = await authedClient()

  const values = [
    ['Client', 'Project', 'Hours', 'Earnings'],
    ...rows.map((r) => [r.client, r.project, r.hours, r.earnings]),
    [],
    ['Total', '', totalHours, totalEarnings],
  ]

  await client.put(
    `/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:D${values.length}?valueInputOption=USER_ENTERED`,
    { values },
  )

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
}
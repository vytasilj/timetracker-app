<script setup lang="ts">
import { ref } from 'vue'
import apiClient from '../api/client'
import type { MonthlySummary } from '../types/report'
import { exportMonthlySummary, type SummaryRow } from '../google/sheetsApi'

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)

const summary = ref<MonthlySummary | null>(null)
const isLoading = ref(false)
const isExporting = ref(false)
const errorMessage = ref('')
const exportedUrl = ref('')

async function loadSummary() {
  isLoading.value = true
  errorMessage.value = ''
  summary.value = null
  try {
    const response = await apiClient.get<MonthlySummary>('/api/reports/monthly-summary', {
      params: { year: year.value, month: month.value },
    })
    summary.value = response.data
  } catch {
    errorMessage.value = 'Could not load summary.'
  } finally {
    isLoading.value = false
  }
}

async function handleExport() {
  if (!summary.value) return
  isExporting.value = true
  errorMessage.value = ''
  exportedUrl.value = ''
  try {
    const rows: SummaryRow[] = summary.value.clients.flatMap((client) =>
      client.projects.map((project) => ({
        client: client.clientName,
        project: project.projectName,
        hours: project.totalHours,
        earnings: project.totalEarnings,
      })),
    )
    exportedUrl.value = await exportMonthlySummary(
      summary.value.year,
      summary.value.month,
      rows,
      summary.value.totalHours,
      summary.value.totalEarnings,
    )
  } catch {
    errorMessage.value = 'Export to Google Sheets failed. Try again.'
  } finally {
    isExporting.value = false
  }
}

loadSummary()
</script>

<template>
  <div class="p-8">
    <h1 class="mb-6 text-2xl font-bold text-ink">Reports</h1>

    <div class="mb-6 flex flex-wrap items-end gap-3">
      <div>
        <label class="mb-1 block text-sm text-ink-muted">Year</label>
        <input v-model.number="year" type="number"
          class="w-28 rounded-md border border-border bg-surface-alt px-3 py-2 text-ink" />
      </div>
      <div>
        <label class="mb-1 block text-sm text-ink-muted">Month</label>
        <input v-model.number="month" type="number" min="1" max="12"
          class="w-24 rounded-md border border-border bg-surface-alt px-3 py-2 text-ink" />
      </div>
      <button @click="loadSummary" class="rounded-md border border-border px-4 py-2 text-ink hover:border-accent">
        Load
      </button>
      <button @click="handleExport" :disabled="!summary || isExporting"
        class="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong disabled:opacity-50">
        {{ isExporting ? 'Exporting…' : 'Export to Google Sheets' }}
      </button>
    </div>

    <p v-if="errorMessage" class="mb-4 text-sm text-red-500">{{ errorMessage }}</p>
    <p v-if="exportedUrl" class="mb-4 text-sm text-accent">
      Exported — <a :href="exportedUrl" target="_blank" class="underline">open spreadsheet</a>
    </p>
    <p v-if="isLoading" class="text-ink-muted">Loading…</p>

    <div v-else-if="summary" class="space-y-4">
      <div v-for="client in summary.clients" :key="client.clientId"
        class="rounded-lg border border-border bg-surface-alt p-4">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="font-semibold text-ink">{{ client.clientName }}</h2>
          <span class="text-sm text-ink-muted">{{ client.totalHours }} h — {{ client.totalEarnings }}</span>
        </div>
        <table class="w-full text-sm">
          <tr v-for="project in client.projects" :key="project.projectId" class="border-t border-border">
            <td class="py-1 text-ink-muted">{{ project.projectName }}</td>
            <td class="py-1 text-right text-ink-muted">{{ project.totalHours }} h</td>
            <td class="py-1 text-right text-ink-muted">{{ project.totalEarnings }}</td>
          </tr>
        </table>
      </div>

      <div class="rounded-lg border border-accent bg-surface-alt p-4 font-semibold text-ink">
        Total: {{ summary.totalHours }} h — {{ summary.totalEarnings }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTimeEntriesStore } from '../stores/timeEntries'
import { useProjectsStore } from '../stores/projects'
import type { TimeEntry } from '../types/timeEntry'
import TimePicker from '../components/TimePicker.vue'

const timeEntriesStore = useTimeEntriesStore()
const projectsStore = useProjectsStore()

type EntryMode = 'hours' | 'startEnd'

const editingId = ref<number | null>(null)
const projectId = ref<number | null>(null)
const date = ref(new Date().toISOString().slice(0, 10))
const mode = ref<EntryMode>('startEnd')
const hours = ref<number | null>(null)
const startTime = ref('')
const endTime = ref('')
const deductLunchBreak = ref(false)
const description = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

onMounted(() => {
  timeEntriesStore.fetchAll()
  projectsStore.fetchAll()
})

function currentTimeString(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function resetForm() {
  editingId.value = null
  projectId.value = null
  date.value = new Date().toISOString().slice(0, 10)
  mode.value = 'startEnd'
  hours.value = null
  startTime.value = ''
  endTime.value = ''
  deductLunchBreak.value = false
  description.value = ''
  errorMessage.value = ''
}

function startEditing(entry: TimeEntry) {
  editingId.value = entry.id
  projectId.value = entry.projectId
  date.value = entry.date
  hours.value = entry.hours
  startTime.value = entry.startTime?.slice(0, 5) ?? ''
  endTime.value = entry.endTime?.slice(0, 5) ?? ''
  deductLunchBreak.value = entry.deductLunchBreak
  description.value = entry.description ?? ''
  mode.value = entry.startTime ? 'startEnd' : 'hours'
  errorMessage.value = ''

  // Convenience: if this entry is still open (has a start but no end yet),
  // prefill the end time with "now" so finishing it up is a single click away.
  if (entry.startTime && !entry.endTime) {
    endTime.value = currentTimeString()
  }
}

function cancelEditing() {
  resetForm()
}

const isFormValid = computed(() => {
  if (!projectId.value || !date.value) return false
  if (mode.value === 'hours') return !!hours.value
  return !!startTime.value
})

async function handleSubmit() {
  if (!projectId.value) return

  errorMessage.value = ''
  isSubmitting.value = true

  const payload = {
    date: date.value,
    startTime: mode.value === 'startEnd' && startTime.value ? `${startTime.value}:00` : null,
    endTime: mode.value === 'startEnd' && endTime.value ? `${endTime.value}:00` : null,
    deductLunchBreak: deductLunchBreak.value,
    hours: mode.value === 'hours' ? hours.value : null,
    hourlyRateOverride: null,
    description: description.value || null,
  }

  try {
    if (editingId.value) {
      await timeEntriesStore.update(editingId.value, payload)
    } else {
      await timeEntriesStore.create({ projectId: projectId.value, ...payload })
    }
    resetForm()
  } catch {
    errorMessage.value = 'Could not save entry. Check the form and try again.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(id: number) {
  if (!confirm('Delete this entry?')) return
  if (editingId.value === id) resetForm()
  await timeEntriesStore.remove(id)
}
</script>

<template>
  <div class="p-8">
    <h1 class="mb-6 text-2xl font-bold text-ink">Time Entries</h1>

    <form @submit.prevent="handleSubmit" class="mb-8 space-y-3 rounded-lg border border-border bg-surface-alt p-4">
      <p v-if="editingId" class="text-sm font-medium text-accent">Editing entry #{{ editingId }}</p>

      <div class="flex flex-wrap gap-3">
        <select v-model="projectId" required
          class="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-ink">
          <option :value="null" disabled>Select project…</option>
          <option v-for="project in projectsStore.projects" :key="project.id" :value="project.id">
            {{ project.name }} ({{ project.clientName }})
          </option>
        </select>
        <input v-model="date" type="date" required
          class="rounded-md border border-border bg-surface px-3 py-2 text-ink" />
      </div>

      <div class="flex gap-4 text-sm text-ink">
        <label class="flex items-center gap-2">
          <input type="radio" value="startEnd" v-model="mode" /> Start / end time
        </label>
        <label class="flex items-center gap-2">
          <input type="radio" value="hours" v-model="mode" /> Enter hours directly
        </label>
      </div>

      <div v-if="mode === 'hours'" class="flex gap-3">
        <input v-model.number="hours" type="number" step="0.25" min="0.25" placeholder="Hours"
          class="w-40 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
      </div>

      <div v-else class="flex flex-wrap items-center gap-2">
        <TimePicker v-model="startTime" placeholder="Start (HH:mm)" />
        <button type="button" @click="startTime = currentTimeString()"
          class="rounded-md border border-border px-2 py-1 text-xs text-ink-muted hover:border-accent hover:text-accent">
          Now
        </button>

        <span class="text-ink-muted">to</span>

        <TimePicker v-model="endTime" placeholder="End (optional)" />
        <button type="button" @click="endTime = currentTimeString()"
          class="rounded-md border border-border px-2 py-1 text-xs text-ink-muted hover:border-accent hover:text-accent">
          Now
        </button>

        <label class="ml-2 flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" v-model="deductLunchBreak" /> Deduct 30 min lunch break
        </label>
      </div>
      <p v-if="mode === 'startEnd'" class="text-xs text-ink-muted">
        Leave "to" empty to log the start of a task now, and fill in the end time later by editing this entry.
      </p>

      <input v-model="description" placeholder="Description (optional)"
        class="w-full rounded-md border border-border bg-surface px-3 py-2 text-ink" />

      <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>

      <div class="flex gap-2">
        <button type="submit" :disabled="isSubmitting || !isFormValid"
          class="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong disabled:opacity-50">
          {{ editingId ? 'Save changes' : 'Add entry' }}
        </button>
        <button v-if="editingId" type="button" @click="cancelEditing"
          class="rounded-md border border-border px-4 py-2 text-ink hover:border-accent">
          Cancel
        </button>
      </div>
    </form>

    <p v-if="timeEntriesStore.isLoading" class="text-ink-muted">Loading…</p>

    <table v-else class="w-full border-collapse overflow-hidden rounded-lg border border-border">
      <thead>
        <tr class="bg-surface-alt text-left text-sm text-ink-muted">
          <th class="px-4 py-2">Date</th>
          <th class="px-4 py-2">Project</th>
          <th class="px-4 py-2">Hours</th>
          <th class="px-4 py-2">Description</th>
          <th class="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in timeEntriesStore.entries" :key="entry.id" class="border-t border-border">
          <td class="px-4 py-2 text-ink">{{ entry.date }}</td>
          <td class="px-4 py-2 text-ink-muted">{{ entry.projectName }}</td>
          <td class="px-4 py-2">
            <span v-if="entry.hours === null" class="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              In progress
            </span>
            <span v-else class="text-ink-muted">{{ entry.hours }}</span>
          </td>
          <td class="px-4 py-2 text-ink-muted">{{ entry.description ?? '—' }}</td>
          <td class="px-4 py-2 text-right">
            <button @click="startEditing(entry)" class="mr-3 text-sm text-accent hover:underline">Edit</button>
            <button @click="handleDelete(entry.id)" class="text-sm text-red-500 hover:underline">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
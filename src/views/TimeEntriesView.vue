<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTimeEntriesStore } from '../stores/timeEntries'
import { useProjectsStore } from '../stores/projects'

const timeEntriesStore = useTimeEntriesStore()
const projectsStore = useProjectsStore()

type EntryMode = 'hours' | 'startEnd'

const projectId = ref<number | null>(null)
const date = ref(new Date().toISOString().slice(0, 10))
const mode = ref<EntryMode>('hours')
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

const isFormValid = computed(() => {
  if (!projectId.value || !date.value) return false
  if (mode.value === 'hours') return !!hours.value
  return !!startTime.value && !!endTime.value
})

async function handleCreate() {
  if (!projectId.value) return

  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await timeEntriesStore.create({
      projectId: projectId.value,
      date: date.value,
      startTime: mode.value === 'startEnd' ? `${startTime.value}:00` : null,
      endTime: mode.value === 'startEnd' ? `${endTime.value}:00` : null,
      deductLunchBreak: deductLunchBreak.value,
      hours: mode.value === 'hours' ? hours.value : null,
      hourlyRateOverride: null,
      description: description.value || null,
    })
    hours.value = null
    startTime.value = ''
    endTime.value = ''
    description.value = ''
  } catch {
    errorMessage.value = 'Could not create entry. Check the form and try again.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(id: number) {
  if (!confirm('Delete this entry?')) return
  await timeEntriesStore.remove(id)
}
</script>

<template>
  <div class="p-8">
    <h1 class="mb-6 text-2xl font-bold text-ink">Time Entries</h1>

    <form @submit.prevent="handleCreate" class="mb-8 space-y-3 rounded-lg border border-border bg-surface-alt p-4">
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
          <input type="radio" value="hours" v-model="mode" /> Enter hours directly
        </label>
        <label class="flex items-center gap-2">
          <input type="radio" value="startEnd" v-model="mode" /> Enter start/end time
        </label>
      </div>

      <div v-if="mode === 'hours'" class="flex gap-3">
        <input v-model.number="hours" type="number" step="0.25" min="0.25" placeholder="Hours"
          class="w-40 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
      </div>

      <div v-else class="flex flex-wrap items-center gap-3">
        <input v-model="startTime" type="time" required
          class="rounded-md border border-border bg-surface px-3 py-2 text-ink" />
        <span class="text-ink-muted">to</span>
        <input v-model="endTime" type="time" required
          class="rounded-md border border-border bg-surface px-3 py-2 text-ink" />
        <label class="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" v-model="deductLunchBreak" /> Deduct 30 min lunch break
        </label>
      </div>

      <input v-model="description" placeholder="Description (optional)"
        class="w-full rounded-md border border-border bg-surface px-3 py-2 text-ink" />

      <button type="submit" :disabled="isSubmitting || !isFormValid"
        class="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong disabled:opacity-50">
        Add entry
      </button>
    </form>

    <p v-if="errorMessage" class="mb-4 text-sm text-red-500">{{ errorMessage }}</p>

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
          <td class="px-4 py-2 text-ink-muted">{{ entry.hours }}</td>
          <td class="px-4 py-2 text-ink-muted">{{ entry.description ?? '—' }}</td>
          <td class="px-4 py-2 text-right">
            <button @click="handleDelete(entry.id)" class="text-sm text-red-500 hover:underline">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
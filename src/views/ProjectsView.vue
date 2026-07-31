<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useClientsStore } from '../stores/clients'
import type { Project } from '../types/project'

const projectsStore = useProjectsStore()
const clientsStore = useClientsStore()

// --- Create form ---
const clientId = ref<number | null>(null)
const name = ref('')
const initialHourlyRate = ref<number | null>(null)
const effectiveFrom = ref(new Date().toISOString().slice(0, 10))
const isSubmitting = ref(false)
const errorMessage = ref('')

onMounted(() => {
  projectsStore.fetchAll()
  clientsStore.fetchAll()
})

async function handleCreate() {
  if (!clientId.value || !initialHourlyRate.value) return
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await projectsStore.create({
      clientId: clientId.value,
      name: name.value,
      initialHourlyRate: initialHourlyRate.value,
      effectiveFrom: effectiveFrom.value,
    })
    name.value = ''
    initialHourlyRate.value = null
  } catch {
    errorMessage.value = 'Could not create project. Check the form and try again.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(id: number) {
  if (!confirm('Delete this project?')) return
  await projectsStore.remove(id)
}

// --- Inline row editing (name/status) ---
const editingId = ref<number | null>(null)
const editName = ref('')
const editStatus = ref<'Active' | 'Closed'>('Active')

function startEditing(project: Project) {
  editingId.value = project.id
  editName.value = project.name
  editStatus.value = project.status
}

function cancelEditing() {
  editingId.value = null
}

async function saveEditing(id: number) {
  await projectsStore.update(id, { name: editName.value, status: editStatus.value })
  editingId.value = null
}

// --- Rate history panel ---
const expandedProjectId = ref<number | null>(null)
const newRateAmount = reactive<Record<number, number | null>>({})
const newRateEffectiveFrom = reactive<Record<number, string>>({})
const rateError = ref('')

async function toggleRates(projectId: number) {
  if (expandedProjectId.value === projectId) {
    expandedProjectId.value = null
    return
  }
  expandedProjectId.value = projectId
  rateError.value = ''
  if (!projectsStore.ratesByProject[projectId]) {
    await projectsStore.fetchRates(projectId)
  }
  if (!(projectId in newRateEffectiveFrom)) {
    newRateEffectiveFrom[projectId] = new Date().toISOString().slice(0, 10)
  }
}

async function addRate(projectId: number) {
  const amount = newRateAmount[projectId]
  const date = newRateEffectiveFrom[projectId]
  if (!amount || !date) return
  rateError.value = ''
  try {
    await projectsStore.addRate(projectId, { hourlyRate: amount, effectiveFrom: date })
    newRateAmount[projectId] = null
  } catch {
    rateError.value = 'Could not add rate. A rate for that date may already exist.'
  }
}

async function deleteRate(projectId: number, rateId: number) {
  if (!confirm('Delete this rate?')) return
  rateError.value = ''
  try {
    await projectsStore.deleteRate(projectId, rateId)
  } catch {
    rateError.value = 'Could not delete rate — a project must always have at least one.'
  }
}
</script>

<template>
  <div class="p-8">
    <h1 class="mb-6 text-2xl font-bold text-ink">Projects</h1>

    <form @submit.prevent="handleCreate" class="mb-8 flex flex-wrap gap-3 rounded-lg border border-border bg-surface-alt p-4">
      <select v-model="clientId" required
        class="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-ink">
        <option :value="null" disabled>Select client…</option>
        <option v-for="client in clientsStore.clients" :key="client.id" :value="client.id">
          {{ client.name }}
        </option>
      </select>
      <input v-model="name" placeholder="Project name" required
        class="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
      <input v-model.number="initialHourlyRate" placeholder="Hourly rate" type="number" step="0.01" min="0.01" required
        class="w-36 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
      <input v-model="effectiveFrom" type="date" required
        class="rounded-md border border-border bg-surface px-3 py-2 text-ink" />
      <button type="submit" :disabled="isSubmitting"
        class="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong disabled:opacity-50">
        Add project
      </button>
    </form>

    <p v-if="errorMessage" class="mb-4 text-sm text-red-500">{{ errorMessage }}</p>
    <p v-if="projectsStore.isLoading" class="text-ink-muted">Loading…</p>

    <table v-else class="w-full border-collapse overflow-hidden rounded-lg border border-border">
      <thead>
        <tr class="bg-surface-alt text-left text-sm text-ink-muted">
          <th class="px-4 py-2">Project</th>
          <th class="px-4 py-2">Client</th>
          <th class="px-4 py-2">Current rate</th>
          <th class="px-4 py-2">Status</th>
          <th class="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="project in projectsStore.projects" :key="project.id">
          <tr class="border-t border-border">
            <td class="px-4 py-2 text-ink">
              <input v-if="editingId === project.id" v-model="editName"
                class="w-full rounded-md border border-border bg-surface px-2 py-1 text-ink" />
              <span v-else>{{ project.name }}</span>
            </td>
            <td class="px-4 py-2 text-ink-muted">{{ project.clientName }}</td>
            <td class="px-4 py-2 text-ink-muted">{{ project.currentHourlyRate }} / h</td>
            <td class="px-4 py-2">
              <select v-if="editingId === project.id" v-model="editStatus"
                class="rounded-md border border-border bg-surface px-2 py-1 text-ink">
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
              <span v-else class="text-ink-muted">{{ project.status }}</span>
            </td>
            <td class="whitespace-nowrap px-4 py-2 text-right">
              <template v-if="editingId === project.id">
                <button @click="saveEditing(project.id)" class="mr-3 text-sm text-accent hover:underline">Save</button>
                <button @click="cancelEditing" class="mr-3 text-sm text-ink-muted hover:underline">Cancel</button>
              </template>
              <template v-else>
                <button @click="toggleRates(project.id)" class="mr-3 text-sm text-accent hover:underline">
                  {{ expandedProjectId === project.id ? 'Hide rates' : 'Rates' }}
                </button>
                <button @click="startEditing(project)" class="mr-3 text-sm text-accent hover:underline">Edit</button>
                <button @click="handleDelete(project.id)" class="text-sm text-red-500 hover:underline">Delete</button>
              </template>
            </td>
          </tr>
          <tr v-if="expandedProjectId === project.id" class="border-t border-border bg-surface">
            <td colspan="5" class="px-4 py-4">
              <p class="mb-2 text-sm font-medium text-ink">Rate history</p>
              <p v-if="rateError" class="mb-2 text-sm text-red-500">{{ rateError }}</p>
              <table class="mb-3 w-full text-sm">
                <thead>
                  <tr class="text-left text-ink-muted">
                    <th class="py-1 pr-4">Effective from</th>
                    <th class="py-1 pr-4">Rate</th>
                    <th class="py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rate in projectsStore.ratesByProject[project.id]" :key="rate.id" class="border-t border-border">
                    <td class="py-1 pr-4 text-ink">{{ rate.effectiveFrom }}</td>
                    <td class="py-1 pr-4 text-ink-muted">{{ rate.hourlyRate }} / h</td>
                    <td class="py-1 text-right">
                      <button @click="deleteRate(project.id, rate.id)" class="text-xs text-red-500 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="flex flex-wrap items-center gap-2">
                <input v-model.number="newRateAmount[project.id]" type="number" step="0.01" min="0.01" placeholder="New rate"
                  class="w-32 rounded-md border border-border bg-surface-alt px-2 py-1 text-sm text-ink" />
                <input v-model="newRateEffectiveFrom[project.id]" type="date"
                  class="rounded-md border border-border bg-surface-alt px-2 py-1 text-sm text-ink" />
                <button @click="addRate(project.id)"
                  class="rounded-md bg-accent px-3 py-1 text-sm font-medium text-white hover:bg-accent-strong">
                  Add rate
                </button>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useClientsStore } from '../stores/clients'

const projectsStore = useProjectsStore()
const clientsStore = useClientsStore()

const clientId = ref<number | null>(null)
const name = ref('')
const defaultHourlyRate = ref<number | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')

onMounted(() => {
  projectsStore.fetchAll()
  clientsStore.fetchAll()
})

async function handleCreate() {
  if (!clientId.value || !defaultHourlyRate.value) return

  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await projectsStore.create({
      clientId: clientId.value,
      name: name.value,
      defaultHourlyRate: defaultHourlyRate.value,
    })
    name.value = ''
    defaultHourlyRate.value = null
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
      <input v-model.number="defaultHourlyRate" placeholder="Hourly rate" type="number" step="0.01" min="0" required
        class="w-40 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
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
          <th class="px-4 py-2">Rate</th>
          <th class="px-4 py-2">Status</th>
          <th class="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="project in projectsStore.projects" :key="project.id" class="border-t border-border">
          <td class="px-4 py-2 text-ink">{{ project.name }}</td>
          <td class="px-4 py-2 text-ink-muted">{{ project.clientName }}</td>
          <td class="px-4 py-2 text-ink-muted">{{ project.defaultHourlyRate }} / h</td>
          <td class="px-4 py-2 text-ink-muted">{{ project.status }}</td>
          <td class="px-4 py-2 text-right">
            <button @click="handleDelete(project.id)" class="text-sm text-red-500 hover:underline">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
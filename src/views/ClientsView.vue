<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useClientsStore } from '../stores/clients'
import type { Client } from '../types/client'

const clientsStore = useClientsStore()

const editingId = ref<number | null>(null)
const name = ref('')
const contactEmail = ref('')
const note = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

onMounted(() => {
  clientsStore.fetchAll()
})

function resetForm() {
  editingId.value = null
  name.value = ''
  contactEmail.value = ''
  note.value = ''
  errorMessage.value = ''
}

function startEditing(client: Client) {
  editingId.value = client.id
  name.value = client.name
  contactEmail.value = client.contactEmail ?? ''
  note.value = client.note ?? ''
  errorMessage.value = ''
}

async function handleSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true
  const payload = {
    name: name.value,
    contactEmail: contactEmail.value || null,
    note: note.value || null,
  }
  try {
    if (editingId.value) {
      await clientsStore.update(editingId.value, payload)
    } else {
      await clientsStore.create(payload)
    }
    resetForm()
  } catch {
    errorMessage.value = 'Could not save client. Check the form and try again.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(id: number) {
  if (!confirm('Delete this client?')) return
  if (editingId.value === id) resetForm()
  await clientsStore.remove(id)
}
</script>

<template>
  <div class="p-8">
    <h1 class="mb-6 text-2xl font-bold text-ink">Clients</h1>

    <form @submit.prevent="handleSubmit" class="mb-8 space-y-3 rounded-lg border border-border bg-surface-alt p-4">
      <p v-if="editingId" class="text-sm font-medium text-accent">Editing client #{{ editingId }}</p>
      <div class="flex flex-wrap gap-3">
        <input v-model="name" placeholder="Name" required
          class="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
        <input v-model="contactEmail" placeholder="Email (optional)" type="email"
          class="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
        <input v-model="note" placeholder="Note (optional)"
          class="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
      </div>
      <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>
      <div class="flex gap-2">
        <button type="submit" :disabled="isSubmitting"
          class="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong disabled:opacity-50">
          {{ editingId ? 'Save changes' : 'Add client' }}
        </button>
        <button v-if="editingId" type="button" @click="resetForm"
          class="rounded-md border border-border px-4 py-2 text-ink hover:border-accent">
          Cancel
        </button>
      </div>
    </form>

    <p v-if="clientsStore.isLoading" class="text-ink-muted">Loading…</p>

    <table v-else class="w-full border-collapse overflow-hidden rounded-lg border border-border">
      <thead>
        <tr class="bg-surface-alt text-left text-sm text-ink-muted">
          <th class="px-4 py-2">Name</th>
          <th class="px-4 py-2">Email</th>
          <th class="px-4 py-2">Note</th>
          <th class="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="client in clientsStore.clients" :key="client.id" class="border-t border-border">
          <td class="px-4 py-2 text-ink">{{ client.name }}</td>
          <td class="px-4 py-2 text-ink-muted">{{ client.contactEmail ?? '—' }}</td>
          <td class="px-4 py-2 text-ink-muted">{{ client.note ?? '—' }}</td>
          <td class="px-4 py-2 text-right">
            <button @click="startEditing(client)" class="mr-3 text-sm text-accent hover:underline">Edit</button>
            <button @click="handleDelete(client.id)" class="text-sm text-red-500 hover:underline">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
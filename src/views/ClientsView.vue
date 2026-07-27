<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useClientsStore } from '../stores/clients'

const clientsStore = useClientsStore()

const name = ref('')
const contactEmail = ref('')
const note = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

onMounted(() => {
  clientsStore.fetchAll()
})

async function handleCreate() {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await clientsStore.create({
      name: name.value,
      contactEmail: contactEmail.value || null,
      note: note.value || null,
    })
    name.value = ''
    contactEmail.value = ''
    note.value = ''
  } catch {
    errorMessage.value = 'Could not create client. Check the form and try again.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(id: number) {
  if (!confirm('Delete this client?')) return
  await clientsStore.remove(id)
}
</script>

<template>
  <div class="p-8">
    <h1 class="mb-6 text-2xl font-bold text-ink">Clients</h1>

    <form @submit.prevent="handleCreate" class="mb-8 flex flex-wrap gap-3 rounded-lg border border-border bg-surface-alt p-4">
      <input v-model="name" placeholder="Name" required
        class="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
      <input v-model="contactEmail" placeholder="Email (optional)" type="email"
        class="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
      <input v-model="note" placeholder="Note (optional)"
        class="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
      <button type="submit" :disabled="isSubmitting"
        class="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong disabled:opacity-50">
        Add client
      </button>
    </form>

    <p v-if="errorMessage" class="mb-4 text-sm text-red-500">{{ errorMessage }}</p>

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
            <button @click="handleDelete(client.id)" class="text-sm text-red-500 hover:underline">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
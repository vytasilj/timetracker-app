<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const sessionExpired = ref(false)
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  if (route.query.sessionExpired) {
    sessionExpired.value = true
  }
})

async function handleSubmit() {
  errorMessage.value = ''
  sessionExpired.value = false
  isLoading.value = true
  try {
    await authStore.login(email.value, password.value)
    router.push('/time-entries')
  } catch {
    errorMessage.value = 'Invalid email or password.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface">
    <form @submit.prevent="handleSubmit" class="w-full max-w-sm rounded-lg border border-border bg-surface-alt p-8">
      <h1 class="mb-6 text-xl font-bold text-ink">Log in</h1>

      <div
        v-if="sessionExpired"
        class="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400"
      >
        Your session has expired. Please log in again.
      </div>

      <label class="mb-1 block text-sm text-ink-muted">Email</label>
      <input v-model="email" type="email" required
        class="mb-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-ink" />

      <label class="mb-1 block text-sm text-ink-muted">Password</label>
      <input v-model="password" type="password" required
        class="mb-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-ink" />

      <p v-if="errorMessage" class="mb-4 text-sm text-red-500">{{ errorMessage }}</p>

      <button type="submit" :disabled="isLoading"
        class="w-full rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong disabled:opacity-50">
        {{ isLoading ? 'Logging in…' : 'Log in' }}
      </button>
    </form>
  </div>
</template>
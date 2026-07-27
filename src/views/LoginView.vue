<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

async function handleSubmit() {
  errorMessage.value = ''
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
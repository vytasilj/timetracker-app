<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useTheme } from './composables/useTheme'
import { useAuthStore } from './stores/auth'

const { theme, toggleTheme } = useTheme()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-surface text-ink transition-colors">
    <nav v-if="route.name !== 'login'" class="flex items-center justify-between border-b border-border bg-surface-alt px-6 py-4">
      <div class="flex gap-4">
        <RouterLink to="/time-entries" class="text-ink hover:text-accent">Time Entries</RouterLink>
        <RouterLink to="/clients" class="text-ink hover:text-accent">Clients</RouterLink>
        <RouterLink to="/projects" class="text-ink hover:text-accent">Projects</RouterLink>
        <RouterLink to="/reports" class="text-ink hover:text-accent">Reports</RouterLink>
      </div>
      <div class="flex items-center gap-3">
        <button @click="toggleTheme" class="rounded-md border border-border px-3 py-1 text-sm text-ink hover:border-accent">
          {{ theme === 'dark' ? '☀️' : '🌙' }}
        </button>
        <button @click="handleLogout" class="rounded-md border border-border px-3 py-1 text-sm text-ink hover:border-accent">
          Log out
        </button>
      </div>
    </nav>
    <RouterView />
  </div>
</template>
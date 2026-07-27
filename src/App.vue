<script setup lang="ts">
import { useTheme } from './composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <div class="min-h-screen bg-surface text-ink transition-colors">
    <div class="p-8">
      <h1 class="text-3xl font-bold text-accent">Tailwind funguje</h1>
      <button
        @click="toggleTheme"
        class="mt-4 rounded-md border border-border bg-surface-alt px-4 py-2 text-ink hover:border-accent"
      >
        Aktuální motiv: {{ theme }} (klikni pro přepnutí)
      </button>
    </div>
  </div>
</template>

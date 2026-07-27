import { ref, watchEffect } from 'vue'

const THEME_KEY = 'timetracker-theme'
type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<Theme>(getInitialTheme())

watchEffect(() => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  localStorage.setItem(THEME_KEY, theme.value)
})

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  return { theme, toggleTheme }
}
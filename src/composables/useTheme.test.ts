import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    // Force a fresh module instance for each test, since the theme state
    // is a module-level singleton — otherwise tests would leak state into each other.
    vi.resetModules()
  })

  it('defaults to light when nothing is stored and the system prefers light', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any
    const { useTheme } = await import('./useTheme')

    const { theme } = useTheme()

    expect(theme.value).toBe('light')
  })

  it('defaults to dark when the system prefers dark and nothing is stored', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any
    const { useTheme } = await import('./useTheme')

    const { theme } = useTheme()

    expect(theme.value).toBe('dark')
  })

  it('prefers a stored value over the system preference', async () => {
    localStorage.setItem('timetracker-theme', 'dark')
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any
    const { useTheme } = await import('./useTheme')

    const { theme } = useTheme()

    expect(theme.value).toBe('dark')
  })

  it('toggleTheme flips the value, persists it, and updates the <html> class', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any
    const { useTheme } = await import('./useTheme')
    const { theme, toggleTheme } = useTheme()

    toggleTheme()
    await nextTick()

    expect(theme.value).toBe('dark')
    expect(localStorage.getItem('timetracker-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
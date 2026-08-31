import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createApp, h, ref, nextTick, type App } from 'vue'
import TimePicker from './TimePicker.vue'

describe('TimePicker.vue', () => {
  let container: HTMLDivElement
  let app: App | null = null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (app) {
      app.unmount()
      app = null
    }
    container.remove()
  })

  it('renders with initial modelValue in 24h format', async () => {
    app = createApp({
      render: () => h(TimePicker, { modelValue: '14:30' }),
    })
    app.mount(container)

    const input = container.querySelector('input') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.value).toBe('14:30')
  })

  it('renders placeholder when provided', async () => {
    app = createApp({
      render: () => h(TimePicker, { placeholder: 'Start (HH:mm)' }),
    })
    app.mount(container)

    const input = container.querySelector('input') as HTMLInputElement
    expect(input.placeholder).toBe('Start (HH:mm)')
  })

  it('formats raw numeric input on blur correctly (e.g. "930" -> "09:30")', async () => {
    const time = ref('')
    app = createApp({
      setup() {
        return () =>
          h(TimePicker, {
            modelValue: time.value,
            'onUpdate:modelValue': (val: string) => {
              time.value = val
            },
          })
      },
    })
    app.mount(container)

    const input = container.querySelector('input') as HTMLInputElement
    input.value = '930'
    input.dispatchEvent(new Event('input'))
    input.dispatchEvent(new Event('blur'))
    await nextTick()

    expect(time.value).toBe('09:30')
    expect(input.value).toBe('09:30')
  })

  it('clamps invalid hours and minutes (e.g. "25:70" -> "23:59")', async () => {
    const time = ref('')
    app = createApp({
      setup() {
        return () =>
          h(TimePicker, {
            modelValue: time.value,
            'onUpdate:modelValue': (val: string) => {
              time.value = val
            },
          })
      },
    })
    app.mount(container)

    const input = container.querySelector('input') as HTMLInputElement
    input.value = '25:70'
    input.dispatchEvent(new Event('input'))
    input.dispatchEvent(new Event('blur'))
    await nextTick()

    expect(time.value).toBe('23:59')
    expect(input.value).toBe('23:59')
  })

  it('toggles dropdown when clicking the clock icon button', async () => {
    app = createApp({
      render: () => h(TimePicker, { modelValue: '08:00' }),
    })
    app.mount(container)

    const button = container.querySelector('button[aria-label="Toggle time picker"]') as HTMLButtonElement
    expect(button).not.toBeNull()

    // Initially dropdown should not exist
    expect(container.querySelector('.grid')).toBeNull()

    // Click to open
    button.click()
    await nextTick()

    expect(container.querySelector('.grid')).not.toBeNull()

    // Click to close
    button.click()
    await nextTick()

    expect(container.querySelector('.grid')).toBeNull()
  })

  it('allows picking hours and minutes from the dropdown', async () => {
    const time = ref('08:00')
    app = createApp({
      setup() {
        return () =>
          h(TimePicker, {
            modelValue: time.value,
            'onUpdate:modelValue': (val: string) => {
              time.value = val
            },
          })
      },
    })
    app.mount(container)

    const toggleBtn = container.querySelector('button[aria-label="Toggle time picker"]') as HTMLButtonElement
    toggleBtn.click()
    await nextTick()

    // Find hour button '15'
    const buttons = Array.from(container.querySelectorAll('button'))
    const hourBtn = buttons.find((b) => b.textContent?.trim() === '15')
    expect(hourBtn).toBeDefined()
    hourBtn?.click()
    await nextTick()

    expect(time.value).toBe('15:00')

    // Find minute button '45'
    const minBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === '45')
    expect(minBtn).toBeDefined()
    minBtn?.click()
    await nextTick()

    expect(time.value).toBe('15:45')
    // Dropdown should close after selecting minute
    expect(container.querySelector('.grid')).toBeNull()
  })

  it('clears value when Clear button is clicked', async () => {
    const time = ref('12:00')
    app = createApp({
      setup() {
        return () =>
          h(TimePicker, {
            modelValue: time.value,
            'onUpdate:modelValue': (val: string) => {
              time.value = val
            },
          })
      },
    })
    app.mount(container)

    const toggleBtn = container.querySelector('button[aria-label="Toggle time picker"]') as HTMLButtonElement
    toggleBtn.click()
    await nextTick()

    const clearBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Clear')
    expect(clearBtn).toBeDefined()
    clearBtn?.click()
    await nextTick()

    expect(time.value).toBe('')
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('')
  })
})

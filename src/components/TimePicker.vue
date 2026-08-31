<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    placeholder?: string
    disabled?: boolean
    required?: boolean
    id?: string
    name?: string
  }>(),
  {
    modelValue: '',
    placeholder: 'HH:mm',
    disabled: false,
    required: false,
    id: undefined,
    name: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'blur'): void
  (e: 'focus'): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const inputValue = ref(props.modelValue ?? '')

const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

// Parse current modelValue into selected hour and minute
const selectedHour = computed(() => {
  if (!props.modelValue || !props.modelValue.includes(':')) return null
  const [h] = props.modelValue.split(':')
  return h.padStart(2, '0')
})

const selectedMinute = computed(() => {
  if (!props.modelValue || !props.modelValue.includes(':')) return null
  const [, m] = props.modelValue.split(':')
  return m.padStart(2, '0')
})

watch(
  () => props.modelValue,
  (newVal) => {
    inputValue.value = newVal ?? ''
  },
)

function formatRawInput(raw: string): string {
  // Strip non-digits and non-colons
  const cleaned = raw.trim()
  if (!cleaned) return ''

  // If user entered digits only (e.g. "930" -> "09:30", "1430" -> "14:30", "8" -> "08:00")
  const digitsOnly = cleaned.replace(/\D/g, '')

  if (cleaned.includes(':')) {
    const parts = cleaned.split(':')
    let h = parseInt(parts[0], 10)
    let m = parseInt(parts[1], 10)

    if (isNaN(h)) h = 0
    if (isNaN(m)) m = 0

    h = Math.max(0, Math.min(23, h))
    m = Math.max(0, Math.min(59, m))

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  if (digitsOnly.length > 0) {
    if (digitsOnly.length === 1 || digitsOnly.length === 2) {
      let h = Math.min(23, parseInt(digitsOnly, 10))
      return `${String(h).padStart(2, '0')}:00`
    }
    if (digitsOnly.length === 3) {
      let h = Math.min(23, parseInt(digitsOnly.slice(0, 1), 10))
      let m = Math.min(59, parseInt(digitsOnly.slice(1), 10))
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    if (digitsOnly.length >= 4) {
      let h = Math.min(23, parseInt(digitsOnly.slice(0, 2), 10))
      let m = Math.min(59, parseInt(digitsOnly.slice(2, 4), 10))
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
  }

  return ''
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  inputValue.value = target.value
}

function handleBlur() {
  const formatted = formatRawInput(inputValue.value)
  inputValue.value = formatted
  emit('update:modelValue', formatted)
  emit('change', formatted)
  emit('blur')
}

function handleFocus() {
  emit('focus')
}

function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function selectHour(h: string) {
  const currentMin = selectedMinute.value ?? '00'
  const newValue = `${h}:${currentMin}`
  inputValue.value = newValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
}

function selectMinute(m: string) {
  const currentHour = selectedHour.value ?? '09'
  const newValue = `${currentHour}:${m}`
  inputValue.value = newValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
  closeDropdown()
}

function clear() {
  inputValue.value = ''
  emit('update:modelValue', '')
  emit('change', '')
  closeDropdown()
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="relative inline-flex items-center">
    <div class="relative flex items-center">
      <input
        :id="id"
        :name="name"
        type="text"
        inputmode="numeric"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :value="inputValue"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown.enter.prevent="handleBlur"
        class="w-32 rounded-md border border-border bg-surface px-3 py-2 pr-8 text-sm text-ink placeholder:text-ink-muted/50 focus:border-accent focus:outline-none disabled:opacity-50"
      />

      <button
        type="button"
        :disabled="disabled"
        @click="toggleDropdown"
        aria-label="Toggle time picker"
        class="absolute right-2 flex items-center text-ink-muted hover:text-accent disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>

    <!-- Dropdown Popover -->
    <div
      v-if="isOpen"
      class="absolute top-full left-0 z-50 mt-1 flex max-h-56 w-48 flex-col rounded-md border border-border bg-surface-alt p-2 shadow-lg"
    >
      <div class="grid grid-cols-2 gap-2 text-xs font-semibold text-ink-muted border-b border-border pb-1 mb-1 text-center">
        <span>Hours</span>
        <span>Minutes</span>
      </div>

      <div class="grid grid-cols-2 gap-1 overflow-hidden">
        <!-- Hours Column -->
        <div class="max-h-40 overflow-y-auto pr-1 space-y-0.5">
          <button
            v-for="h in hoursList"
            :key="h"
            type="button"
            @click="selectHour(h)"
            :class="[
              'w-full rounded px-1.5 py-1 text-center text-xs font-mono transition-colors',
              selectedHour === h
                ? 'bg-accent font-bold text-white'
                : 'text-ink hover:bg-accent/15',
            ]"
          >
            {{ h }}
          </button>
        </div>

        <!-- Minutes Column -->
        <div class="max-h-40 overflow-y-auto pr-1 space-y-0.5">
          <button
            v-for="m in minutesList"
            :key="m"
            type="button"
            @click="selectMinute(m)"
            :class="[
              'w-full rounded px-1.5 py-1 text-center text-xs font-mono transition-colors',
              selectedMinute === m
                ? 'bg-accent font-bold text-white'
                : 'text-ink hover:bg-accent/15',
            ]"
          >
            {{ m }}
          </button>
        </div>
      </div>

      <div class="mt-2 flex items-center justify-between border-t border-border pt-1.5 text-xs">
        <button
          type="button"
          @click="clear"
          class="text-ink-muted hover:text-red-500"
        >
          Clear
        </button>
        <button
          type="button"
          @click="closeDropdown"
          class="text-accent font-medium hover:underline"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

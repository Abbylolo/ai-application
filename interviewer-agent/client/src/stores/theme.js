import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem('theme') || 'light'
  const theme = ref(saved)

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setTheme(t) {
    theme.value = t
  }

  // 同步到 DOM 和 localStorage
  watch(theme, (val) => {
    document.documentElement.setAttribute('data-theme', val)
    localStorage.setItem('theme', val)
  }, { immediate: true })

  return { theme, toggle, setTheme }
})

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const COLLAPSED_WIDTH = '64px'
const EXPANDED_WIDTH = '220px'

export const useSidebarStore = defineStore('sidebar', () => {
  const isExpanded = ref(localStorage.getItem('sidebar') === 'expanded')

  function apply() {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isExpanded.value ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
    )
  }

  function toggle() {
    isExpanded.value = !isExpanded.value
  }

  watch(isExpanded, (val) => {
    localStorage.setItem('sidebar', val ? 'expanded' : 'collapsed')
    apply()
  })

  apply()

  return { isExpanded, toggle, apply }
})

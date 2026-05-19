<template>
  <header class="app-header">
    <div class="header-left">
      <span class="header-label">Dev Utils</span>
      <h1 class="header-title">{{ currentTool?.name ?? 'Tools' }}</h1>
    </div>
    <div class="header-right">
      <InputText v-model="search" placeholder="Search tools..." class="header-search" size="small" />
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { tools } from '@/router'
import InputText from 'primevue/inputtext'

const route = useRoute()
const search = ref('')
const currentTool = computed(() => tools.find((t) => t.path === route.path))
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  height: var(--header-height);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.75rem;
  z-index: 90;
  transition: left 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-label {
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  display: block;
  line-height: 1;
  margin-bottom: 2px;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-search {
  width: 220px;
}
</style>
